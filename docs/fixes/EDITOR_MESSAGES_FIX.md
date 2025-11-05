# Editor Messages Not Displaying - ROOT CAUSE FIX

## Problem
User reported that editor node conversational messages and detailed summaries were NOT appearing in the UI despite being implemented in the code.

## Root Cause Analysis

The editor node WAS correctly emitting all events:
- ✅ `emitNodeStart('editor', state, { userInput, interpretation, plan })`
- ✅ `emitProgress('editor', projectId, "🔍 Analyzing your code structure...")`
- ✅ `emitNodeComplete('editor', state, duration, { summary: conversationalSummary })`

The SSE stream endpoint WAS correctly listening to these events.

The WorkflowProgress component WAS ready to display them with Markdown formatting.

**However**, the SSE connection (`useWorkflowLogs` hook) was **ONLY enabled when `isGenerating === true`**.

The ChatPanel component had this condition to enable the SSE connection:
```typescript
if (onGeneratingChange && (project.stage === "building" || project.stage === "editing")) {
  onGeneratingChange(true);
}
```

**THE PROBLEM:** After initial app generation, the DevOps node sets `stage = 'complete'`. When users edit a completed project:
- `project.stage === "complete"` ❌
- Condition evaluates to false ❌
- `onGeneratingChange(true)` is NEVER called ❌
- SSE connection is NEVER established ❌
- Events are emitted but no one is listening ❌

## The Fix

Changed the condition from stage-based to file-based:

**File:** `components/project/ChatPanelClaude.tsx:202`

```typescript
// BEFORE: Stage-based check (fails for completed projects)
if (onGeneratingChange && (project.stage === "building" || project.stage === "editing")) {
  onGeneratingChange(true);
}

// AFTER: File existence check (works for all stages)
if (onGeneratingChange && project.files && project.files.length > 0) {
  onGeneratingChange(true);
}
```

## Why This Works

- Enables SSE connection for ANY project stage as long as files exist
- Works for: `building`, `editing`, AND `complete` stages
- Simple, reliable check that doesn't depend on stage enumeration
- Follows the principle: if files exist, editing is possible, so enable workflow logs

## Impact

✅ Editor node conversational messages now display in UI
✅ Progress updates visible: "🔍 Analyzing your code structure..."
✅ Detailed completion summary with file stats displays
✅ QA "Calling Engineers!" message shows
✅ All workflow events now visible during editing

## Related Changes

### 1. Added callback to ChatPanel
**File:** `components/project/ChatPanelClaude.tsx`
- Added `onGeneratingChange?: (isGenerating: boolean) => void` prop
- Call `onGeneratingChange(true)` when editing starts
- Call `onGeneratingChange(false)` when editing completes

### 2. Passed callback from project page
**File:** `app/project/[id]/page.tsx`
- Pass `onGeneratingChange={setIsGenerating}` to ChatPanelClaude
- This allows ChatPanel to control the parent's `isGenerating` state

### 3. SSE connection lifecycle
1. User sends chat message to edit app
2. ChatPanel checks if files exist
3. If yes, calls `onGeneratingChange(true)`
4. Project page sets `isGenerating = true`
5. `useWorkflowLogs` hook sees `enabled: isGenerating` and creates SSE connection
6. Editor node runs and emits events
7. SSE stream receives events and sends to client
8. WorkflowProgress displays messages
9. When API returns, ChatPanel calls `onGeneratingChange(false)`

## Testing

To verify the fix works:
1. Create a new project (stage will be 'complete' after generation)
2. Send a chat message to edit the app (e.g., "Change the title color to blue")
3. Check browser DevTools Console for:
   - `[SSE] New connection for project {projectId}` ✅
   - Editor node progress messages ✅
4. Check UI for:
   - "Software Engineer" role in WorkflowProgress ✅
   - Conversational start message ✅
   - Progress updates ✅
   - Detailed completion summary ✅

## Summary

The issue was NOT with the editor node implementation, SSE stream, or UI components. All of those were working correctly. The issue was that the SSE connection was never being established for completed projects because of a stage-based condition that excluded them. Changing to a file-based condition fixed it.
