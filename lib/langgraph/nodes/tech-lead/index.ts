// @ts-nocheck
// lib/langgraph/nodes/tech-lead/index.ts
/**
 * TECH LEAD NODE
 *
 * Role: Technical leader that delegates tasks to specialized nodes
 * Receives pre-analyzed intent from Input Detector and routes accordingly
 *
 * Responsibilities:
 * - Receive reasoning context from Input Detector
 * - Understand the codebase context
 * - Determine which specialized node should handle the request
 * - Route to: PM (features) | UX (design) | Backend (schema) | Frontend (UI) | Editor (simple edits)
 * - Provide clear routing explanation
 */

import { generateWithFallback } from '@/lib/ai/ai';
import { traceAICall, withLangSmithTracing } from '@/lib/langsmith/tracing';
import { getConversationContext } from '@/lib/memory/conversation-memory';
import { messageManager } from '@/lib/messaging/message-manager';
import type { AppGenState } from '../../types';
import { estimateTokens, generateWithLogging } from '../../utils/logging/ai-with-logging';
import {
  emitNodeComplete,
  emitNodeError,
  emitNodeStart,
  emitProgress,
} from '../../utils/logging/events';

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
    'authentication',
    'auth',
    'login',
    'signup',
    'register',
    'payment',
    'checkout',
    'stripe',
    'paypal',
    'blog',
    'posts',
    'articles',
    'cart',
    'shopping',
    'e-commerce',
    'ecommerce',
    'admin panel',
    'dashboard',
    'user management',
    'user system',
  ];

  // Check for system-level feature patterns
  const isFeatureRequest = systemFeatureKeywords.some(
    (keyword) =>
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
  const hasBackend =
    backendConfig && backendConfig.collections && backendConfig.collections.length > 0;

  // Categorize by keywords
  const minorKeywords = [
    'color',
    'font',
    'size',
    'text',
    'spacing',
    'padding',
    'margin',
    'border',
    'shadow',
  ];
  const additionKeywords = ['add', 'create', 'new', 'insert', 'include'];
  const removalKeywords = ['remove', 'delete', 'hide', 'eliminate'];
  const majorKeywords = ['page', 'section', 'component', 'feature', 'functionality'];
  const structuralKeywords = [
    'architecture',
    'database',
    'backend',
    'api',
    'restructure',
    'refactor',
  ];

  const isMinor = minorKeywords.some((kw) => request.includes(kw));
  const isAddition = additionKeywords.some((kw) => request.includes(kw));
  const isRemoval = removalKeywords.some((kw) => request.includes(kw));
  const isMajor = majorKeywords.some((kw) => request.includes(kw));
  const isStructural = structuralKeywords.some((kw) => request.includes(kw));

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
      request.includes('auth') || request.includes('payment')
        ? 'complex'
        : request.includes('cart') || request.includes('blog')
          ? 'moderate'
          : 'simple';

    return {
      requestType: 'feature',
      requiresFullWorkflow: true,
      changeScope: 'structural',
      filesToModify: [],
      preserveSections: [],
      editingStrategy: 'full-regeneration',
      reasoning: `System-level feature (${suggestedFeatureName}) requires PM planning, backend collections, and full workflow.`,
      suggestedFeatureName,
      estimatedComplexity,
    };
  }

  // Determine scope for regular edits
  // FIX #2: Detect page/route/screen creation requests and escalate to major scope
  const isPageCreation =
    isAddition &&
    (request.includes('page') || request.includes('route') || request.includes('screen'));

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
    const pageMatch = request.match(
      /(?:add|create)\s+(?:a\s+)?(?:new\s+)?([a-z0-9-]+)(?:\s+page)?/i
    );
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
    filesToModify = files.map((f) => f.path);
  } else {
    // Default: modify all
    filesToModify = files.map((f) => f.path);
  }

  // Build preservation rules
  const preserveSections: Array<{ file: string; sections: string[] }> = [];
  files.forEach((file) => {
    const sections: string[] = [];

    // Always preserve database unless explicitly removing
    if (file.content.includes('window.db') && !request.includes('remove database')) {
      sections.push('window.db code and database API');
    }

    // Preserve navigation unless changing it
    if (
      file.content.includes('<nav') &&
      !request.includes('navigation') &&
      !request.includes('menu')
    ) {
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
      isStructural && 'structural change',
    ]
      .filter(Boolean)
      .join(', ') || 'moderate change'
  }. Preserving ${preserveSections.length} critical section(s).`;

  return {
    requestType: 'edit',
    requiresFullWorkflow: false,
    changeScope,
    filesToModify,
    preserveSections,
    editingStrategy,
    reasoning,
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

async function techLeadNodeImpl(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    const userRequest = state.editingSession?.userRequest || '';
    const files = state.files || [];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Tech Lead] 🚀 Starting tech lead node');
    console.log(
      `[Tech Lead] 📝 User Request: "${userRequest.substring(0, 100)}${userRequest.length > 100 ? '...' : ''}"`
    );
    console.log(`[Tech Lead] 📊 Analyzing ${files.length} existing file(s):`);
    files.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f.path} (${f.content.length} chars)`);
    });

    // Receive reasoning context from Input Detector
    const inputReasoning = state.reasoningContext;
    if (inputReasoning) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[Tech Lead] 📥 RECEIVED REASONING FROM INPUT DETECTOR:');
      console.log(`[Tech Lead] Intent: ${inputReasoning.intent}`);
      console.log(`[Tech Lead] Type: ${inputReasoning.intentType}`);
      console.log(`[Tech Lead] Confidence: ${inputReasoning.confidence}`);
      console.log(`[Tech Lead] Suggested Action: ${inputReasoning.suggestedAction}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // Load conversation context
    console.log('[Tech Lead] 💬 Loading conversation memory...');
    const conversationContext = await getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[Tech Lead] ✅ Loaded conversation context - enabling context-aware analysis');
    }

    // Send conversational status message via MessageManager
    await messageManager.sendInfo(
      state.projectId,
      'Let me review your request and analyze the codebase to understand what needs to change...',
      'tech-lead'
    );

    // Build analysis prompt
    console.log('[Tech Lead] 🔍 Building analysis prompt...');

    const analysisPrompt = buildAnalysisPrompt(state, conversationContext);
    const estimatedTokensAnalysis = estimateTokens(analysisPrompt);
    console.log(
      `[Tech Lead] 🤖 AI Call: Code Analysis (~${estimatedTokensAnalysis} tokens, gemini-2.0-flash)`
    );

    // Generate analysis
    const analysis = await traceAICall(
      'context-analyzer-analysis',
      async () => {
        return await generateWithLogging({
          prompt: analysisPrompt,
          projectId: state.projectId,
          nodeName: 'tech-lead',
          callType: 'analysis',
          estimatedTokens: estimatedTokensAnalysis,
          attempt: 1,
        });
      },
      {
        userRequest,
        filesCount: files.length,
        estimatedTokens: estimatedTokensAnalysis,
        hasConversationContext: !!conversationContext,
      }
    );

    // ✅ COMPREHENSIVE LOGGING: Show raw AI response
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Tech Lead] 📝 RAW AI RESPONSE (first 500 chars):');
    console.log(analysis.substring(0, 500));
    console.log('[Tech Lead] 📊 Response stats:', {
      totalLength: analysis.length,
      hasJsonBraces: analysis.includes('{') && analysis.includes('}'),
      firstBraceIndex: analysis.indexOf('{'),
      lastBraceIndex: analysis.lastIndexOf('}'),
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

      console.log('[Tech Lead] ✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.error('[Tech Lead] ❌ Failed to parse analysis, using intelligent fallback');
      console.error('[Tech Lead] Parse error:', parseError);

      // Use smart fallback instead of blanket "regenerate all"
      analysisData = intelligentFallback(userRequest, files, state.backendConfig);

      console.warn('[Tech Lead] ⚠️ Fallback analysis:', analysisData.reasoning);
      console.warn('[Tech Lead] Request type:', analysisData.requestType);
      console.warn('[Tech Lead] Change scope:', analysisData.changeScope);
      console.warn('[Tech Lead] Files to modify:', analysisData.filesToModify.length);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Tech Lead] 📊 ANALYSIS RESULTS:');

    // 🤖 CONVERSATIONAL INTELLIGENCE: Check if this is a question
    if (analysisData.isQuestion) {
      console.log('[Tech Lead] ❓ User is asking a question, not requesting an edit');
      console.log(`[Tech Lead] 📝 Question Type: ${analysisData.questionType}`);
      console.log(`[Tech Lead] 💬 Answering: ${analysisData.answer?.substring(0, 100)}...`);

      // ✅ NEW: Send answer via MessageManager
      await messageManager.sendInfo(state.projectId, analysisData.answer, 'tech-lead');
      console.log('[Tech Lead] 💬 Sent answer via MessageManager');

      const duration = Date.now() - startTime;
      console.log(`[Tech Lead] ✅ Question answered in ${duration}ms`);

      // Return state with no changes needed
      return {
        editingSession: {
          ...state.editingSession!,
          changeScope: 'none',
          filesToModify: [],
          preservedSections: new Map(),
          changesApplied: [],
          isQuestion: true,
          questionAnswered: true,
        },
        completedNodes: ['tech-lead'],
      };
    }

    // 🎯 ROUTING DECISION: Determine which node to start from
    const startNode = analysisData.startNode || 'pm'; // Default to PM for safety
    const routesToSpecializedNode = ['pm', 'ux', 'backend', 'frontend'].includes(startNode);

    if (routesToSpecializedNode) {
      console.log('[Tech Lead] 🎯 Routing decision:');
      console.log(`[Tech Lead]   Request type: ${analysisData.requestType}`);
      console.log(
        `[Tech Lead]   Affects features: ${analysisData.affectsFeatures || false}`
      );
      console.log(`[Tech Lead]   Affects design: ${analysisData.affectsDesign || false}`);
      console.log(`[Tech Lead]   Affects backend: ${analysisData.affectsBackend || false}`);
      console.log(
        `[Tech Lead]   Affects frontend: ${analysisData.affectsFrontend || false}`
      );
      console.log(`[Tech Lead]   Starting at: ${startNode.toUpperCase()} node`);
      console.log(`[Tech Lead] 💭 Reasoning: ${analysisData.reasoning}`);

      // Send conversational message based on routing
      const routeMessages: Record<string, string> = {
        pm: `🎯 This is a feature addition that requires planning. Routing to PM → UX → Backend → Frontend workflow...`,
        ux: `🎨 This is a design change. Routing to UX → Frontend workflow to update your styling...`,
        backend: `🗄️ This is a backend schema change. Routing to Backend → Frontend workflow to update your database...`,
        frontend: `⚡ This is a frontend change. Routing to Frontend workflow to update your UI...`,
      };

      // ✅ NEW: Send routing message via MessageManager
      await messageManager.sendInfo(
        state.projectId,
        routeMessages[startNode] || routeMessages.pm,
        'tech-lead'
      );

      const duration = Date.now() - startTime;
      console.log(
        `[Tech Lead] ✅ Routing detected in ${duration}ms, starting at ${startNode.toUpperCase()}`
      );

      // Return state that will route to appropriate node
      return {
        editingSession: {
          ...state.editingSession!,
          requestType: analysisData.requestType,
          requiresFullWorkflow: startNode === 'pm', // True only if starting at PM
          affectsFeatures: analysisData.affectsFeatures || false,
          affectsDesign: analysisData.affectsDesign || false,
          affectsBackend: analysisData.affectsBackend || false,
          affectsFrontend: analysisData.affectsFrontend || false,
          startNode: startNode,
          changeScope: analysisData.changeScope || 'moderate',
          filesToModify: analysisData.filesToModify || [],
          preservedSections: new Map(),
          changesApplied: [],
          reasoning: analysisData.reasoning,
          suggestedFeatureName: analysisData.suggestedFeatureName,
          estimatedComplexity: analysisData.estimatedComplexity,
        },
        // Prepare userDescription for nodes that need it (PM, UX, Backend, Frontend)
        userDescription: state.editingSession?.userRequest || state.userDescription,
        completedNodes: ['tech-lead'],
      };
    }

    console.log(`[Tech Lead] 📊 Change Scope: ${analysisData.changeScope}`);
    console.log(`[Tech Lead] 📊 Editing Strategy: ${analysisData.editingStrategy}`);
    console.log(
      `[Tech Lead] 📊 Files to Modify (${analysisData.filesToModify?.length || 0}):`
    );
    analysisData.filesToModify?.forEach((file: string, idx: number) => {
      console.log(`  ${idx + 1}. ${file}`);
    });
    console.log(
      `[Tech Lead] 📊 Preserve Sections (${analysisData.preserveSections?.length || 0}):`
    );
    analysisData.preserveSections?.forEach((item: any, idx: number) => {
      console.log(`  ${idx + 1}. ${item.file}: [${item.sections?.join(', ')}]`);
    });
    console.log(`[Tech Lead] 💭 Reasoning: ${analysisData.reasoning || 'N/A'}`);
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
      filesToModify: analysisData.filesToModify || files.map((f) => f.path),
      preservedSections,
      changesApplied: [],
    };

    // Store metadata
    const newArtifacts = new Map(state.artifacts);
    newArtifacts.set('contextAnalysis', {
      changeScope: analysisData.changeScope,
      editingStrategy: analysisData.editingStrategy,
      reasoning: analysisData.reasoning,
    });

    const duration = Date.now() - startTime;
    console.log(`[Tech Lead] ✅ Completed in ${duration}ms`);

    // ✅ FIX 36: Don't emit completion - removes Code Analyst role card
    // Chatty messages will be sent through normal chat flow
    console.log('[Tech Lead] ✅ Analysis complete');

    // Send conversational completion message
    const scopeDescription =
      analysisData.changeScope === 'minor'
        ? 'a quick targeted update'
        : analysisData.changeScope === 'moderate'
          ? 'modifications to the relevant files'
          : 'some architectural changes';

    const filesCount = analysisData.filesToModify?.length || 0;
    const fileWord = filesCount === 1 ? 'file' : 'files';

    // ✅ NEW: Send analysis complete via MessageManager
    await messageManager.sendEvent(
      state.projectId,
      {
        type: 'analysis-complete',
        changeScope: analysisData.changeScope,
        requiresFullWorkflow: analysisData.requiresFullWorkflow || false,
        interpretation: `I'll make ${scopeDescription} ${filesCount > 0 ? `across ${filesCount} ${fileWord}` : ''}`,
        plan: analysisData.reasoning || 'implement your request',
      },
      'tech-lead'
    );
    console.log('[Tech Lead] 💬 Sent analysis complete via MessageManager');

    return {
      editingSession: updatedEditingSession,
      completedNodes: ['tech-lead'], // Reducer auto-appends
      artifacts: newArtifacts,
    };
  } catch (error) {
    emitNodeError('tech-lead', error as Error, state);
    console.error('[Tech Lead] Error:', error);

    // Return safe defaults on error
    return {
      editingSession: {
        ...state.editingSession!,
        changeScope: 'moderate',
        filesToModify: state.files?.map((f) => f.path) || [],
        preservedSections: new Map(),
        changesApplied: [],
      },
      completedNodes: ['tech-lead'], // Reducer auto-appends
      errors: [{ node: 'tech-lead', message: (error as Error).message }], // Reducer auto-appends
    };
  }
}

function buildAnalysisPrompt(state: AppGenState, conversationContext?: string): string {
  const userRequest = state.editingSession?.userRequest || '';
  const files = state.files || [];

  // Get file summaries (first 200 chars of each file)
  const fileSummaries = files.map((f) => ({
    path: f.path,
    size: f.content.length,
    preview: f.content.substring(0, 200) + '...',
    hasDatabase: f.content.includes('window.db'),
    hasMultiPage: f.path.includes('/') && (f.path.match(/page\.tsx$/g) || []).length > 1,
  }));

  return `${conversationContext || ''}

You are a Context Analyzer Agent. Your role is to understand the existing codebase and determine the optimal editing strategy.

🤖 **EDITING WORKFLOW - DETECT REQUEST TYPE:**

Your job: Determine if this is a QUESTION, SIMPLE EDIT, or FEATURE REQUEST

**QUESTION** (Answer directly):
- Starts with: "how", "why", "what", "where", "can you explain"
- Contains: "?", "help", "understand", "not working", "error"
- Example: "How does authentication work?", "Why isn't this form submitting?"

**DESIGN CHANGE** (Route to UX node):
- Style/color/font changes: "change primary color", "make buttons rounded", "change font"
- Layout changes: "make hero section smaller", "center the content"
- Animation changes: "add fade-in effect", "make menu slide in"
- Example: "Change primary color to blue", "Make all buttons have rounded corners"

**BACKEND CHANGE** (Route to Backend node):
- Add/modify database fields: "add 'bio' field to users", "make email required"
- Add/modify collections: "add 'featured' boolean to posts"
- Schema changes only (no new features)
- Example: "Add 'phone' field to users collection", "Add 'published' boolean to posts"

**FRONTEND CHANGE** (Stay in editor or route to Frontend):
- Text/typo fixes: "fix typo on homepage", "change button text"
- Add/remove sections: "add testimonials section", "remove footer"
- Small UI tweaks to existing pages
- Example: "Fix typo", "Add testimonials section to homepage"

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

**IF IT'S A DESIGN CHANGE:**
Return JSON:
{
  "requestType": "design-change",
  "affectsDesign": true,
  "affectsFrontend": true,
  "startNode": "ux",
  "changeScope": "minor" | "moderate",
  "reasoning": "Brief explanation of design changes needed"
}

**IF IT'S A BACKEND CHANGE:**
Return JSON:
{
  "requestType": "backend-change",
  "affectsBackend": true,
  "affectsFrontend": true,
  "startNode": "backend",
  "changeScope": "moderate",
  "reasoning": "Brief explanation of schema changes needed"
}

**IF IT'S A FRONTEND CHANGE:**
Return JSON:
{
  "requestType": "frontend-change",
  "affectsFrontend": true,
  "startNode": "frontend",
  "changeScope": "minor",
  "filesToModify": ["app/page.tsx"],
  "reasoning": "Brief explanation of UI changes needed"
}

**IF IT'S A FEATURE REQUEST:**
Return JSON:
{
  "requestType": "feature",
  "requiresFullWorkflow": true,
  "affectsFeatures": true,
  "affectsBackend": true,
  "affectsFrontend": true,
  "startNode": "pm",
  "suggestedFeatureName": "authentication" | "payment" | "blog" | "cart" | etc.,
  "estimatedComplexity": "simple" | "moderate" | "complex",
  "reasoning": "Brief explanation of why this is a feature requiring full workflow",
  "changeScope": "structural"
}

PROJECT CONTEXT:
Description: ${state.userDescription}
${state.plan ? `Plan: ${state.plan}` : ''}
${state.backendConfig ? `Has Database: YES (${state.backendConfig.collections?.length || 0} collections)` : 'Has Database: NO'}
Is Multi-Page: ${state.isMultiPage || files.length > 1}

USER'S MESSAGE:
"${userRequest}"

CURRENT FILES (${files.length} files):
${fileSummaries.map((f) => `• ${f.path} (${f.size} chars, ${f.hasDatabase ? 'has DB' : 'no DB'})`).join('\n')}

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

**CRITICAL ROUTING RULES:**
- NEW database collection → requestType: "feature", startNode: "pm"
- System feature (auth/payments/blog) → requestType: "feature", startNode: "pm"
- Style/color/layout changes → requestType: "design-change", startNode: "ux"
- Schema field changes → requestType: "backend-change", startNode: "backend"
- Text/section changes → requestType: "frontend-change", startNode: "frontend"

**EXAMPLES:**
Request: "Add user authentication"
→ { requestType: "feature", affectsFeatures: true, affectsBackend: true, affectsFrontend: true, startNode: "pm" }

Request: "Change primary color to blue"
→ { requestType: "design-change", affectsDesign: true, affectsFrontend: true, startNode: "ux" }

Request: "Add 'bio' field to users collection"
→ { requestType: "backend-change", affectsBackend: true, affectsFrontend: true, startNode: "backend" }

Request: "Fix typo on homepage"
→ { requestType: "frontend-change", affectsFrontend: true, startNode: "frontend" }

Return ONLY valid JSON:
{
  "isQuestion": boolean,
  "requestType": "question" | "design-change" | "backend-change" | "frontend-change" | "feature",
  "affectsFeatures": boolean (optional),
  "affectsDesign": boolean (optional),
  "affectsBackend": boolean (optional),
  "affectsFrontend": boolean (optional),
  "startNode": "pm" | "ux" | "backend" | "frontend" (optional),
  "requiresFullWorkflow": boolean (optional),
  "changeScope": "none" | "minor" | "moderate" | "major" | "structural",
  "filesToModify": string[] (optional),
  "reasoning": "Brief explanation",
  "answer": string (for questions only),
  "suggestedFeatureName": string (for features only),
  "estimatedComplexity": "simple" | "moderate" | "complex" (for features only)
}

Analyze now:`;
}

// Export traced version of tech lead node
export const techLeadNode = withLangSmithTracing('tech-lead', techLeadNodeImpl);
