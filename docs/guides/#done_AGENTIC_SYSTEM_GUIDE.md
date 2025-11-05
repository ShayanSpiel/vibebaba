# AutoGen Debugger - Implementation Guide with Code References

## Complete Code Structure Overview

### Entry Point: API Route
**File**: `/app/api/langgraph/execute/route.ts`

```typescript
// Lines 79: 10-minute timeout configuration
const WORKFLOW_TIMEOUT = 10 * 60 * 1000; // 10 minutes - increased from 5 to handle complex workflows

// Lines 82-92: How timeout is implemented
const workflowPromise = workflow.invoke(initialState as any, {
  recursionLimit: 30
}) as unknown as Promise<AppGenState>;

const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('Workflow timeout after 10 minutes')), WORKFLOW_TIMEOUT)
);

result = await Promise.race([workflowPromise, timeoutPromise]);

// Problem: This only shows timeout error, no progress tracking
```

**Issues to Fix**:
- Line 79: Change timeout to configurable value
- Lines 82-92: Add checkpoint/resume logic
- No streaming of progress to client
- No step-by-step logging before timeout

---

### Main Workflow Graph
**File**: `/lib/langgraph/workflow.ts`

```typescript
// Lines 19-43: Error recovery wrapper
function withErrorRecovery<T extends AppGenState>(
  nodeName: string,
  nodeFunc: (state: T) => Promise<Partial<T>>
) {
  return async (state: T): Promise<Partial<T>> => {
    try {
      return await nodeFunc(state);
    } catch (error: any) {
      console.error(`[Workflow] Error in ${nodeName} node:`, error);
      // Returns error in state but doesn't provide details
    }
  };
}

// Lines 51-150: Main workflow creation
export function createAppGenWorkflow() {
  const workflow = new StateGraph<AppGenState>({
    channels: {
      // State definitions...
      completedNodes: { ... },
      errors: { ... },
      artifacts: { ... }
    }
  });
  
  // Adds nodes in sequence
  workflow.addNode('founder', withErrorRecovery('founder', founderNode));
  workflow.addNode('pm', withErrorRecovery('pm', pmNode));
  workflow.addNode('ux', withErrorRecovery('ux', uxNode));
  workflow.addNode('frontend', withErrorRecovery('frontend', frontendRouter));
  workflow.addNode('backend', withErrorRecovery('backend', backendNode));
  workflow.addNode('qa', withErrorRecovery('qa', qaNode));  // ← DEBUGGING HAPPENS HERE
  workflow.addNode('devops', withErrorRecovery('devops', devopsNode));
}
```

**Issues**:
- No per-node timeouts
- withErrorRecovery catches errors but logs minimally
- No per-node progress tracking
- No checkpoint system

---

### QA Node - The Debugging Orchestrator
**File**: `/lib/langgraph/nodes/qa-node.ts`

```typescript
// Lines 7-146: Main QA node function
export async function qaNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    // Lines 12-16: Emit start event (not logged to console)
    emitNodeStart('qa', state, {
      userInput: `Validating ${state.files?.length || 0} file(s)`,
      interpretation: 'Analyzing generated code for errors...',
      plan: 'Run comprehensive validation checks...'
    });

    // Lines 27-31: Initial validation
    const validationResult = await validateCode(state.files, {
      autoFix: true,
      strict: false,
      isMultiPage: state.isMultiPage || false
    });

    console.log(`[QA] Validation: ${validationResult.report.errors.length} errors, ${validationResult.report.warnings.length} warnings`);

    // Lines 36-104: If errors found, trigger debugging
    if (validationResult.report.errors.length > 0) {
      console.log('[QA] Errors detected, triggering AutoGen AI debugging engine...');

      // Lines 51-65: Call the multi-agent debugger
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

      console.log(`[QA] AutoGen Debugging complete: ${debugResult.success ? 'SUCCESS' : 'FAILED'} after ${debugResult.attempts} attempts`);

      // Lines 70-77: Store debug metadata in artifacts
      const newArtifacts = new Map(state.artifacts);
      newArtifacts.set('debugMetadata', {
        attempts: debugResult.attempts,
        success: debugResult.success,
        finalErrors: debugResult.validationResult.report.errors.length,
        agentCollaboration: debugResult.collaborationLog,  // Basic strings only
        fileOperations: debugResult.fileOperations || []
      });

      // Lines 82-92: Emit completion with summary
      emitNodeComplete('qa', state, duration, {
        taskDescription: 'Validated and debugged code using AutoGen AI system',
        success: debugResult.success,
        output: {
          initialErrors: validationResult.report.errors.length,
          finalErrors: debugResult.validationResult.report.errors.length,
          debugAttempts: debugResult.attempts,
        },
        summary: `Found ${validationResult.report.errors.length} error(s). AutoGen debugging ${debugResult.success ? 'succeeded' : 'failed'} after ${debugResult.attempts} attempt(s).`
      });

      return {
        files: debugResult.files,
        validationResult: debugResult.validationResult,
        debugAttempts: debugResult.attempts,
        completedNodes: [...state.completedNodes, 'qa'],
        artifacts: newArtifacts,
        errors: debugResult.success ? state.errors : [...]
      };
    }
  } catch (error) {
    emitNodeError('qa', error as Error, state);
    console.error('[QA] Error:', error);
    // Returns error but limited detail
  }
}
```

**What's Missing**:
- No real-time progress streaming
- `collaborationLog` is just string summaries, not detailed turns
- No error-by-error tracking
- No AI response visibility
- No metrics (tokens, model, response time)
- No checkpoint data

---

### AutoGen Debugger Subgraph - The Multi-Agent System
**File**: `/lib/langgraph/subgraphs/autogen-debugger.ts`

```typescript
// Lines 36-135: Main debugging workflow
export async function autoGenDebugWorkflow(context: DebugContext): Promise<DebugResult> {
  console.log('[AutoGen Debugger] Initializing multi-agent debugging workflow...');

  const MAX_ATTEMPTS = 2;  // Line 39: Reduced from 3 to prevent timeout
  const collaborationLog: string[] = [];
  const allFileOperations: FileOperation[] = [];
  let currentFiles = context.files;
  let currentValidation = context.validationResult;
  let attempt = 0;

  // Lines 46-123: Main attempt loop
  for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[AutoGen Debugger] Attempt ${attempt}/${MAX_ATTEMPTS}`);

    // STEP 1: Code Analyst Agent (Lines 49-52)
    const analysisPrompt = buildAnalysisPrompt(currentFiles, currentValidation, context.projectContext);
    const analysis = await generateWithFallback(analysisPrompt);
    collaborationLog.push(`[Attempt ${attempt}] Analyst: ${analysis.substring(0, 200)}...`);
    // PROBLEM: Full prompt not logged, only truncated response, no model/tokens/time

    // STEP 2: Code Fixer Agent (Lines 54-60)
    const fixPrompt = buildFixPrompt(currentFiles, analysis, context.projectContext);
    const fixedCode = await generateWithFallback(fixPrompt, true);
    const fixedFiles = parseFixedFiles(fixedCode.text, currentFiles);
    collaborationLog.push(`[Attempt ${attempt}] Fixer: Generated ${fixedFiles.length} fixed files`);
    // PROBLEM: Doesn't log what was generated, just file count

    // STEP 2.5: File Operations Agent (Lines 62-85)
    const fileOpsPrompt = buildFileOperationsPrompt(currentFiles, fixedFiles, analysis, context.projectContext);
    const fileOpsResponse = await generateWithFallback(fileOpsPrompt);
    const proposedOperations = parseFileOperations(fileOpsResponse);
    
    if (proposedOperations.length > 0) {
      const { allowed, rejected } = filterOperations(proposedOperations);
      if (rejected.length > 0) {
        console.log(`[AutoGen Debugger] ⚠️ Rejected ${rejected.length} unsafe file operations`);
        rejected.forEach((r) => {
          console.log(`  - ${r.operation.type} ${r.operation.path}: ${r.reason}`);
        });
      }
      if (allowed.length > 0) {
        console.log(`[AutoGen Debugger] ✅ Executing ${allowed.length} file operations`);
        const operationResults = executeFileOperations(allowed, currentFiles);
        currentFiles = operationResults.files;
        allFileOperations.push(...allowed);
        collaborationLog.push(`[Attempt ${attempt}] FileOps: Executed ${allowed.length} operations (${rejected.length} rejected)`);
      }
    }
    // PROBLEM: Operations logged but details not tracked

    // STEP 3: Reviewer Agent (Lines 87-90)
    const reviewPrompt = buildReviewPrompt(currentFiles, fixedFiles, analysis);
    const review = await generateWithFallback(reviewPrompt);
    collaborationLog.push(`[Attempt ${attempt}] Reviewer: ${review.substring(0, 200)}...`);
    // PROBLEM: Only truncated review logged

    // STEP 4: Validate Fixed Code (Lines 92-103)
    const newValidation = await validateCode(fixedFiles, {
      autoFix: true,
      strict: false,
      isMultiPage: context.projectContext.isMultiPage
    });

    console.log(`[AutoGen Debugger] Attempt ${attempt} validation: ${newValidation.report.errors.length} errors`);
    // PROBLEM: Doesn't show error reduction or which errors were fixed

    currentFiles = newValidation.files;
    currentValidation = newValidation;

    // Check if debugging succeeded
    if (newValidation.report.errors.length === 0) {
      console.log(`[AutoGen Debugger] ✅ SUCCESS after ${attempt} attempts`);
      return {
        success: true,
        files: currentFiles,
        validationResult: newValidation,
        attempts: attempt,
        collaborationLog,  // Only has brief summaries
        fileOperations: allFileOperations
      };
    }

    // Lines 118-122: Log progress
    const errorReduction = context.validationResult.report.errors.length - newValidation.report.errors.length;
    if (errorReduction > 0) {
      console.log(`[AutoGen Debugger] Progress: Reduced errors by ${errorReduction}`);
    }
  }

  // Max attempts reached
  console.log(`[AutoGen Debugger] ❌ FAILED after ${MAX_ATTEMPTS} attempts`);
  return {
    success: false,
    files: currentFiles,
    validationResult: currentValidation,
    attempts: MAX_ATTEMPTS,
    collaborationLog,  // Could show what was tried
    fileOperations: allFileOperations
  };
}
```

**What Needs to Change**:
- Lines 51, 56, 64, 89: Log full prompts before sending
- After each `generateWithFallback()`: Log model, tokens, duration
- Line 99: Show detailed error before/after per attempt
- `collaborationLog`: Should include turn data, not just summaries
- No checkpoint after each attempt
- No progress event emitted

---

### Prompt Builders (What's Sent to AI)

**Analyst Prompt Builder** (Lines 137-159):
```typescript
function buildAnalysisPrompt(files: any[], validation: any, context: any): string {
  const errorSummary = validation.report.errors.slice(0, 5).map((e: any) =>
    `Line ${e.line || '?'}: ${e.message || e.type || 'Error'}`
  ).join('\n');
  const moreErrors = validation.report.errors.length > 5 ? `\n...and ${validation.report.errors.length - 5} more errors` : '';

  return `You are a Code Analyst Agent. Analyze these validation errors and identify root causes.
...
Provide concise analysis (max 100 words):
1. Root causes
2. Fix strategy`;
}
// PROBLEM: This prompt is never logged to console or database
```

**Fixer Prompt Builder** (Lines 162-192):
```typescript
function buildFixPrompt(files: any[], analysis: string, context: any): string {
  return `You are a Code Fixer Agent. Generate fixed code based on the analyst's recommendations.
...
Generate IMMEDIATELY without explanations!`;
}
// PROBLEM: Large prompt never logged for debugging
```

**File Operations Prompt Builder** (Lines 238-254):
```typescript
function buildFileOperationsPrompt(...): string {
  return `File Operations Agent: Determine file operations needed.
...
Return JSON array of operations (or [] if none):
[{"type":"create|delete|rename","path":"file.html",...}]`;
}
// PROBLEM: Prompt never logged
```

**Reviewer Prompt Builder** (Lines 195-202):
```typescript
function buildReviewPrompt(originalFiles: any[], fixedFiles: any[], analysis: string): string {
  return `You are a Reviewer Agent. Review the fixes briefly.
...
Quick review (1-2 sentences):`;
}
// PROBLEM: Short prompt, but still never logged
```

---

### Event System - Currently Not Logging
**File**: `/lib/langgraph/events.ts`

```typescript
// Line 5: Event emitter created
export const workflowEvents = new EventEmitter();

// Lines 10-26: Node start event
export function emitNodeStart(nodeName: string, state: AppGenState, thinkingProcess?: {...}) {
  const event = {
    type: 'node:start',
    nodeName,
    projectId: state.projectId,
    stage: state.stage,
    timestamp: new Date().toISOString(),
    thinkingProcess
  };

  workflowEvents.emit('node:start', event);
  // Line 25: Console log REMOVED - "event streaming handles this"
}
// PROBLEM: Events are emitted but not logged anywhere

// Lines 31-49: Node complete event
export function emitNodeComplete(nodeName: string, state: AppGenState, duration: number, taskDetails?: {...}) {
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
  // Line 48: Console log REMOVED
}
// PROBLEM: Duration tracked but not used for progress estimation

// Lines 54-68: Node error event
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
  // Line 67: Console log REMOVED
}

// Lines 73-92: Workflow-level events
export function emitWorkflowStart(projectId: string, description: string) {
  workflowEvents.emit('workflow:start', {...});
}

export function emitWorkflowComplete(state: AppGenState, totalDuration: number) {
  workflowEvents.emit('workflow:complete', {...});
}

// Lines 94-138: In-memory metrics storage (not exposed to user)
workflowEvents.on('node:start', (event) => {
  if (typeof window === 'undefined') {
    const key = `${event.projectId}_${event.nodeName}_start`;
    (global as any).__workflow_metrics = (global as any).__workflow_metrics || new Map();
    (global as any).__workflow_metrics.set(key, Date.now());
  }
});
// PROBLEM: Metrics stored globally but never sent to client
```

**Issues**:
- Events emitted but console logs removed
- No event listeners set up to send progress to client
- Metrics stored in memory but not accessible
- No conversation tracking at all
- No progress events for debugging steps

---

### Validation Error Logger - Currently In-Memory Only
**File**: `/lib/services/validation-error-logger.ts`

```typescript
// Lines 14-20: In-memory storage
const validationErrorsStore: ValidationErrorLog[] = [];
const validationSessionsStore: ValidationSessionLog[] = [];
const MAX_ERRORS = 1000;
const MAX_SESSIONS = 100;

// Lines 75-137: Log individual error
export async function logValidationError(
  error: ValidationError,
  context: {...}
): Promise<void> {
  // Lines 94-117: Create error log object
  const errorLog: ValidationErrorLog = {
    projectId: context.projectId,
    userId: context.userId,
    endpoint: context.endpoint,
    errorType: categorizeError(error.rule),
    severity: error.severity,
    rule: error.rule,
    file: error.file,
    line: error.line,
    column: error.column,
    message: error.message,
    suggestion: error.suggestion,
    context: error.context,
    autoFixable: error.autoFixable,
    isFixed: context.isFixed || false,
    attemptNumber: context.attemptNumber,
    aiModel: context.aiModel,
    aiProvider: context.aiProvider,
    filesGenerated: context.filesGenerated,
    totalErrors: context.totalErrors,
    totalWarnings: context.totalWarnings,
    timestamp,
    durationMs: context.durationMs,
  };

  // Lines 119-129: Store in memory only
  errorLog.id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  validationErrorsStore.unshift(errorLog);
  if (validationErrorsStore.length > MAX_ERRORS) {
    validationErrorsStore.length = MAX_ERRORS;
  }
  // PROBLEM: Not sent to PocketBase, not accessible during execution
}

// Lines 224-243: Get validation stats
export async function getProjectValidationStats(projectId: string) {
  const errors = validationErrorsStore.filter(e => e.projectId === projectId);
  const sessions = validationSessionsStore.filter(s => s.projectId === projectId);

  return {
    totalErrors: errors.filter(e => e.severity === 'error').length,
    totalWarnings: errors.filter(e => e.severity === 'warning').length,
    totalFixed: errors.filter(e => e.isFixed).length,
    totalSessions: sessions.length,
    successfulSessions: sessions.filter(s => s.wasSuccessful).length,
    mostCommonErrors: getMostCommonErrors(errors),
    errorsByType: groupBy(errors, 'errorType'),
    recentErrors: errors.slice(0, 10),
  };
  // PROBLEM: Only available after execution, not during
}
```

**Issues**:
- Only in-memory, not persistent
- Not accessible during execution
- No error diff tracking (which errors fixed)
- No conversation association
- No checkpoint data

---

### File Operations Audit Trail
**File**: `/lib/file-operation-guards.ts`

```typescript
// Lines 286-297: File operation logging
export function logFileOperation(operation: FileOperation, success: boolean, error?: string) {
  const timestamp = new Date().toISOString();
  const status = success ? '✅ SUCCESS' : '❌ FAILED';

  console.log(`[FILE-OP] ${timestamp} ${status} ${operation.type.toUpperCase()}: ${operation.path}`);
  if (operation.reason) {
    console.log(`[FILE-OP]   Reason: ${operation.reason}`);
  }
  if (error) {
    console.log(`[FILE-OP]   Error: ${error}`);
  }
}
// PROBLEM: Only console logging, no structure or persistence
```

**Issues**:
- No file diff tracking
- No before/after state
- No rollback capability
- Not visible to user
- No transaction semantics

---

## Implementation Priority

### Phase 1: Visibility (1-2 days)
1. Create `DebugLogger` class for structured logging
2. Add progress events to debug workflow
3. Stream progress to client via SSE or WebSocket
4. Show real-time step-by-step progress

### Phase 2: Conversation Tracking (2-3 days)
1. Create `DebugConversation` model
2. Log full prompts and responses
3. Track model/tokens/duration per call
4. Store conversation in database

### Phase 3: Error Tracking (1-2 days)
1. Create error diff tracking
2. Show which errors were fixed
3. Detect regressions
4. Store in database

### Phase 4: Checkpointing (2-3 days)
1. Save state at each milestone
2. Enable resume after timeout
3. Implement rollback capability
4. Add transaction semantics

### Phase 5: Metrics & Dashboard (3-4 days)
1. Collect performance metrics
2. Build visualization UI
3. Add cost tracking
4. Create analytics dashboard

---

## Key Code Locations

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Timeout config | `/app/api/langgraph/execute/route.ts` | 79, 82-92 | Needs checkpoint |
| QA orchestrator | `/lib/langgraph/nodes/qa-node.ts` | 7-146 | Needs progress events |
| Debug workflow | `/lib/langgraph/subgraphs/autogen-debugger.ts` | 36-135 | Needs all logging |
| Analyst agent | `/lib/langgraph/subgraphs/autogen-debugger.ts` | 49-52 | No prompt logging |
| Fixer agent | `/lib/langgraph/subgraphs/autogen-debugger.ts` | 54-60 | No output logging |
| File ops agent | `/lib/langgraph/subgraphs/autogen-debugger.ts` | 62-85 | Limited logging |
| Reviewer agent | `/lib/langgraph/subgraphs/autogen-debugger.ts` | 87-90 | No logging |
| Event emitter | `/lib/langgraph/events.ts` | 5-138 | Console logs removed |
| Error logger | `/lib/services/validation-error-logger.ts` | 75-137 | In-memory only |
| File audit | `/lib/file-operation-guards.ts` | 286-297 | Console only |

