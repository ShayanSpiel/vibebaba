// @ts-nocheck
// lib/langgraph/nodes/qa-node.ts
import { validateCode } from '@/lib/validation';
import { autoGenDebugWorkflow } from '@/lib/langgraph/subgraphs/autogen-debugger';
import type { AppGenState } from '../types';
import { emitNodeStart, emitNodeComplete, emitNodeError, emitProgress } from '../events';
import { getConversationContext, addAssistantMessage, conversationMemoryStore } from '@/lib/memory/conversation-memory';

/**
 * Validate required Next.js files exist
 */
function validateRequiredNextJSFiles(
  files: Array<{ path: string; content: string }>,
  hasBackend: boolean
): Array<{ type: string; message: string; file?: string; line?: number }> {
  const errors: Array<{ type: string; message: string; file?: string; line?: number }> = [];

  // Static export mode - only check essential Next.js files
  const requiredFiles = [
    { path: 'src/app/layout.tsx', name: 'Root layout' },
    { path: 'src/app/page.tsx', name: 'Home page' },
  ];

  // NOTE: db.ts not required in static export mode (backend is disabled)

  for (const required of requiredFiles) {
    if (!files.find(f => f.path === required.path)) {
      errors.push({
        type: 'structure',
        message: `Missing required Next.js file: ${required.path} (${required.name}). This file is mandatory for Next.js apps.`,
      });
    }
  }

  return errors;
}

/**
 * Validate backend-frontend integration
 * Checks if forms call API client functions when backend exists
 */
function validateBackendIntegration(
  files: Array<{ path: string; content: string }>,
  backendConfig: { collections: Array<{ name: string; fields: any[] }>; apiEndpoints?: Array<{ method: string; path: string; handler: string }> }
): Array<{ type: string; message: string; file?: string; line?: number }> {
  const errors: Array<{ type: string; message: string; file?: string; line?: number }> = [];

  // Check if API client exists
  const apiClientFile = files.find(f => f.path === 'src/lib/api.ts');
  if (!apiClientFile) {
    errors.push({
      type: 'integration',
      message: 'Missing API client: src/lib/api.ts required for backend integration'
    });
    return errors; // Can't validate further without API client
  }

  // Extract API function names from api.ts
  const apiFunctions = new Set<string>();
  const functionPattern = /export\s+(?:async\s+)?function\s+(\w+)/g;
  let match;
  while ((match = functionPattern.exec(apiClientFile.content)) !== null) {
    apiFunctions.add(match[1]);
  }

  // Check forms in page components
  const pageFiles = files.filter(f => f.path.includes('page.tsx'));
  for (const page of pageFiles) {
    const hasForm = /<form|onSubmit/.test(page.content);
    if (!hasForm) continue;

    // Check if page imports from API client
    const importsApi = /import\s+{[^}]*}\s+from\s+['"]@\/lib\/api['"]/.test(page.content);
    if (!importsApi) {
      errors.push({
        type: 'integration',
        message: `${page.path} has form but doesn't import API client`,
        file: page.path
      });
      continue;
    }

    // Check if any API function is actually called
    let callsApi = false;
    for (const func of apiFunctions) {
      if (page.content.includes(`${func}(`)) {
        callsApi = true;
        break;
      }
    }

    if (!callsApi) {
      errors.push({
        type: 'integration',
        message: `${page.path} imports API client but never calls it (form won't submit data)`,
        file: page.path
      });
    }
  }

  return errors;
}

export async function qaNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[QA] 🚀 Starting QA validation node');
    console.log(`[QA] 📊 Files to validate: ${state.files?.length || 0}`);

    // CONVERSATION MEMORY: Get conversation context for multi-turn editing
    console.log('[QA] 💬 Loading conversation memory...');
    const conversationContext = getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[QA] 💬 Conversation context loaded - enabling context-aware validation');
    }

    // Emit thinking process before starting
    emitNodeStart('qa', state, {
      userInput: `Validating ${state.files?.length || 0} file(s)`,
      interpretation: 'Running automated quality checks on your generated code to ensure everything works correctly.',
      plan: `I'll check the code for errors and compatibility issues. If I find any problems, I'll call in our automated debugging team to fix them quickly!`
    });

    if (!state.files || state.files.length === 0) {
      console.error('[QA] ❌ No files to validate');
      return {
        errors: [{ node: 'qa', message: 'No files provided for validation' }], // Reducer auto-appends
        completedNodes: ['qa'] // Reducer auto-appends
      };
    }

    console.log('[QA] 📋 Files being validated:');
    state.files.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f.path} (${f.content.length} chars)`);
    });

    // Validate code
    console.log('[QA] 🔍 Running code validation...');
    const validationResult = await validateCode(state.files, {
      autoFix: true,
      strict: false,
      isMultiPage: state.isMultiPage || false
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[QA] 📊 VALIDATION RESULTS:');
    console.log(`[QA] ✅ Valid: ${validationResult.valid}`);
    console.log(`[QA] ❌ Errors: ${validationResult.report.errors.length}`);
    console.log(`[QA] ⚠️  Warnings: ${validationResult.report.warnings.length}`);
    console.log(`[QA] 🔧 Auto-Fixed: ${validationResult.report.fixed?.length || 0}`);

    if (validationResult.report.errors.length > 0) {
      console.log('[QA] 📋 Error Details:');
      validationResult.report.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. [${err.type}] ${err.message} ${err.file ? `in ${err.file}` : ''}`);
      });
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check for required Next.js files
    const hasBackend = !!(state.backendConfig?.collections && state.backendConfig.collections.length > 0);
    console.log('[QA] 🔍 Checking required Next.js files...');
    const structureErrors = validateRequiredNextJSFiles(state.files, hasBackend);
    if (structureErrors.length > 0) {
      console.log(`[QA] ⚠️  Found ${structureErrors.length} missing required file(s):`);
      structureErrors.forEach(err => console.log(`   - ${err.message}`));
      // Add structure errors to validation result
      validationResult.report.errors.push(...structureErrors);
    } else {
      console.log('[QA] ✅ All required Next.js files present');
    }

    // Backend validation skipped (static export mode - no backend)
    console.log('[QA] ℹ️  Backend validation skipped (static export mode)');

    // If errors exist, trigger AutoGen debugging subgraph
    if (validationResult.report.errors.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[QA] 🚨 Errors detected, triggering AutoGen AI debugging engine...');
      console.log(`[QA] 🔧 Error count: ${validationResult.report.errors.length}`);

      // Emit progress with "Calling Engineers" message
      const errorCount = validationResult.report.errors.length;
      emitProgress('qa', state.projectId, `Found ${errorCount} issue${errorCount > 1 ? 's' : ''}, calling debugging team! 🔧`);

      // Get expected pages for multi-page validation (from file paths)
      const expectedPages = state.files
        ?.filter(f => f.path.endsWith('page.tsx'))
        .map(f => f.path) || [];

      console.log('[QA] 📋 Debug Context:');
      console.log(`  - Project ID: ${state.projectId}`);
      console.log(`  - User ID: ${state.userId}`);
      console.log(`  - Multi-Page: ${state.isMultiPage || false}`);
      console.log(`  - Expected Pages: ${expectedPages.length}`);
      console.log(`  - Backend: ${state.backendConfig ? 'YES' : 'NO'}`);

      // Use AutoGen-powered debugging subgraph
      console.log('[QA] 🤖 Starting AutoGen debug workflow...');
      const debugResult = await autoGenDebugWorkflow({
        files: state.files,
        validationResult,
        projectContext: {
          projectId: state.projectId,
          userId: state.userId,
          plan: state.plan || '',
          description: state.userDescription,
          backendConfig: state.backendConfig,
          context: state.context,
          isMultiPage: state.isMultiPage || false,
          expectedPages,
          designSystemPrompt: state.designSystemPrompt
        }
      });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[QA] 📊 AUTOGEN DEBUG RESULTS:');
      console.log(`[QA] ${debugResult.success ? '✅ SUCCESS' : '❌ FAILED'} after ${debugResult.attempts} attempt(s)`);
      console.log(`[QA] 📊 Initial Errors: ${validationResult.report.errors.length}`);
      console.log(`[QA] 📊 Final Errors: ${debugResult.validationResult.report.errors.length}`);
      console.log(`[QA] 📊 Fixed: ${validationResult.report.errors.length - debugResult.validationResult.report.errors.length}`);
      if (debugResult.fileOperations && debugResult.fileOperations.length > 0) {
        console.log(`[QA] 📝 File Operations: ${debugResult.fileOperations.length}`);
        debugResult.fileOperations.forEach((op: any, idx: number) => {
          console.log(`  ${idx + 1}. ${op.type}: ${op.file}`);
        });
      }

      // 🔍 LOG FAILED CODE FOR DEBUGGING
      if (!debugResult.success && debugResult.validationResult.report.errors.length > 0) {
        console.log(`[QA] 📝 FAILED CODE (for debugging):`);
        debugResult.files.forEach((file: any) => {
          if (debugResult.validationResult.report.errors.some((e: any) => e.file === file.path)) {
            console.log(`\n━━━━ ${file.path} (${file.content.length} chars) ━━━━`);
            console.log(file.content.substring(0, 2000)); // First 2000 chars
            if (file.content.length > 2000) console.log(`\n... [${file.content.length - 2000} more chars]`);
          }
        });
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Store debug metadata in artifacts
      const newArtifacts = new Map(state.artifacts);
      newArtifacts.set('debugMetadata', {
        attempts: debugResult.attempts,
        success: debugResult.success,
        finalErrors: debugResult.validationResult.report.errors.length,
        agentCollaboration: debugResult.collaborationLog,
        fileOperations: debugResult.fileOperations || [] // ✅ ADD FILE OPERATIONS
      });

      const duration = Date.now() - startTime;

      // CONVERSATION MEMORY: Track QA's response (debugging path)
      const qaResponse = `Validated code and found ${validationResult.report.errors.length} error(s). AutoGen debugging ${debugResult.success ? 'fixed all issues' : `attempted ${debugResult.attempts} time(s), ${debugResult.validationResult.report.errors.length} error(s) remain`}.`;
      addAssistantMessage(state.projectId, qaResponse, 'qa');
      console.log('[QA] 💬 Tracked assistant response in conversation memory');

      // Emit completion with detailed task information
      emitNodeComplete('qa', state, duration, {
        taskDescription: 'Validated and debugged code using AutoGen AI system',
        success: debugResult.success,
        output: {
          initialErrors: validationResult.report.errors.length,
          finalErrors: debugResult.validationResult.report.errors.length,
          debugAttempts: debugResult.attempts,
          fixed: debugResult.validationResult.report.errors.length < validationResult.report.errors.length
        },
        summary: `Found ${validationResult.report.errors.length} error(s). AutoGen debugging ${debugResult.success ? 'succeeded' : 'failed'} after ${debugResult.attempts} attempt(s). Final state: ${debugResult.validationResult.report.errors.length} error(s) remaining. ${debugResult.success ? '✅ Code is now valid.' : '⚠️ Some issues remain.'}`
      });

      return {
        files: debugResult.files,
        validationResult: debugResult.validationResult,
        debugAttempts: debugResult.attempts,
        completedNodes: ['qa'], // Reducer auto-appends
        artifacts: newArtifacts,
        errors: debugResult.success
          ? state.errors
          : [...state.errors, { node: 'qa', message: `AutoGen debugging failed after ${debugResult.attempts} attempts` }]
      };
    }

    // No errors, validation passed
    const duration = Date.now() - startTime;

    // CONVERSATION MEMORY: Track QA's response (success path)
    const qaSuccessResponse = `Code validation passed! No errors found. ${validationResult.report?.warnings?.length || 0} warning(s), ${validationResult.report?.fixed?.length || 0} auto-fix(es) applied.`;
    addAssistantMessage(state.projectId, qaSuccessResponse, 'qa');
    console.log('[QA] 💬 Tracked assistant response in conversation memory');

    // 💾 Save memory checkpoint after QA validation
    await conversationMemoryStore.saveMemory(state.projectId);
    console.log('[QA] 💾 Checkpoint saved after QA validation');

    // Emit completion with detailed task information
    emitNodeComplete('qa', state, duration, {
      taskDescription: 'Validated code - no errors found',
      success: true,
      output: {
        errors: 0,
        warnings: validationResult.report?.warnings?.length || 0,
        autoFixApplied: validationResult.report?.fixed?.length || 0
      },
      summary: `✅ Code validation passed! No errors found. ${validationResult.report?.warnings?.length || 0} warning(s). ${validationResult.report?.fixed?.length || 0} minor issue(s) auto-fixed.`
    });

    return {
      files: validationResult.files,
      validationResult: {
        valid: validationResult.valid,
        files: validationResult.files,
        report: validationResult.report
      },
      debugAttempts: 0,
      completedNodes: ['qa'] // Reducer auto-appends
    };
  } catch (error) {
    emitNodeError('qa', error as Error, state);
    console.error('[QA] Error:', error);

    return {
      files: state.files || [],
      validationResult: {
        valid: false,
        files: state.files || [],
        report: { errors: [], warnings: [], fixed: [] }
      },
      debugAttempts: 0,
      completedNodes: ['qa'], // Reducer auto-appends
      errors: [{ node: 'qa', message: (error as Error).message }] // Reducer auto-appends
    };
  }
}
