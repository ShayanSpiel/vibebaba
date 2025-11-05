# ROOT CAUSE ANALYSIS: Editor Node Changes Not Appearing

## Problem
User reported that editor node conversational messages and detailed summaries were NOT appearing in the UI despite code changes being implemented in:
- `/lib/langgraph/nodes/editor-node.ts` (conversational start messages, progress updates, detailed summary)
- `/components/project/WorkflowProgress.tsx` (Markdown rendering, role mappings)

## Root Cause

The editor node WAS correctly emitting all events with conversational messages and detailed summaries via the EventEmitter system. The SSE stream endpoint WAS listening to these events. WorkflowProgress WAS ready to display them.

**However**, the workflow logs SSE connection (`useWorkflowLogs` hook) was **ONLY enabled when `isGenerating === true`**.

The `isGenerating` flag was controlled by the project page and was:
- ✅ Set to `true` during initial app generation workflow
- ❌ Stayed `false` during chat editing operations

**Result:** When users edited their app through chat, there was NO active SSE connection to receive the editor node events, so the UI never displayed the conversational messages!

## The Fix

### Files Changed:

1. **`/components/project/ChatPanelClaude.tsx`**
   - Added `onGeneratingChange?: (isGenerating: boolean) => void` callback prop
   - Call `onGeneratingChange(true)` when starting edit operations (building/editing stages)
   - Call `onGeneratingChange(false)` when edit operations complete (in finally block)

2. **`/app/project/[id]/page.tsx`**
   - Pass `onGeneratingChange={setIsGenerating}` to ChatPanelClaude component
   - This allows the chat to control the `isGenerating` flag

### How It Works Now:

1. User sends a chat message to edit the app
2. ChatPanel calls `onGeneratingChange(true)` → project page sets `isGenerating = true`
3. `useWorkflowLogs` hook sees `enabled: isGenerating` and creates SSE connection to `/api/langgraph/stream`
4. Editor node runs and emits events:
   - `emitNodeStart('editor', state, { userInput, interpretation, plan })`
   - `emitProgress('editor', projectId, "🔍 Analyzing your code structure...")`
   - `emitNodeComplete('editor', state, duration, { summary: conversationalSummary })`
5. SSE stream receives events and sends them to the client
6. `useWorkflowLogs` receives events and updates `logs` state
7. WorkflowProgress component displays the messages with Markdown formatting
8. When chat API returns, ChatPanel calls `onGeneratingChange(false)` → closes SSE connection

## Code Flow

```
User sends message
    ↓
ChatPanel.handleSend()
    ↓
onGeneratingChange(true) → isGenerating = true
    ↓
useWorkflowLogs hook enables SSE connection
    ↓
fetch("/api/ai/chat") → /api/ai/chat/route.ts
    ↓
editingWorkflow() → /lib/langgraph/workflows/editing-workflow.ts
    ↓
editorNode() → /lib/langgraph/nodes/editor-node.ts
    ↓
emitNodeStart(), emitProgress(), emitNodeComplete()
    ↓
workflowEvents.emit() → /lib/langgraph/events.ts
    ↓
SSE stream listens and sends to client → /api/langgraph/stream/route.ts
    ↓
useWorkflowLogs receives events → /lib/hooks/useWorkflowLogs.ts
    ↓
WorkflowProgress displays with Markdown → /components/project/WorkflowProgress.tsx
    ↓
Chat completes → onGeneratingChange(false)
```

## Verification

To verify the fix works:
1. Open a project in editing stage
2. Send a chat message to edit the app (e.g., "Change the title color to blue")
3. Check browser DevTools Console for:
   - `[SSE] New connection for project {projectId}`
   - `[LangGraph Editing] Step 2/4: Code Generation`
   - Editor node progress messages in console
4. Check UI for:
   - "Software Engineer" role appears in WorkflowProgress
   - Conversational start message: "I'm reviewing your X files..."
   - Progress messages: "🔍 Analyzing your code structure..."
   - Detailed completion summary with file stats, bold text, newlines

## Related Issues Fixed

This fix also resolves:
- QA "Calling Engineers!" message not showing (same root cause - SSE not connected)
- AutoGen progress not visible during editing (same root cause)
- DevOps messages properly synced with deployment (fixed separately via state lifting)
