// @ts-nocheck
// lib/langgraph/nodes/context-analyzer-node.ts
/**
 * CONTEXT ANALYZER NODE
 *
 * Role: Intelligent code analyst that understands the existing codebase
 * and determines the scope and nature of required changes.
 *
 * Responsibilities:
 * - Analyze existing files and their structure
 * - Understand user's edit request intent
 * - Determine change scope (minor/moderate/major/structural)
 * - Identify which files need modification
 * - Preserve critical sections (database code, existing features)
 * - Provide editing strategy to Editor Agent
 */

import { generateWithFallback } from '@/lib/ai';
import type { AppGenState } from '../types';
import { emitNodeStart, emitNodeComplete, emitNodeError, emitProgress, emitChatMessage } from '../events';
import { generateWithLogging, estimateTokens } from '@/lib/langgraph/ai-with-logging';
import { getConversationContext, addAssistantMessage } from '@/lib/memory/conversation-memory';

/**
 * Intelligent fallback analysis using keyword heuristics
 * Used when AI JSON parsing fails
 */
function intelligentFallback(
  userRequest: string,
  files: Array<{ path: string; content: string }>
): {
  changeScope: 'minor' | 'moderate' | 'major' | 'structural';
  filesToModify: string[];
  preserveSections: Array<{ file: string; sections: string[] }>;
  editingStrategy: 'targeted-diff' | 'full-regeneration' | 'hybrid';
  reasoning: string;
} {
  const request = userRequest.toLowerCase();

  // Categorize by keywords
  const minorKeywords = ['color', 'font', 'size', 'text', 'spacing', 'padding', 'margin', 'border', 'shadow'];
  const additionKeywords = ['add', 'create', 'new', 'insert', 'include'];
  const removalKeywords = ['remove', 'delete', 'hide', 'eliminate'];
  const majorKeywords = ['page', 'section', 'component', 'feature', 'functionality'];
  const structuralKeywords = ['architecture', 'database', 'backend', 'api', 'restructure', 'refactor'];

  const isMinor = minorKeywords.some(kw => request.includes(kw));
  const isAddition = additionKeywords.some(kw => request.includes(kw));
  const isRemoval = removalKeywords.some(kw => request.includes(kw));
  const isMajor = majorKeywords.some(kw => request.includes(kw));
  const isStructural = structuralKeywords.some(kw => request.includes(kw));

  // Determine scope
  let changeScope: 'minor' | 'moderate' | 'major' | 'structural';
  if (isStructural) changeScope = 'structural';
  else if (isMajor || (isAddition && files.length > 1)) changeScope = 'major';
  else if (isMinor && !isAddition && !isRemoval) changeScope = 'minor';
  else changeScope = 'moderate';

  // Determine files to modify
  let filesToModify: string[];
  if (isMinor && files.length > 1) {
    // Minor changes - likely only main file
    filesToModify = [files[0].path];
  } else if (isAddition && request.includes('.')) {
    // Creating specific file
    const filenameMatch = request.match(/([a-z0-9-_/]+\.(tsx|ts|css|json))/);
    if (filenameMatch) {
      filesToModify = files.map(f => f.path); // Will add new file
    } else {
      filesToModify = [files[0].path];
    }
  } else if (isRemoval) {
    // Removing - might affect multiple files
    filesToModify = files.map(f => f.path);
  } else {
    // Default: modify all
    filesToModify = files.map(f => f.path);
  }

  // Build preservation rules
  const preserveSections: Array<{ file: string; sections: string[] }> = [];
  files.forEach(file => {
    const sections: string[] = [];

    // Always preserve database unless explicitly removing
    if (file.content.includes('window.db') && !request.includes('remove database')) {
      sections.push('window.db code and database API');
    }

    // Preserve navigation unless changing it
    if (file.content.includes('<nav') && !request.includes('navigation') && !request.includes('menu')) {
      sections.push('navigation menu and links');
    }

    // Preserve forms unless changing them
    if (file.content.includes('<form') && !request.includes('form')) {
      sections.push('form elements and handlers');
    }

    if (sections.length > 0) {
      preserveSections.push({ file: file.path, sections });
    }
  });

  // Determine strategy
  const editingStrategy = changeScope === 'minor' ? 'targeted-diff' : 'full-regeneration';

  const reasoning = `Fallback analysis based on keywords. Detected: ${
    [
      isMinor && 'minor change',
      isAddition && 'addition',
      isRemoval && 'removal',
      isMajor && 'major change',
      isStructural && 'structural change'
    ].filter(Boolean).join(', ') || 'moderate change'
  }. Preserving ${preserveSections.length} critical section(s).`;

  return {
    changeScope,
    filesToModify,
    preserveSections,
    editingStrategy,
    reasoning
  };
}

/**
 * Intelligently samples file content for analysis
 * Small files sent in full, large files sampled from start/middle/end
 */
function getFileSample(content: string, path: string): string {
  const MAX_SMALL_FILE = 5000; // 5KB - send in full
  const SAMPLE_SIZE = 1000; // 1KB per sample

  if (content.length <= MAX_SMALL_FILE) {
    return content;
  }

  // For large files, take strategic samples
  const start = content.substring(0, SAMPLE_SIZE);

  // Middle sample (might contain main logic)
  const middleStart = Math.floor(content.length / 2 - SAMPLE_SIZE / 2);
  const middle = content.substring(middleStart, middleStart + SAMPLE_SIZE);

  // End sample (might contain recent additions)
  const end = content.substring(content.length - SAMPLE_SIZE);

  return `${start}

... [File continues, ${Math.floor((content.length - SAMPLE_SIZE * 3) / 1000)}KB omitted] ...

${middle}

... [File continues, showing end sample] ...

${end}`;
}

export async function contextAnalyzerNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    const userRequest = state.editingSession?.userRequest || '';
    const files = state.files || [];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Context Analyzer] 🚀 Starting context analyzer node');
    console.log(`[Context Analyzer] 📝 User Request: "${userRequest.substring(0, 100)}${userRequest.length > 100 ? '...' : ''}"`);
    console.log(`[Context Analyzer] 📊 Analyzing ${files.length} existing file(s):`);
    files.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f.path} (${f.content.length} chars)`);
    });

    // CONVERSATION MEMORY: Get conversation context for context-aware analysis
    console.log('[Context Analyzer] 💬 Loading conversation memory...');
    const conversationContext = getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[Context Analyzer] 💬 Conversation context loaded - enabling context-aware analysis');
    }

    // ✅ FIX 36: REMOVE role messages entirely - only chatty messages
    // Don't emit node start - this creates role-based UI cards (Code Analyst)
    // Keep chat clean with only user-friendly messages

    // Send conversational status message
    emitChatMessage(
      state.projectId,
      "🔍 Let me review your request and analyze the codebase to understand what needs to change...",
      { type: 'info' }
    );

    // Build analysis prompt
    console.log('[Context Analyzer] 🔍 Building analysis prompt...');

    const analysisPrompt = buildAnalysisPrompt(state, conversationContext);
    const estimatedTokensAnalysis = estimateTokens(analysisPrompt);
    console.log(`[Context Analyzer] 🤖 AI Call: Code Analysis (~${estimatedTokensAnalysis} tokens, gemini-2.0-flash)`);

    // Generate analysis
    const analysis = await generateWithLogging({
      prompt: analysisPrompt,
      projectId: state.projectId,
      nodeName: 'context-analyzer',
      callType: 'analysis',
      estimatedTokens: estimatedTokensAnalysis,
      attempt: 1
    });

    // ✅ COMPREHENSIVE LOGGING: Show raw AI response
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Context Analyzer] 📝 RAW AI RESPONSE (first 500 chars):');
    console.log(analysis.substring(0, 500));
    console.log('[Context Analyzer] 📊 Response stats:', {
      totalLength: analysis.length,
      hasJsonBraces: analysis.includes('{') && analysis.includes('}'),
      firstBraceIndex: analysis.indexOf('{'),
      lastBraceIndex: analysis.lastIndexOf('}')
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Parse analysis JSON using safe parser
    let analysisData: any;
    try {
      const { extractAndParseJson } = await import('../utils/json-parser');
      analysisData = extractAndParseJson(analysis);

      if (!analysisData || Object.keys(analysisData).length === 0) {
        throw new Error('No valid JSON found in response');
      }

      console.log('[Context Analyzer] ✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.error('[Context Analyzer] ❌ Failed to parse analysis, using intelligent fallback');
      console.error('[Context Analyzer] Parse error:', parseError);

      // Use smart fallback instead of blanket "regenerate all"
      analysisData = intelligentFallback(userRequest, files);

      console.warn('[Context Analyzer] ⚠️ Fallback analysis:', analysisData.reasoning);
      console.warn('[Context Analyzer] Change scope:', analysisData.changeScope);
      console.warn('[Context Analyzer] Files to modify:', analysisData.filesToModify.length);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Context Analyzer] 📊 ANALYSIS RESULTS:');

    // 🤖 CONVERSATIONAL INTELLIGENCE: Check if this is a question
    if (analysisData.isQuestion) {
      console.log('[Context Analyzer] ❓ User is asking a question, not requesting an edit');
      console.log(`[Context Analyzer] 📝 Question Type: ${analysisData.questionType}`);
      console.log(`[Context Analyzer] 💬 Answering: ${analysisData.answer?.substring(0, 100)}...`);

      // Send conversational answer
      emitChatMessage(
        state.projectId,
        analysisData.answer,
        { type: 'info' }
      );

      // Track in conversation memory
      addAssistantMessage(state.projectId, analysisData.answer, 'context-analyzer');
      console.log('[Context Analyzer] 💬 Tracked answer in conversation memory');

      const duration = Date.now() - startTime;
      console.log(`[Context Analyzer] ✅ Question answered in ${duration}ms`);

      // Return state with no changes needed
      return {
        editingSession: {
          ...state.editingSession!,
          changeScope: 'none',
          filesToModify: [],
          preservedSections: new Map(),
          changesApplied: [],
          isQuestion: true,
          questionAnswered: true
        },
        completedNodes: ['context-analyzer'],
      };
    }

    console.log(`[Context Analyzer] 📊 Change Scope: ${analysisData.changeScope}`);
    console.log(`[Context Analyzer] 📊 Editing Strategy: ${analysisData.editingStrategy}`);
    console.log(`[Context Analyzer] 📊 Files to Modify (${analysisData.filesToModify?.length || 0}):`);
    analysisData.filesToModify?.forEach((file: string, idx: number) => {
      console.log(`  ${idx + 1}. ${file}`);
    });
    console.log(`[Context Analyzer] 📊 Preserve Sections (${analysisData.preserveSections?.length || 0}):`);
    analysisData.preserveSections?.forEach((item: any, idx: number) => {
      console.log(`  ${idx + 1}. ${item.file}: [${item.sections?.join(', ')}]`);
    });
    console.log(`[Context Analyzer] 💭 Reasoning: ${analysisData.reasoning || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Build preservation map
    const preservedSections = new Map<string, string[]>();
    if (analysisData.preserveSections && Array.isArray(analysisData.preserveSections)) {
      for (const item of analysisData.preserveSections) {
        if (item.file && item.sections) {
          preservedSections.set(item.file, item.sections);
        }
      }
    }

    // Update editing session
    const updatedEditingSession = {
      ...state.editingSession!,
      changeScope: analysisData.changeScope || 'moderate',
      filesToModify: analysisData.filesToModify || files.map(f => f.path),
      preservedSections,
      changesApplied: [],
    };

    // Store metadata
    const newArtifacts = new Map(state.artifacts);
    newArtifacts.set('contextAnalysis', {
      changeScope: analysisData.changeScope,
      editingStrategy: analysisData.editingStrategy,
      reasoning: analysisData.reasoning
    });

    const duration = Date.now() - startTime;
    console.log(`[Context Analyzer] ✅ Completed in ${duration}ms`);

    // ✅ FIX 36: Don't emit completion - removes Code Analyst role card
    // Chatty messages will be sent through normal chat flow
    console.log('[Context Analyzer] ✅ Analysis complete');

    // Send conversational completion message
    const scopeDescription = analysisData.changeScope === 'minor'
      ? 'a quick targeted update'
      : analysisData.changeScope === 'moderate'
      ? 'modifications to the relevant files'
      : 'some architectural changes';

    const filesCount = analysisData.filesToModify?.length || 0;
    const fileWord = filesCount === 1 ? 'file' : 'files';

    emitChatMessage(
      state.projectId,
      `✅ Got it! I'll make ${scopeDescription} ${filesCount > 0 ? `across ${filesCount} ${fileWord}` : ''} to ${analysisData.reasoning || 'implement your request'}. Starting the edits now...`,
      { type: 'success' }
    );

    // CONVERSATION MEMORY: Track Context Analyzer's response
    const contextAnalyzerResponse = `Analyzed code - determined ${analysisData.changeScope} changes needed across ${filesCount} file(s). Strategy: ${analysisData.editingStrategy}`;
    addAssistantMessage(state.projectId, contextAnalyzerResponse, 'context-analyzer');
    console.log('[Context Analyzer] 💬 Tracked assistant response in conversation memory');

    return {
      editingSession: updatedEditingSession,
      completedNodes: ['context-analyzer'], // Reducer auto-appends
      artifacts: newArtifacts
    };

  } catch (error) {
    emitNodeError('context-analyzer', error as Error, state);
    console.error('[Context Analyzer] Error:', error);

    // Return safe defaults on error
    return {
      editingSession: {
        ...state.editingSession!,
        changeScope: 'moderate',
        filesToModify: state.files?.map(f => f.path) || [],
        preservedSections: new Map(),
        changesApplied: [],
      },
      completedNodes: ['context-analyzer'], // Reducer auto-appends
      errors: [{ node: 'context-analyzer', message: (error as Error).message }] // Reducer auto-appends
    };
  }
}

function buildAnalysisPrompt(state: AppGenState, conversationContext?: string): string {
  const userRequest = state.editingSession?.userRequest || '';
  const files = state.files || [];

  // Get file summaries (first 200 chars of each file)
  const fileSummaries = files.map(f => ({
    path: f.path,
    size: f.content.length,
    preview: f.content.substring(0, 200) + '...',
    hasDatabase: f.content.includes('window.db'),
    hasMultiPage: f.path.includes('/') && (f.path.match(/page\.tsx$/g) || []).length > 1
  }));

  return `${conversationContext || ''}

You are a Context Analyzer Agent. Your role is to understand the existing codebase and determine the optimal editing strategy.

🤖 **CONVERSATIONAL INTELLIGENCE - DETECT QUESTION vs EDIT REQUEST:**

FIRST, analyze if the user is:
1. **Asking a question** (seeking help/information/explanation)
2. **Requesting an edit** (wants code changes)

**QUESTION INDICATORS:**
- Starts with: "how", "why", "what", "where", "when", "can you explain", "tell me", "show me"
- Contains: "?", "help", "understand", "confused", "issue", "problem", "not working", "error", "stuck"
- Seeking explanation: "how does X work", "what is this", "why is this happening"
- Troubleshooting: "why isn't this working", "what's wrong", "how do I fix"

**EDIT REQUEST INDICATORS:**
- Action verbs: "add", "remove", "change", "update", "modify", "create", "delete", "fix", "implement"
- Imperative: "make the button blue", "create a new page", "remove the header"
- Declarative: "I want", "I need", "let's add", "can you create"

**IF IT'S A QUESTION:**
Return JSON:
{
  "isQuestion": true,
  "questionType": "explanation" | "troubleshooting" | "how-to" | "clarification",
  "answer": "Detailed, helpful answer to the user's question. Be conversational, friendly, and thorough.",
  "changeScope": "none"
}

**IF IT'S AN EDIT REQUEST:**
Return JSON with full analysis (as below)

**EXAMPLES:**

User: "How does the authentication work in this app?"
→ {"isQuestion": true, "questionType": "explanation", "answer": "Based on the code, your app uses [explain the auth system]. The login flow works like [describe flow]...", "changeScope": "none"}

User: "Why isn't the contact form submitting?"
→ {"isQuestion": true, "questionType": "troubleshooting", "answer": "Looking at your contact form, I can see [identify the issue]. The problem is [explain]. To fix this, you need to [suggest solution]...", "changeScope": "none"}

User: "Add a new About page"
→ {"isQuestion": false, ...normal edit analysis...}

User: "Change the button color to blue"
→ {"isQuestion": false, ...normal edit analysis...}

PROJECT CONTEXT:
Description: ${state.userDescription}
${state.plan ? `Plan: ${state.plan}` : ''}
${state.backendConfig ? `Has Database: YES (${state.backendConfig.collections?.length || 0} collections)` : 'Has Database: NO'}
Is Multi-Page: ${state.isMultiPage || files.length > 1}

USER'S MESSAGE:
"${userRequest}"

CURRENT FILES (${files.length} files):
${fileSummaries.map(f => `
• ${f.path} (${f.size} chars)
  Preview: ${f.preview}
  Has Database: ${f.hasDatabase ? 'YES' : 'NO'}
  Has Multi-Page Links: ${f.hasMultiPage ? 'YES' : 'NO'}
`).join('\n')}

FULL FILE CONTENTS (for detailed analysis):
${files.map(f => `
━━━ ${f.path} (${f.content.length} chars) ━━━
${getFileSample(f.content, f.path)}
`).join('\n\n')}

YOUR TASK:
Analyze the user's request and existing code to determine:

1. CHANGE SCOPE:
   - "minor" = Small text/style changes, button colors, etc.
   - "moderate" = Add/remove a section, modify a feature
   - "major" = Add new pages, significant restructuring
   - "structural" = Change entire architecture, add database, etc.

2. FILES TO MODIFY:
   - Which files need changes to fulfill the request?
   - Be specific! Don't modify files that don't need changes.

3. SECTIONS TO PRESERVE:
   - ALWAYS preserve window.db code unless user asks to change database
   - ALWAYS preserve navigation links unless user asks to change them
   - ALWAYS preserve existing features unless user asks to remove them
   - Identify other critical sections (form handlers, event listeners, etc.)

4. EDITING STRATEGY:
   - "targeted-diff" = Only change specific sections (PREFERRED for minor/moderate)
   - "full-regeneration" = Regenerate entire files (use for major/structural)
   - "hybrid" = Mix of both approaches

CRITICAL RULES:
- If user says "add", don't remove existing code
- If user says "change the button", only modify button-related code
- If user says "fix the bug", identify the bug location and fix ONLY that
- ALWAYS preserve database integration unless explicitly asked to change it
- ALWAYS preserve multi-page routing unless explicitly asked to change it

Return ONLY valid JSON with this structure:
{
  "changeScope": "minor" | "moderate" | "major" | "structural",
  "filesToModify": ["app/page.tsx", "components/Header.tsx"],
  "preserveSections": [
    {"file": "app/page.tsx", "sections": ["window.db code", "navigation links"]},
    {"file": "app/about/page.tsx", "sections": ["contact form handler"]}
  ],
  "editingStrategy": "targeted-diff" | "full-regeneration" | "hybrid",
  "reasoning": "Brief explanation (2-3 sentences) of your analysis and strategy"
}

Analyze now:`;
}
