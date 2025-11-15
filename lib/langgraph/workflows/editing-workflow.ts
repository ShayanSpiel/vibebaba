// lib/langgraph/workflows/editing-workflow.ts
/**
 * EDITING WORKFLOW
 *
 * Agentic, role-based editing system integrated with LangGraph.
 * Replaces the monolithic chat prompt with specialized agents.
 *
 * WORKFLOW:
 * 0. Input Detector → Checks if user input is needed (API keys, URLs, etc.)
 * 1. Tech Lead → Understands what needs to change
 * 2. Editor Agent → Makes targeted, intelligent changes
 * 3. QA + AutoGen → Validates and fixes errors
 * 4. VFS Persistence → Saves changes to localStorage
 */

import type { FileOperation } from '@/lib/files/file-operation-guards';
import { filterOperations, validateFileOperation } from '@/lib/files/file-operation-guards';
import { createVirtualFileSystem, logFileOperation } from '@/lib/files/file-operations';
import { techLeadNode } from '../nodes/tech-lead';
import { editorNode } from '../nodes/editor';
import { inputDetectorNode } from '../nodes/input-detector';
import { qaNode } from '../nodes/qa';
import type { AppGenState } from '../types';
import {
  emitNodeComplete,
  emitNodeStart,
  emitWorkflowComplete,
  emitWorkflowStart,
} from '../utils/logging/events';

export interface EditingRequest {
  files: Array<{ path: string; content: string }>;
  userRequest: string;
  projectContext: {
    projectId: string;
    userId: string;
    plan?: string;
    description: string;
    backendConfig?: any;
    context?: any;
    stage: string;
  };
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface EditingResult {
  success: boolean;
  files: Array<{ path: string; content: string }>;
  updatedCode: string; // main file for backward compatibility
  validationResult?: any;
  debugAttempts?: number;
  changesApplied: string[];
  fileChanges?: Array<{ path: string; changeType: 'modified' | 'added' | 'deleted' }>; // NEW: Detailed file changes
  lastCheckpointId?: string; // NEW: Checkpoint ID for reverting changes
  editorMessage?: string; // NEW: Formatted message from editor node
  error?: string;
  partialResult?: boolean;
  failedAtNode?: string;
  needsUserInput?: boolean; // NEW: Workflow paused, waiting for user input
  userInputRequest?: {
    type: 'api_key' | 'code_snippet' | 'env_var' | 'url' | 'clarification' | 'design_spec';
    question: string;
  };
  aiMetadata: {
    model: string;
    provider: string;
    nodesExecuted: string[];
    totalDuration: number;
  };
}

/**
 * Persist file changes to VirtualFileSystem
 * Handles writes, deletes, and security validation
 */
async function persistToVFS(
  projectId: string,
  editedFiles: Array<{ path: string; content: string }>,
  fileChanges: Array<{ path: string; changeType: 'modified' | 'added' | 'deleted' }>,
  originalFiles: Array<{ path: string; content: string }>
): Promise<{ success: boolean; operations: any[] }> {
  const vfs = createVirtualFileSystem(projectId);
  const operations: any[] = [];

  try {
    // Build file operations
    const fileOps: FileOperation[] = [];

    // Filter out backend infrastructure files (same as devops-node)
    const userFiles = editedFiles.filter((file) => !file.path.startsWith('api/'));

    // Handle additions and modifications
    for (const file of userFiles) {
      const change = fileChanges.find((fc) => fc.path === file.path);
      const operationType = change?.changeType === 'added' ? 'create' : 'create'; // VFS uses 'create' for both

      fileOps.push({
        type: operationType,
        path: file.path,
        content: file.content,
        reason: change ? `File ${change.changeType}` : 'File updated',
      });
    }

    // Handle deletions
    const deletedFiles = fileChanges.filter((fc) => fc.changeType === 'deleted');
    for (const deleted of deletedFiles) {
      fileOps.push({
        type: 'delete',
        path: deleted.path,
        reason: 'File deleted by user request',
      });
    }

    // Validate operations
    const { allowed, rejected } = filterOperations(fileOps);

    if (rejected.length > 0) {
      console.warn('[VFS] ⚠️ Some operations blocked by security:');
      rejected.forEach((r) => console.warn(`  ${r.operation.path}: ${r.reason}`));
    }

    // Execute allowed operations
    for (const op of allowed) {
      if (op.type === 'delete') {
        const result = await vfs.deleteFile(op.path);
        logFileOperation(op, result.success, result.error);
        operations.push({ ...op, result });
      } else {
        // create/update
        const result = await vfs.writeFile({
          filePath: op.path,
          content: op.content || '',
          encoding: 'utf-8',
        });
        logFileOperation(op, result.success, result.error);
        operations.push({ ...op, result });
      }
    }

    console.log(`[VFS] ✅ Persisted ${operations.length} file operation(s) to localStorage`);
    return { success: true, operations };
  } catch (error: any) {
    console.error('[VFS] ❌ Failed to persist files:', error);
    return { success: false, operations };
  }
}

/**
 * Main editing workflow
 * Orchestrates role-based agents for intelligent code modifications
 */
export async function editingWorkflow(request: EditingRequest): Promise<EditingResult> {
  const workflowStartTime = Date.now();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[LangGraph Editing] 🎬 STARTING EDITING WORKFLOW');
  console.log('[LangGraph Editing] Files:', request.files.length);
  console.log('[LangGraph Editing] Request:', request.userRequest.substring(0, 100) + '...');
  console.log('[LangGraph Editing] Stage:', request.projectContext.stage);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Build initial state
  let state: AppGenState = {
    userDescription: request.projectContext.description,
    userId: request.projectContext.userId,
    projectId: request.projectContext.projectId,
    plan: request.projectContext.plan,
    context: request.projectContext.context,
    backendConfig: request.projectContext.backendConfig,
    files: request.files,
    stage: 'editing',
    completedNodes: [],
    errors: [],
    artifacts: new Map(),

    // NEW: Editing-specific state
    editingSession: {
      originalFiles: request.files,
      userRequest: request.userRequest,
      conversationHistory: (request.conversationHistory || []).slice(-10), // Last 10 messages only
      changeScope: 'unknown', // Will be determined by context analyzer
      preservedSections: new Map(), // Sections to never touch
      filesToModify: [], // Will be determined by context analyzer
    },
  };

  emitWorkflowStart(state.projectId, `Editing: ${request.userRequest}`);

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 0: INPUT DETECTOR (Check if we need user input first)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[LangGraph Editing] 🔍 Step 0/5: Input Detection');
    const inputResult = await inputDetectorNode(state);
    state = { ...state, ...inputResult };

    // If user input is needed, pause the workflow and return early
    if (state.needsUserInput && state.userInputRequest) {
      console.log('[LangGraph Editing] ⏸️  Workflow paused - user input required');
      console.log(`[LangGraph Editing]   Type: ${state.userInputRequest.type}`);
      console.log(`[LangGraph Editing]   Question: "${state.userInputRequest.question}"`);

      const totalDuration = Date.now() - workflowStartTime;

      return {
        success: false, // Not failed, just paused
        files: request.files, // Return original files unchanged
        updatedCode: request.files[0]?.content || '',
        changesApplied: [],
        needsUserInput: true,
        userInputRequest: state.userInputRequest,
        aiMetadata: {
          model: 'gemini-2.0-flash',
          provider: 'google',
          nodesExecuted: ['input-detector'],
          totalDuration,
        },
      };
    }

    console.log('[LangGraph Editing] ✅ Input detection complete - no input needed');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: CONTEXT ANALYZER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[LangGraph Editing] 🔍 Step 1/5: Context Analysis');
    const contextResult = await techLeadNode(state);
    state = { ...state, ...contextResult };
    console.log('[LangGraph Editing] ✅ Context analysis complete');
    console.log('[LangGraph Editing] Change scope:', state.editingSession?.changeScope);
    console.log(
      '[LangGraph Editing] Files to modify:',
      state.editingSession?.filesToModify?.length || 0
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: EDITOR AGENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[LangGraph Editing] ✏️  Step 2/5: Code Generation');
    const editorResult = await editorNode(state);
    state = { ...state, ...editorResult };
    console.log('[LangGraph Editing] ✅ Code generation complete');
    console.log('[LangGraph Editing] Files generated:', state.files?.length || 0);

    // Log file changes explicitly
    if (state.editingSession?.fileChanges) {
      const added = state.editingSession.fileChanges.filter((fc) => fc.changeType === 'added');
      const modified = state.editingSession.fileChanges.filter(
        (fc) => fc.changeType === 'modified'
      );
      const deleted = state.editingSession.fileChanges.filter((fc) => fc.changeType === 'deleted');

      if (added.length > 0)
        console.log('[LangGraph Editing] ➕ Added:', added.map((f) => f.path).join(', '));
      if (modified.length > 0)
        console.log('[LangGraph Editing] ✏️ Modified:', modified.map((f) => f.path).join(', '));
      if (deleted.length > 0)
        console.log('[LangGraph Editing] 🗑️ Deleted:', deleted.map((f) => f.path).join(', '));
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: QA + AUTOGEN VALIDATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[LangGraph Editing] 🔍 Step 3/5: Validation & Debugging');
    const qaResult = await qaNode(state);
    state = { ...state, ...qaResult };
    console.log('[LangGraph Editing] ✅ Validation complete');

    if (state.debugAttempts && state.debugAttempts > 0) {
      console.log(`[LangGraph Editing] 🔧 AutoGen debugging used: ${state.debugAttempts} attempts`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: PERSIST TO VIRTUAL FILE SYSTEM
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[LangGraph Editing] 💾 Step 4/5: Persisting to localStorage...');
    const persistResult = await persistToVFS(
      state.projectId,
      state.files || [],
      state.editingSession?.fileChanges || [],
      request.files
    );

    if (!persistResult.success) {
      console.warn('[LangGraph Editing] ⚠️ Persistence failed - changes are in-memory only');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // BUILD RESULT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const totalDuration = Date.now() - workflowStartTime;
    const mainFile = state.files?.find((f) => f.path === 'index.html') || state.files?.[0];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[LangGraph Editing] ✅ EDITING WORKFLOW COMPLETE');
    console.log(`[LangGraph Editing] Duration: ${totalDuration}ms`);
    console.log(`[LangGraph Editing] Files: ${state.files?.length || 0}`);
    console.log(`[LangGraph Editing] Debug attempts: ${state.debugAttempts || 0}`);
    console.log(`[LangGraph Editing] Nodes: ${state.completedNodes.join(' → ')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 🔍 DEBUG: Verify files being returned
    console.log('[LangGraph Editing] 🔍 RETURNING TO API:');
    console.log('[LangGraph Editing]   - Files count:', state.files?.length || 0);
    console.log('[LangGraph Editing]   - File paths:', state.files?.map((f) => f.path).join(', '));
    if (state.files && state.files.length > 0) {
      console.log('[LangGraph Editing]   - First file path:', state.files[0].path);
      console.log(
        '[LangGraph Editing]   - First file content length:',
        state.files[0].content?.length || 0
      );
      console.log(
        '[LangGraph Editing]   - First file content preview:',
        state.files[0].content?.substring(0, 150)
      );
    }

    emitWorkflowComplete(state, totalDuration);

    const result = {
      success: true,
      files: state.files || [],
      updatedCode: mainFile?.content || '',
      validationResult: state.validationResult,
      debugAttempts: state.debugAttempts,
      changesApplied: state.editingSession?.changesApplied || [],
      fileChanges: state.editingSession?.fileChanges || [], // NEW: Include file change details
      lastCheckpointId: state.lastCheckpointId, // For revert functionality
      editorMessage: (state as any).editorMessage, // NEW: Pass through editor's formatted message
      aiMetadata: {
        model: state.artifacts?.get('editorMetadata')?.model || 'unknown',
        provider: state.artifacts?.get('editorMetadata')?.provider || 'unknown',
        nodesExecuted: state.completedNodes,
        totalDuration,
      },
    };

    console.log('[LangGraph Editing] 🔍 RESULT OBJECT FILES:', result.files.length, 'files');
    console.log('[LangGraph Editing] 🔍 RESULT CHECKPOINT ID:', result.lastCheckpointId);
    console.log(
      '[LangGraph Editing] 🔍 RESULT EDITOR MESSAGE:',
      result.editorMessage ? result.editorMessage.substring(0, 100) + '...' : 'MISSING!'
    );
    return result;
  } catch (error: any) {
    console.error('[LangGraph Editing] ❌ Workflow failed:', error);

    const totalDuration = Date.now() - workflowStartTime;

    // Determine what succeeded before failure
    const partialFiles = state.files && state.files.length > 0 ? state.files : request.files;
    const partialChanges = state.editingSession?.changesApplied || [];
    const failedAtNode =
      state.completedNodes.length > 0
        ? state.completedNodes[state.completedNodes.length - 1]
        : 'initialization';

    console.error('[LangGraph Editing] 💔 Partial recovery:');
    console.error(`  Failed at: ${failedAtNode}`);
    console.error(`  Completed nodes: ${state.completedNodes.join(' → ') || 'none'}`);
    console.error(`  Files available: ${partialFiles.length}`);
    console.error(`  Changes made: ${partialChanges.length}`);

    return {
      success: false,
      files: partialFiles, // Return whatever we have
      updatedCode: partialFiles[0]?.content || request.files[0]?.content || '',
      changesApplied: partialChanges,
      fileChanges: state.editingSession?.fileChanges || [], // NEW: Include file change details
      error: error.message,
      partialResult: true, // Flag for UI to show warning
      failedAtNode, // Help debugging
      aiMetadata: {
        model: state.artifacts?.get('editorMetadata')?.model || 'error',
        provider: state.artifacts?.get('editorMetadata')?.provider || 'error',
        nodesExecuted: state.completedNodes,
        totalDuration,
      },
    };
  }
}

/**
 * Quick edit workflow for simple changes
 * Skips context analysis for performance
 */
export async function quickEditWorkflow(request: EditingRequest): Promise<EditingResult> {
  console.log('[LangGraph Editing] ⚡ Using QUICK edit workflow (no context analysis)');

  // Build state directly for editor
  let state: AppGenState = {
    userDescription: request.projectContext.description,
    userId: request.projectContext.userId,
    projectId: request.projectContext.projectId,
    plan: request.projectContext.plan,
    context: request.projectContext.context,
    backendConfig: request.projectContext.backendConfig,
    files: request.files,
    stage: 'editing',
    completedNodes: [],
    errors: [],
    artifacts: new Map(),

    editingSession: {
      originalFiles: request.files,
      userRequest: request.userRequest,
      conversationHistory: (request.conversationHistory || []).slice(-10), // Last 10 messages only
      changeScope: 'minor', // Assume minor change
      filesToModify: request.files.map((f) => f.path), // Modify all
      preservedSections: new Map(),
    },
  };

  const startTime = Date.now();

  try {
    // Direct to editor
    const editorResult = await editorNode(state);
    state = { ...state, ...editorResult };

    // Quick validation (no AutoGen)
    const qaResult = await qaNode(state);
    state = { ...state, ...qaResult };

    const mainFile = state.files?.find((f) => f.path === 'index.html') || state.files?.[0];
    const totalDuration = Date.now() - startTime;

    return {
      success: true,
      files: state.files || [],
      updatedCode: mainFile?.content || '',
      validationResult: state.validationResult,
      debugAttempts: state.debugAttempts,
      changesApplied: state.editingSession?.changesApplied || [],
      fileChanges: state.editingSession?.fileChanges || [], // NEW: Include file change details
      aiMetadata: {
        model: state.artifacts?.get('editorMetadata')?.model || 'unknown',
        provider: state.artifacts?.get('editorMetadata')?.provider || 'unknown',
        nodesExecuted: state.completedNodes,
        totalDuration,
      },
    };
  } catch (error: any) {
    console.error('[LangGraph Editing] ❌ Quick edit failed:', error);

    return {
      success: false,
      files: state.files || request.files, // Partial recovery
      updatedCode: state.files?.[0]?.content || request.files[0]?.content || '',
      changesApplied: state.editingSession?.changesApplied || [],
      error: error.message,
      partialResult: true,
      aiMetadata: {
        model: state.artifacts?.get('editorMetadata')?.model || 'error',
        provider: state.artifacts?.get('editorMetadata')?.provider || 'error',
        nodesExecuted: state.completedNodes,
        totalDuration: Date.now() - startTime,
      },
    };
  }
}
