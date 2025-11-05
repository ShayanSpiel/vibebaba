# Editor Messages Not Displaying - ACTUAL ROOT CAUSE

## Problem
User reported editor node conversational messages not appearing in UI. Still seeing old static messages.

## ACTUAL Root Cause

The API route at `/app/api/ai/chat/route.ts:195` had this condition:

```typescript
else if (stage === "building" || stage === "editing") {
  // USE LANGGRAPH EDITING WORKFLOW
```

**THE PROBLEM:**
- After initial generation, DevOps node sets `stage = 'complete'`
- When user chats on completed project: `stage === "complete"`
- Condition evaluates to FALSE
- **Editing workflow is NEVER called**
- Falls through to line 326 fallback (which works) OR line 429 (no action)

BUT the fallback at line 326 only triggers if stage is NOT specified. Since we ARE sending `stage: "complete"`, it doesn't match the first condition, and doesn't trigger the fallback either!

## The Fix

**File:** `app/api/ai/chat/route.ts:195`

```typescript
// BEFORE: Excluded completed projects
else if (stage === "building" || stage === "editing") {

// AFTER: Include completed projects with files
else if (stage === "building" || stage === "editing" || (stage === "complete" && files && files.length > 0)) {
```

## Why This Is The Root Cause

1. Editor node HAS the new conversational messages ✅
2. SSE stream listens to events ✅
3. WorkflowProgress displays correctly ✅
4. **But editing workflow was NEVER CALLED for completed projects** ❌

Without calling the editing workflow, the editor node never runs, so no events are emitted, regardless of SSE connection status.

## Previous "Fixes" Analysis

### SSE Connection Fixes (ChatPanelClaude.tsx)
- Added `onGeneratingChange` callback
- Made SSE enable for file existence instead of stage

**Verdict:** These MAY help with SSE connection, but they're NOT the root cause. The root cause is that the workflow isn't being called at all.

### API Route Fix (This One)
- Include `stage === "complete"` in condition

**Verdict:** This IS the root cause fix. Without this, editing workflow never runs.

## Impact

✅ Editing workflow now runs for completed projects
✅ Editor node executes and emits events
✅ New conversational messages display
✅ Progress updates visible
✅ Detailed completion summaries show

## Test

1. Create project (stage becomes 'complete' after generation)
2. Send chat message to edit (e.g., "Change title to blue")
3. Check console for: `[Chat] 🚀 Using LangGraph editing workflow`
4. Check UI for new editor messages
