# VB App Generation Pipeline - Quick Reference

## 7 Stages Overview

| Stage | Node | Location | Agent | Duration | Status |
|-------|------|----------|-------|----------|--------|
| 1 | Founder | `founder-node.ts` | CEO analyzing requirements | 5-15s | Sequential |
| 2 | PM | `pm-node.ts` | Product manager planning + mode detection | 10-20s | Sequential |
| 3 | UX | `ux-node.ts` | UX designer + styling + MCP (2s timeout) | 15-30s | Sequential |
| 4A | Frontend | `frontend-router.ts` → `frontend-node.ts` OR `frontend-node-nextjs.ts` | Frontend engineer generating code | 20-40s | **PARALLEL** with Backend |
| 4B | Backend | `backend-node.ts` | Backend engineer designing schema | 5-10s | **PARALLEL** with Frontend |
| 5 | QA | `qa-node.ts` + `autogen-debugger.ts` subgraph | QA manager validating + multi-agent debugging (max 2 attempts) | 30-120s | Sequential |
| 6 | DevOps | `devops-node.ts` | DevOps engineer deploying to DB | 5-15s | Sequential |

**Total Pipeline Duration:** 10 minutes max (600,000ms) - entire workflow has hard timeout

**Entry Point:** `POST /api/langgraph/execute`

---

## Key Logging Points by Stage

### Stage 1: Founder
```
✓ emitNodeStart() - Thinking process
✓ generateWithFallback() - AI analysis (1 call)
✓ Memory check - getProjectContext()
✓ Memory storage - addObservation()
✓ emitNodeComplete() - Task output, target audience, complexity
```

### Stage 2: PM
```
✓ emitNodeStart() - Thinking process
✓ generateWithFallback() - App type analysis (1 call)
✓ generateWithFallback() - Product plan generation (1 call)
✓ console.log() - Mode detection: ${mode} (${confidence})
✓ console.log() - Reasons: ${reasons}
✓ emitNodeComplete() - App type, design style, feature count, MODE INFO
```

### Stage 3: UX
```
✓ emitNodeStart() - Thinking process
✓ generateWithFallback() - Component selection (1 call)
✓ generateWithFallback() - Styling extraction (1 call)
✓ console.log() - Styling config extracted
✓ gatherBackgroundContext() - MCP research with 2s timeout (OPTIONAL)
✓ Memory retrieval - getUserPreferences()
✓ Memory storage - storeUserPreference(), addObservation()
✓ console.log() - Styling preferences and component selection stored
✓ emitNodeComplete() - Selected components, design style, MCP context flag
```

### Stage 4A: Frontend (HTML or Next.js)
```
✓ emitNodeStart() - Thinking process
✓ frontendRouter() - Route decision based on generationMode
  
  IF HTML:
  ✓ generateWithFallback() - HTML code generation (1 call with metadata)
  ✓ injectDatabaseScript() - Database integration
  ✓ console.log() - Single-file or multi-file response
  
  IF NEXTJS:
  ✓ generateWithFallback() - Next.js generation (1 call with metadata)
  ✓ parseNextJSFiles() - Parse file structure
  ✓ ensureRequiredNextJSFiles() - Validate structure

✓ emitNodeComplete() - Files generated, model, provider, isMultiPage, databaseInjected
```

### Stage 4B: Backend (PARALLEL)
```
✓ emitNodeStart() - Thinking process
✓ generateWithFallback() - Schema design (1 call)
✓ console.warn() - Multiple collections validation
✓ emitNodeComplete() - Collection name, field count, pages, isMultiPage
```

### Stage 5: QA & AutoGen Debugging
```
✓ emitNodeStart() - Thinking process
✓ validateCode() - Run validation checks

IF ERRORS FOUND:
  FOR attempt = 1 to 2:
    ✓ generateWithFallback() - Code Analyst (1 call, error analysis)
    ✓ generateWithFallback() - Code Fixer (1 call, regenerate code)
    ✓ generateWithFallback() - File Operations Agent (1 call, propose operations)
    ✓ filterOperations() - Validate safety
    ✓ executeFileOperations() - Apply safe operations
    ✓ console.log() - File operation results (create/delete/rename)
    ✓ logFileOperation() - Detailed file operation logging
    ✓ generateWithFallback() - Reviewer Agent (1 call, review fixes)
    ✓ validateCode() - Re-validate fixed code
    ✓ collaborationLog.push() - Track all agent activities

✓ emitNodeComplete() - Initial errors, final errors, attempts, fixed count
✓ Artifacts storage - debugMetadata with collaboration log and fileOperations
```

### Stage 6: DevOps
```
✓ emitNodeStart() - Thinking process
✓ pb.collection('projects').update() - Store in database
✓ console.log() - Update success or create fallback
✓ emitNodeComplete() - Files deployed, preview URL, database status, validation status
```

### Execute Route Level
```
✓ emitWorkflowStart() - Workflow begins
✓ console.log() - Project ID
✓ workflow.invoke() - Execute full pipeline with 10-minute timeout
✓ console.log() - Completed nodes flow, file count, debug attempts, deploy URL
✓ emitWorkflowComplete() - Final workflow event
✓ consumeTokens() - Credit consumption tracking
```

### Real-Time Streaming
```
✓ GET /api/langgraph/stream?projectId=X
✓ Stream events: connected, node:start, node:complete, node:error, workflow:complete
✓ Each event includes: timestamp, nodeName, thinkingProcess, taskDetails, duration
```

---

## AI Conversation Tracking Status

### What's Tracked
- ✅ Model used per call (returned in AIGenerationResult)
- ✅ Fallback attempts log (attempts to use which models)
- ✅ Prompt structure (visible in code, not persistent log)
- ✅ Response length for each generation
- ✅ Task details and summaries

### What's Missing
- ❌ Persistent prompt + response pairs
- ❌ Token usage metrics
- ❌ AI model switching history
- ❌ Per-stage AI cost analysis
- ❌ Conversation history across iterations

### Memory Service Tracking
- ✅ User preferences (designStyle, darkMode, favoriteComponents)
- ✅ Project context (description, plan, designDecisions)
- ✅ Styling choices (colors, fonts, animations)
- ✅ Component selections
- ⚠️ Conversation messages (interface exists but not heavily used)

---

## Timeout Coverage (10 Minutes)

**What's covered by the timeout:**
- ALL 7 stages (Founder → PM → UX → Frontend/Backend → QA → DevOps)
- All AI calls within stages
- All validation and debugging attempts
- Database operations

**Bottlenecks within timeout:**
1. **QA/AutoGen (Stage 5)**: Up to 2 debug attempts × 4 AI calls each = 8 AI calls worst case
2. **Frontend (Stage 4A)**: Large code generation can take 20-40s
3. **MCP Research (Stage 3)**: Has its own 2s timeout to prevent blocking

**If timeout exceeded:**
- Workflow terminates
- Error: "Workflow timeout after 10 minutes"
- Partial results returned
- No automatic resumption from checkpoint

---

## State Flow Across Pipeline

```
User Input
  ↓
[Stage 1: Founder] → refinedRequirements, businessContext
  ↓
[Stage 2: PM] → plan, context (including generationMode)
  ↓
[Stage 3: UX] → componentNeeds, stylingConfig, designSystemPrompt, backgroundContext
  ↓
┌─────────────────────────────────────────┐
│ [Stage 4A: Frontend] ↔ [Stage 4B: Backend] │  PARALLEL
│ → files               → backendConfig    │
└─────────────────────────────────────────┘
  ↓
[Stage 5: QA] → validationResult, debugAttempts
  ↓
[Stage 6: DevOps] → deployUrl
  ↓
Final State (completedNodes, errors, artifacts, stage='complete')
```

---

## Async Event Stream Architecture

**Real-time visibility via SSE:**

```
Client                           Server
  │                               │
  ├──────────────────────────────→ GET /api/langgraph/stream?projectId=X
  │                               │
  │  ← ────────────── [connected] ◄─────────────┐
  │                               │             │
  │  ← ────────── [node:start] ◄──┤ Founder starts
  │     {thinkingProcess}          │
  │                               │
  │  ← ─────── [node:complete] ◄──┤ Founder done (5-15s)
  │     {taskDetails, duration}    │
  │                               │
  │  ← ────────── [node:start] ◄──┤ PM starts
  │                               │
  │  ...continues for each node... │
  │                               │
  │  ← ─── [workflow:complete] ◄──┤ All done (600s max)
  │                               │
  │  Stream closes after 1s delay  │
```

---

## Error Recovery Pattern

```
Node Execution
  ↓
[Error Caught]
  ↓
withErrorRecovery() wrapper
  ├─ Log error to console
  ├─ Emit emitNodeError() event
  ├─ Add to state.errors array
  ├─ Add to completedNodes anyway
  └─ Return fallback partial state
  ↓
Workflow continues with fallback values
```

**Fallback Values by Stage:**
- **Founder**: Default audience, default metrics
- **PM**: Default plan, generic context
- **UX**: Minimal components, default styling
- **Frontend**: Basic HTML skeleton
- **Backend**: Generic "items" collection
- **QA**: Returns code with errors noted (no recovery)
- **DevOps**: Attempts create if update fails

---

## File Structure for Logging

To implement comprehensive logging:

### 1. Structured Event Log
```
/lib/services/event-logger.ts
├─ logStageStart(stage, nodeData)
├─ logAICall(stage, model, prompt, response, duration)
├─ logValidation(files, errors, warnings)
├─ logDebugAttempt(attempt, analysis, fixes, fileOps)
└─ logStageCpmplete(stage, output, duration)
```

### 2. AI Interaction Log
```
/lib/services/ai-conversation-logger.ts
├─ logPrompt(stage, prompt)
├─ logResponse(stage, model, response, tokens)
├─ getConversationHistory(projectId)
└─ storeInMemory(projectId, conversation)
```

### 3. Performance Metrics
```
/lib/services/performance-tracker.ts
├─ recordStageTiming(stage, duration)
├─ calculateETA(completedStages)
├─ getBottlenecks()
└─ analyzeTimeout(timeout, currentDuration)
```

### 4. File Operations Audit
```
/lib/services/file-audit-logger.ts
├─ logFileOperation(op, success, reason)
├─ getFileOperationHistory(projectId)
├─ compareFileStates(before, after)
└─ trackDiffChanges(files, iterations)
```

---

## Testing & Debugging

### Check Real-Time Stream
```bash
curl -N "http://localhost:3000/api/langgraph/stream?projectId=test-123"
```

### Trigger Full Pipeline
```bash
curl -X POST http://localhost:3000/api/langgraph/execute \
  -H "Content-Type: application/json" \
  -d '{"description": "A simple landing page"}'
```

### Monitor Console Logs
- **[Workflow]** - Top-level orchestration
- **[Founder]** - Requirements analysis
- **[PM]** - Planning and mode detection
- **[UX]** - Component and styling
- **[Frontend]** - Code generation
- **[Backend]** - Schema design
- **[QA]** - Validation
- **[AutoGen Debugger]** - Multi-agent debugging
- **[DevOps]** - Deployment
- **[AI]** - Model selection and fallback
- **[SSE]** - Event streaming

---

## Performance Tips

1. **AutoGen debugging** reduces timeout risk by capping at 2 attempts
2. **MCP research** timeouts after 2 seconds to not block UX stage
3. **Frontend/Backend** run in parallel to save ~20-30 seconds
4. **Validation** is aggressive (autoFix enabled) to reduce debug loops
5. **Memory service** caches user preferences to skip redundant analysis

---

## Key Files Reference

### Core Orchestration
- `/lib/langgraph/workflow.ts` - Main workflow definition
- `/lib/langgraph/types.ts` - State interface
- `/app/api/langgraph/execute/route.ts` - Entry point with timeout

### Nodes (Stages)
- `/lib/langgraph/nodes/founder-node.ts`
- `/lib/langgraph/nodes/pm-node.ts`
- `/lib/langgraph/nodes/ux-node.ts`
- `/lib/langgraph/nodes/frontend-router.ts` → `frontend-node.ts` or `frontend-node-nextjs.ts`
- `/lib/langgraph/nodes/backend-node.ts`
- `/lib/langgraph/nodes/qa-node.ts`
- `/lib/langgraph/nodes/devops-node.ts`

### Subgraphs
- `/lib/langgraph/subgraphs/autogen-debugger.ts` - Multi-agent debugging

### Events & Streaming
- `/lib/langgraph/events.ts` - Event definitions
- `/app/api/langgraph/stream/route.ts` - SSE streaming

### Services
- `/lib/services/memory-service.ts` - Context storage
- `/lib/ai.ts` - AI model selection and fallback
- `/lib/validation/index.ts` - Code validation layer

