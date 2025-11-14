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

import { generateWithFallback } from '@/lib/ai/ai';
import type { AppGenState } from '../../types';
import { emitNodeStart, emitNodeComplete, emitNodeError, emitProgress, emitChatMessage } from '../../utils/logging/events';
import { generateWithLogging, estimateTokens } from '../../utils/logging/ai-with-logging';
import { getConversationContext, addAssistantMessage } from '@/lib/memory/conversation-memory';
import { withLangSmithTracing, traceAICall } from '@/lib/langsmith/tracing';

/**
 * Intelligent fallback analysis using keyword heuristics
 * Used when AI JSON parsing fails
 */
function intelligentFallback(
  userRequest: string,
  files: Array<{ path: string; content: string }>,
  backendConfig?: any
): {
  requestType: 'question' | 'edit' | 'feature';
  requiresFullWorkflow: boolean;
  changeScope: 'minor' | 'moderate' | 'major' | 'structural';
  filesToModify: string[];
  preserveSections: Array<{ file: string; sections: string[] }>;
  editingStrategy: 'targeted-diff' | 'full-regeneration' | 'hybrid';
  reasoning: string;
  suggestedFeatureName?: string;
  estimatedComplexity?: 'simple' | 'moderate' | 'complex';
} {
  const request = userRequest.toLowerCase();

  // System-level feature keywords (aligned with PM node)
  const systemFeatureKeywords = [
    'authentication', 'auth', 'login', 'signup', 'register',
    'payment', 'checkout', 'stripe', 'paypal',
    'blog', 'posts', 'articles',
    'cart', 'shopping', 'e-commerce', 'ecommerce',
    'admin panel', 'dashboard',
    'user management', 'user system'
  ];

  // Check for system-level feature patterns
  const isFeatureRequest = systemFeatureKeywords.some(keyword =>
    request.includes(`add ${keyword}`) ||
    request.includes(`create ${keyword}`) ||
    request.includes(`implement ${keyword}`)
  );

  // Check if requires new collections
  const requiresNewCollection =
    (request.includes('save') && request.includes('data')) ||
    (request.includes('store') && !request.includes('store page')) ||
    request.includes('database') ||
    request.includes('collection') ||
    request.includes('persist');

  // Check for existing backend collections
  const hasBackend = backendConfig && backendConfig.collections && backendConfig.collections.length > 0;

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

  // FEATURE DETECTION: If this requires backend or is a complex feature, route to full workflow
  if (isFeatureRequest || (requiresNewCollection && !hasBackend)) {
    // Extract feature name
    let suggestedFeatureName = 'unknown';
    for (const keyword of featureKeywords) {
      if (request.includes(keyword)) {
        suggestedFeatureName = keyword;
        break;
      }
    }

    // Determine complexity
    const estimatedComplexity =
      request.includes('auth') || request.includes('payment') ? 'complex' :
      request.includes('cart') || request.includes('blog') ? 'moderate' :
      'simple';

    return {
      requestType: 'feature',
      requiresFullWorkflow: true,
      changeScope: 'structural',
      filesToModify: [],
      preserveSections: [],
      editingStrategy: 'full-regeneration',
      reasoning: `System-level feature (${suggestedFeatureName}) requires PM planning, backend collections, and full workflow.`,
      suggestedFeatureName,
      estimatedComplexity
    };
  }

  // Determine scope for regular edits
  // FIX #2: Detect page/route/screen creation requests and escalate to major scope
  const isPageCreation = isAddition && (
    request.includes('page') ||
    request.includes('route') ||
    request.includes('screen')
  );

  let changeScope: 'minor' | 'moderate' | 'major' | 'structural';
  if (isStructural) changeScope = 'structural';
  else if (isMajor || isPageCreation) changeScope = 'major';
  else if (isAddition && files.length > 1) changeScope = 'major';
  else if (isMinor && !isAddition && !isRemoval) changeScope = 'minor';
  else changeScope = 'moderate';

  // Determine files to modify
  let filesToModify: string[];
  if (isMinor && files.length > 1) {
    // Minor changes - likely only main file
    filesToModify = [files[0].path];
  } else if (isAddition) {
    // FIX #3: Extract page name from request and create new file path
    const pageMatch = request.match(/(?:add|create)\s+(?:a\s+)?(?:new\s+)?([a-z0-9-]+)(?:\s+page)?/i);
    if (pageMatch && isPageCreation) {
      const pageName = pageMatch[1];
      const newFilePath = `src/app/${pageName}/page.tsx`;
      filesToModify = [newFilePath];
      console.log(`[Context-Analyzer] 🆕 Creating new file: ${newFilePath}`);
    } else if (request.includes('.')) {
      // Creating specific file with extension
      const filenameMatch = request.match(/([a-z0-9-_/]+\.(tsx|ts|css|json))/);
      if (filenameMatch) {
        filesToModify = [filenameMatch[0]];
      } else {
        filesToModify = [files[0].path];
      }
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
    requestType: 'edit',
    requiresFullWorkflow: false,
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

async function contextAnalyzerNodeImpl(state: AppGenState): Promise<Partial<AppGenState>> {
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

    // ✅ PHASE 3: Get conversation context from memory (async)
    console.log('[Context Analyzer] 💬 Loading conversation memory...');
    const conversationContext = await getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[Context Analyzer] ✅ Loaded conversation context - enabling context-aware analysis');
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
    const analysis = await traceAICall('context-analyzer-analysis', async () => {
      return await generateWithLogging({
        prompt: analysisPrompt,
        projectId: state.projectId,
        nodeName: 'context-analyzer',
        callType: 'analysis',
        estimatedTokens: estimatedTokensAnalysis,
        attempt: 1
      });
    }, {
      userRequest,
      filesCount: files.length,
      estimatedTokens: estimatedTokensAnalysis,
      hasConversationContext: !!conversationContext
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
      const { extractAndParseJson } = await import('../../utils/json-parser');
      analysisData = extractAndParseJson(analysis);

      if (!analysisData || Object.keys(analysisData).length === 0) {
        throw new Error('No valid JSON found in response');
      }

      console.log('[Context Analyzer] ✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.error('[Context Analyzer] ❌ Failed to parse analysis, using intelligent fallback');
      console.error('[Context Analyzer] Parse error:', parseError);

      // Use smart fallback instead of blanket "regenerate all"
      analysisData = intelligentFallback(userRequest, files, state.backendConfig);

      console.warn('[Context Analyzer] ⚠️ Fallback analysis:', analysisData.reasoning);
      console.warn('[Context Analyzer] Request type:', analysisData.requestType);
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
      await addAssistantMessage(state.projectId, analysisData.answer, 'context-analyzer');
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

    // 🎯 FEATURE REQUEST DETECTION: Route to full PM→UX→Backend→Frontend workflow
    if (analysisData.requestType === 'feature' || analysisData.requiresFullWorkflow) {
      console.log('[Context Analyzer] 🎯 Feature request detected - routing to PM node');
      console.log(`[Context Analyzer] 📦 Feature: ${analysisData.suggestedFeatureName || 'unknown'}`);
      console.log(`[Context Analyzer] 🔧 Complexity: ${analysisData.estimatedComplexity || 'moderate'}`);
      console.log(`[Context Analyzer] 💭 Reasoning: ${analysisData.reasoning}`);

      // Send conversational message
      emitChatMessage(
        state.projectId,
        `🎯 This is a feature addition that requires planning and backend integration. Routing to the full workflow (PM → UX → Backend → Frontend) to build this properly...`,
        { type: 'info' }
      );

      // Track in conversation memory
      await addAssistantMessage(
        state.projectId,
        `Detected feature request: ${analysisData.suggestedFeatureName}. Routing to PM node for full workflow.`,
        'context-analyzer'
      );

      const duration = Date.now() - startTime;
      console.log(`[Context Analyzer] ✅ Feature detected in ${duration}ms, routing to PM`);

      // Return state that will route to PM node
      return {
        editingSession: {
          ...state.editingSession!,
          requestType: 'feature',
          requiresFullWorkflow: true,
          changeScope: 'structural',
          filesToModify: [],
          preservedSections: new Map(),
          changesApplied: [],
          suggestedFeatureName: analysisData.suggestedFeatureName,
          estimatedComplexity: analysisData.estimatedComplexity
        },
        // Prepare userDescription for PM node
        userDescription: state.editingSession?.userRequest || state.userDescription,
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
    await addAssistantMessage(state.projectId, contextAnalyzerResponse, 'context-analyzer');
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

🤖 **EDITING WORKFLOW - DETECT REQUEST TYPE:**

Your job: Determine if this is a QUESTION, SIMPLE EDIT, or FEATURE REQUEST

**QUESTION** (Answer directly):
- Starts with: "how", "why", "what", "where", "can you explain"
- Contains: "?", "help", "understand", "not working", "error"
- Example: "How does authentication work?", "Why isn't this form submitting?"

**SIMPLE EDIT** (Stay in editor workflow):
- Style/text changes to existing files: "change color", "fix typo", "update text"
- Modify 1-2 existing files only
- Add/remove sections from existing pages
- Example: "Change button color to blue", "Add testimonials section to homepage", "Remove footer"

**FEATURE REQUEST** (Route to PM node for full planning):
- Requires NEW database collection (users, orders, products, posts)
- Needs 2+ new routes/pages
- System-level: Auth, Payments, Admin Panel, Dashboard, Blog, E-commerce
- Complex business logic
- Example: "Add authentication", "Add shopping cart", "Add blog with posts"

**IF IT'S A QUESTION:**
Return JSON:
{
  "isQuestion": true,
  "questionType": "explanation" | "troubleshooting" | "how-to" | "clarification",
  "answer": "Detailed, helpful answer to the user's question. Be conversational, friendly, and thorough.",
  "changeScope": "none"
}

**IF IT'S A FEATURE REQUEST:**
Return JSON:
{
  "requestType": "feature",
  "requiresFullWorkflow": true,
  "suggestedFeatureName": "authentication" | "payment" | "blog" | "cart" | etc.,
  "estimatedComplexity": "simple" | "moderate" | "complex",
  "reasoning": "Brief explanation of why this is a feature requiring full workflow",
  "changeScope": "structural"
}

**IF IT'S A SIMPLE EDIT:**
Return JSON with full analysis (as below)

PROJECT CONTEXT:
Description: ${state.userDescription}
${state.plan ? `Plan: ${state.plan}` : ''}
${state.backendConfig ? `Has Database: YES (${state.backendConfig.collections?.length || 0} collections)` : 'Has Database: NO'}
Is Multi-Page: ${state.isMultiPage || files.length > 1}

USER'S MESSAGE:
"${userRequest}"

CURRENT FILES (${files.length} files):
${fileSummaries.map(f => `• ${f.path} (${f.size} chars, ${f.hasDatabase ? 'has DB' : 'no DB'})`).join('\n')}

YOUR TASK:
Analyze the request and determine the type:

**CHANGE SCOPE** (for edits only):
- "minor" = Style/text changes (colors, fonts, wording)
- "moderate" = Add/remove sections in existing files
- "major" = Add new pages or significant changes
- "structural" = Architecture/database changes (should be FEATURE)

**EDITING STRATEGY** (for edits only):
- "targeted-diff" = Change specific sections (use for minor/moderate)
- "full-regeneration" = Regenerate entire files (use for major)
- "hybrid" = Mix of both

**CRITICAL RULES:**
- If requires NEW database collection → requestType: "feature"
- If system-level feature (auth/payments/admin/blog) → requestType: "feature"
- Simple edits to existing files → requestType: "edit"

Return ONLY valid JSON:
{
  "isQuestion": true/false,
  "requestType": "question" | "edit" | "feature",
  "requiresFullWorkflow": true/false,
  "changeScope": "none" | "minor" | "moderate" | "major" | "structural",
  "filesToModify": ["file1", "file2"],
  "preserveSections": [{"file": "path", "sections": ["section1"]}],
  "editingStrategy": "targeted-diff" | "full-regeneration" | "hybrid",
  "reasoning": "Brief explanation",
  "answer": "For questions only",
  "suggestedFeatureName": "For features only",
  "estimatedComplexity": "For features only"
}

Analyze now:`;
}


// Export traced version of context analyzer node
export const contextAnalyzerNode = withLangSmithTracing('context-analyzer', contextAnalyzerNodeImpl);
