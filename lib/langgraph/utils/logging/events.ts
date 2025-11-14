// lib/langgraph/utils/logging/events.ts
import { EventEmitter } from 'events';
import type { AppGenState } from '../../types';

export const workflowEvents = new EventEmitter();

// Increase max listeners to handle multiple SSE connections
// Each connection adds 13 listeners (node:start, node:complete, node:error, workflow:complete,
// ai:call:start, ai:call:complete, ai:call:error, autogen:attempt:start, autogen:agent:start,
// autogen:agent:complete, autogen:error:diff, progress, workflow:start)
workflowEvents.setMaxListeners(100);

/**
 * Emit when a node starts executing with thinking process
 */
export function emitNodeStart(nodeName: string, state: AppGenState, thinkingProcess?: {
  userInput: string;
  interpretation: string;
  plan: string;
}) {
  const event = {
    type: 'node:start',
    nodeName,
    projectId: state.projectId,
    stage: state.stage,
    timestamp: new Date().toISOString(),
    thinkingProcess
  };

  workflowEvents.emit('node:start', event);
  // Console log removed - event streaming handles this
}

/**
 * Emit when a node completes successfully with detailed task information
 */
export function emitNodeComplete(nodeName: string, state: AppGenState, duration: number, taskDetails?: {
  taskDescription: string;
  success: boolean;
  output?: any;
  summary: string;
}) {
  const event = {
    type: 'node:complete',
    nodeName,
    projectId: state.projectId,
    stage: state.stage,
    duration,
    timestamp: new Date().toISOString(),
    taskDetails
  };

  workflowEvents.emit('node:complete', event);
  // Console log removed - event streaming handles this
}

/**
 * Emit when a node encounters an error
 */
export function emitNodeError(nodeName: string, error: Error, state: AppGenState) {
  const event = {
    type: 'node:error',
    nodeName,
    projectId: state.projectId,
    error: {
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date().toISOString()
  };

  workflowEvents.emit('node:error', event);
  // Console log removed - event streaming handles this
}

/**
 * Emit workflow events (start, complete, error)
 */
export function emitWorkflowStart(projectId: string, description: string) {
  workflowEvents.emit('workflow:start', {
    projectId,
    description,
    timestamp: new Date().toISOString()
  });
  // Console log removed - event streaming handles this
}

export function emitWorkflowComplete(state: AppGenState, totalDuration: number) {
  // Determine if workflow was actually successful
  const hasFiles = (state.files?.length || 0) > 0;
  const hasDeployUrl = !!state.deployUrl;
  const hasCriticalErrors = (state.errors || []).some(
    err => err.node === 'devops' || err.node === 'qa' || err.node === 'frontend' || err.node === 'backend'
  );
  const validationFailed = !state.validationResult?.valid && (state.validationResult?.report?.errors || []).length > 0;

  // SUCCESS CRITERIA:
  // - Has generated files
  // - Has deploy URL (deployment succeeded)
  // - No critical node errors
  // - Validation passed or errors were fixed
  const success = hasFiles && hasDeployUrl && !hasCriticalErrors && !validationFailed;

  // Extract file changes for better UI display
  const fileChanges = state.editingSession?.fileChanges || [];
  const editedFiles: string[] = [];
  const removedFiles: string[] = [];
  const addedFiles: string[] = [];

  fileChanges.forEach((change: any) => {
    if (change.type === 'modified') {
      editedFiles.push(change.path);
    } else if (change.type === 'deleted') {
      removedFiles.push(change.path);
    } else if (change.type === 'created') {
      addedFiles.push(change.path);
    }
  });

  // Extract added features/components from changes
  const addedFeatures: string[] = state.editingSession?.changesApplied
    ?.filter((change: any) => change.type === 'feature' || change.type === 'component')
    ?.map((change: any) => change.description) || [];

  workflowEvents.emit('workflow:complete', {
    projectId: state.projectId,
    success, // NEW: Success flag
    status: success ? 'completed' : 'failed', // NEW: Status string
    completedNodes: state.completedNodes,
    totalDuration,
    filesGenerated: state.files?.length || 0,
    debugAttempts: state.debugAttempts || 0,
    hasDeployUrl,
    errors: state.errors || [], // NEW: Include errors in event
    validationStatus: (state.validationResult as any)?.status || 'unknown', // NEW: Include validation status
    timestamp: new Date().toISOString(),
    // Enhanced file change details
    fileChanges: {
      edited: editedFiles,
      removed: removedFiles,
      added: addedFiles
    },
    addedFeatures,
    lastCheckpointId: state.lastCheckpointId, // For revert functionality
    isEditWorkflow: !!state.editingSession // Distinguish edit vs initial generation
  });
  // Console log removed - event streaming handles this
}

/**
 * Emit AutoGen debugging attempt start
 */
export function emitAutoGenAttemptStart(
  projectId: string,
  attempt: number,
  maxAttempts: number,
  initialErrors: number
) {
  workflowEvents.emit('autogen:attempt:start', {
    type: 'autogen:attempt:start',
    projectId,
    attempt,
    maxAttempts,
    initialErrors,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit AutoGen sub-agent start
 */
export function emitAutoGenAgentStart(
  projectId: string,
  attempt: number,
  agent: 'analyst' | 'fixer' | 'fileops' | 'reviewer',
  message: string
) {
  workflowEvents.emit('autogen:agent:start', {
    type: 'autogen:agent:start',
    projectId,
    agentRole: agent,
    message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit AutoGen sub-agent complete
 */
export function emitAutoGenAgentComplete(
  projectId: string,
  attempt: number,
  agent: string,
  duration: number,
  output: any
) {
  workflowEvents.emit('autogen:agent:complete', {
    type: 'autogen:agent:complete',
    projectId,
    agentRole: agent,
    message: 'Agent completed',
    duration,
    output,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit AutoGen error diff
 */
export function emitAutoGenErrorDiff(
  projectId: string,
  attempt: number,
  before: { count: number; errors: any[] },
  after: { count: number; errors: any[] },
  analysis: {
    fixed: any[];
    new: any[];
    remaining: any[];
  }
) {
  workflowEvents.emit('autogen:error:diff', {
    type: 'autogen:error:diff',
    projectId,
    attempt,
    before,
    after,
    analysis,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit progress event for long-running operations
 */
export function emitProgress(
  nodeName: string,
  projectId: string,
  message: string,
  details?: any
) {
  workflowEvents.emit('progress', {
    type: 'progress',
    nodeName,
    projectId,
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit a conversational chat message (chatty bubble)
 * Appears as regular assistant message in chat UI
 *
 * Use this for:
 * - Friendly status updates ("I'm reviewing your request...")
 * - Success summaries ("I created 2 files with 45 lines of code!")
 * - Questions requiring user input ("Which YouTube video URL?")
 * - Rollback options, confirmations, etc.
 */
export function emitChatMessage(
  projectId: string,
  message: string,
  metadata?: {
    type?: 'info' | 'success' | 'warning' | 'question';
    requiresResponse?: boolean;
    inputType?: 'api_key' | 'code_snippet' | 'env_var' | 'url' | 'clarification';
  }
) {
  workflowEvents.emit('chat:message', {
    type: 'chat:message',
    projectId,
    message,
    metadata,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit file planning started
 */
export function emitFilePlanningStart(projectId: string, nodeName: string) {
  workflowEvents.emit('file:planning:start', {
    type: 'file:planning:start',
    projectId,
    nodeName,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit file planning completed with file list
 */
export function emitFilePlanningComplete(
  projectId: string,
  nodeName: string,
  files: Array<{ path: string; purpose: string }>
) {
  workflowEvents.emit('file:planning:complete', {
    type: 'file:planning:complete',
    projectId,
    nodeName,
    totalFiles: files.length,
    files: files.map(f => f.path),
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit file creation started
 */
export function emitFileCreating(
  projectId: string,
  nodeName: string,
  fileName: string,
  fileNumber: number,
  totalFiles: number
) {
  workflowEvents.emit('file:creating', {
    type: 'file:creating',
    projectId,
    nodeName,
    fileName,
    fileNumber,
    totalFiles,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit file creation completed
 */
export function emitFileCreated(
  projectId: string,
  nodeName: string,
  fileName: string,
  fileNumber: number,
  totalFiles: number,
  fileSize: number
) {
  workflowEvents.emit('file:created', {
    type: 'file:created',
    projectId,
    nodeName,
    fileName,
    fileNumber,
    totalFiles,
    fileSize,
    timestamp: new Date().toISOString()
  });
}

// Subscribe to events for logging/analytics (removed console logs)
workflowEvents.on('node:start', (event) => {
  // Track start time for performance metrics
  if (typeof window === 'undefined') {
    // Server-side: Store in-memory metrics
    const key = `${event.projectId}_${event.nodeName}_start`;
    (global as any).__workflow_metrics = (global as any).__workflow_metrics || new Map();
    (global as any).__workflow_metrics.set(key, Date.now());
  }
});

workflowEvents.on('node:complete', (event) => {
  // Track performance metrics
  if (typeof window === 'undefined') {
    (global as any).__workflow_metrics = (global as any).__workflow_metrics || new Map();
    const key = `${event.projectId}_metrics`;
    const metrics = (global as any).__workflow_metrics.get(key) || { nodes: [] };
    metrics.nodes.push({
      name: event.nodeName,
      duration: event.duration,
      timestamp: event.timestamp
    });
    (global as any).__workflow_metrics.set(key, metrics);
  }
});

workflowEvents.on('node:error', (event) => {
  // Log to error tracking
  if (typeof window === 'undefined') {
    (global as any).__workflow_errors = (global as any).__workflow_errors || [];
    (global as any).__workflow_errors.push({
      projectId: event.projectId,
      nodeName: event.nodeName,
      error: event.error.message,
      stack: event.error.stack,
      timestamp: event.timestamp
    });

    // Keep only last 100 errors to prevent memory leak
    if ((global as any).__workflow_errors.length > 100) {
      (global as any).__workflow_errors = (global as any).__workflow_errors.slice(-100);
    }
  }
});

/**
 * Type Definition Tracking Events
 * These events help track type definitions as they flow through the workflow
 */

/**
 * Emit when backend generates type definitions
 */
export function emitTypeDefinitionsGenerated(
  projectId: string,
  typeDefinitions: Array<{ name: string; properties: Array<{ name: string; type: string }> }>,
  source: 'backend' | 'frontend' | 'api'
) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[TypeTracking] 📦 Type definitions generated (${source})`);
  console.log(`[TypeTracking] 📊 Project: ${projectId}`);
  console.log(`[TypeTracking] 📋 Types: ${typeDefinitions.length}`);

  for (const type of typeDefinitions) {
    const propList = type.properties.map(p => `${p.name}: ${p.type}`).join(', ');
    console.log(`[TypeTracking]   ${type.name} = { ${propList} }`);
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  workflowEvents.emit('type:definitions:generated', {
    type: 'type:definitions:generated',
    projectId,
    source,
    typeDefinitions,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit when type definitions are extracted for use
 */
export function emitTypeDefinitionsExtracted(
  projectId: string,
  typeDefinitions: Array<{ name: string; properties: Array<{ name: string; type: string }> }>,
  sourceFile: string,
  targetNode: string
) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[TypeTracking] 🔍 Type definitions extracted`);
  console.log(`[TypeTracking] 📊 Project: ${projectId}`);
  console.log(`[TypeTracking] 📂 Source: ${sourceFile}`);
  console.log(`[TypeTracking] 🎯 Target Node: ${targetNode}`);
  console.log(`[TypeTracking] 📋 Types extracted: ${typeDefinitions.length}`);

  for (const type of typeDefinitions) {
    const propList = type.properties.map(p => `${p.name}: ${p.type}`).join(', ');
    console.log(`[TypeTracking]   ${type.name} = { ${propList} }`);
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  workflowEvents.emit('type:definitions:extracted', {
    type: 'type:definitions:extracted',
    projectId,
    sourceFile,
    targetNode,
    typeDefinitions,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit when type validation is performed
 */
export function emitTypeValidationStart(
  projectId: string,
  filePath: string,
  typeDefinitions: Array<{ name: string; properties: Array<{ name: string; type: string }> }>
) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[TypeValidation] 🔍 Starting type validation`);
  console.log(`[TypeValidation] 📊 Project: ${projectId}`);
  console.log(`[TypeValidation] 📄 File: ${filePath}`);
  console.log(`[TypeValidation] 📋 Validating against ${typeDefinitions.length} type(s)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  workflowEvents.emit('type:validation:start', {
    type: 'type:validation:start',
    projectId,
    filePath,
    typeDefinitions,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit when type validation completes
 */
export function emitTypeValidationComplete(
  projectId: string,
  filePath: string,
  issues: number,
  errors: Array<{ line: number; message: string }>
) {
  const hasIssues = issues > 0;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[TypeValidation] ${hasIssues ? '❌' : '✅'} Type validation complete`);
  console.log(`[TypeValidation] 📊 Project: ${projectId}`);
  console.log(`[TypeValidation] 📄 File: ${filePath}`);
  console.log(`[TypeValidation] 📋 Issues found: ${issues}`);

  if (hasIssues) {
    console.log(`[TypeValidation] ⚠️  Errors:`);
    for (const error of errors.slice(0, 5)) {
      console.log(`[TypeValidation]    Line ${error.line}: ${error.message}`);
    }
    if (errors.length > 5) {
      console.log(`[TypeValidation]    ... and ${errors.length - 5} more`);
    }
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  workflowEvents.emit('type:validation:complete', {
    type: 'type:validation:complete',
    projectId,
    filePath,
    issues,
    errors,
    timestamp: new Date().toISOString()
  });
}

/**
 * Emit when a type mismatch is detected
 */
export function emitTypeMismatchDetected(
  projectId: string,
  filePath: string,
  line: number,
  expectedType: string,
  actualAccess: string,
  availableProperties: string[]
) {
  console.log(`\n🚨 TYPE MISMATCH DETECTED:`);
  console.log(`   File: ${filePath}:${line}`);
  console.log(`   Expected Type: ${expectedType}`);
  console.log(`   Actual Access: ${actualAccess}`);
  console.log(`   Available Properties: ${availableProperties.join(', ')}`);
  console.log(``);

  workflowEvents.emit('type:mismatch:detected', {
    type: 'type:mismatch:detected',
    projectId,
    filePath,
    line,
    expectedType,
    actualAccess,
    availableProperties,
    timestamp: new Date().toISOString()
  });
}
