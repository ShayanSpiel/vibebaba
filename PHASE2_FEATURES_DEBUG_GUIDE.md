# Phase 2 Features Display - Debug Guide

## Issue Description
Phase 2 feature messages should appear AFTER workflow role messages (PM, Backend, Frontend, QA, DevOps), but currently:
- Role messages disappear when features appear, OR
- Features don't appear at all, OR
- Duplicate feature messages appear

## Expected Behavior

### Correct Message Flow:
1. **User message**: "Create a todo app"
2. **PM thinking**: "Product Manager • Thinking..."
3. **PM success**: "Product Manager • Creating plan for 3 features (2 in Phase 2)" [expandable]
4. **UX thinking**: "UX Designer • Thinking..."
5. **UX success**: "UX Designer • Design system ready" [expandable]
6. **Backend thinking**: "Backend Engineer • Thinking..."
7. **Backend success**: "Backend Engineer • Generated 2 collections..." [expandable]
8. **Frontend thinking**: "Frontend Engineer • Thinking..."
9. **Frontend success**: "Frontend Engineer • Generated 10 files..." [expandable]
10. **QA thinking**: "QA Engineer • Thinking..."
11. **QA success**: "QA Engineer • All checks passed" [expandable]
12. **DevOps thinking**: "DevOps Engineer • Thinking..."
13. **DevOps success**: "DevOps Engineer • Deployed 45 files successfully!" [expandable]
14. **Final success**: "✅ Success! Your app is ready in 12.3 seconds!"
15. **Phase 2 features**: Feature cards with +Add buttons (if any Phase 2 features exist)

**ALL messages should persist - nothing should disappear!**

---

## How It Works (Technical Flow)

### 1. Workflow Completes
When the last node (DevOps) finishes:
```typescript
// In lib/langgraph/workflow.ts or similar
emitWorkflowComplete(finalState, totalDuration);
```

### 2. Event Emitted with Features
```typescript
// In lib/langgraph/utils/logging/events.ts (line 140)
workflowEvents.emit('workflow:complete', {
  projectId: state.projectId,
  success: true,
  allRequestedFeatures: state.allRequestedFeatures || [], // ← CRITICAL
  metadata: {...},
  // ... other data
});
```

### 3. ChatPanelClaude Receives Event
```typescript
// In components/project/ChatPanelClaude.tsx (lines 517-587)
if (data.type === 'workflow:complete') {
  const { message, suggestedFeatures } = generateWorkflowSummary(workflowData);

  // Creates TWO messages:
  // 1. Summary message (success text)
  // 2. Features message (with action buttons)

  setMessages((prev) => {
    const newMessages = [...prev, summaryMessage]; // ← Preserve prev!
    if (featuresMessage) {
      newMessages.push(featuresMessage);
    }
    return newMessages;
  });
}
```

### 4. Features Filtered by Phase
```typescript
// In lib/messaging/workflow-summary.ts (lines 107-109)
const suggestedFeatures =
  data.allRequestedFeatures?.filter(
    (f) => !f.included_in_mvp && (f.suggested || f.phase > 1)
  ) || [];
```

**Filter Logic:**
- `!f.included_in_mvp` - NOT in MVP (Phase 1)
- `f.suggested || f.phase > 1` - Either suggested OR Phase 2+

---

## Debug Steps

### Step 1: Check if allRequestedFeatures Exists
Open browser console during app generation and look for:
```
[Chat SSE] Workflow complete: {...}
[Chat SSE] allRequestedFeatures: [...]
```

**If undefined/empty:**
- Features not being created in PM node
- Features not being passed through state
- Check PM node feature extraction

### Step 2: Check Suggested Features Count
Look for:
```
[Chat SSE] Suggested features count: 2
```

**If 0 but allRequestedFeatures has items:**
- Filter logic issue
- Features marked as `included_in_mvp: true` (should be false for Phase 2)
- Features missing `phase` or `suggested` fields

### Step 3: Check Message Creation
Look for:
```
[Chat SSE] Features message: {role: 'system', content: '', actions: [...]}
```

**If null:**
- `suggestedFeatures.length === 0`
- Go back to Step 2

### Step 4: Check Message Appending
Look for:
```
[Chat SSE] Current message count before workflow:complete: 15
[Chat SSE] Added features message with 2 features
[Chat SSE] New message count after workflow:complete: 17
```

**If message count DECREASES:**
- Message loss detected! Check for race conditions
- Check if other code is calling setMessages() concurrently

### Step 5: Check Message Rendering
Inspect the DOM for feature action buttons:
```html
<div class="flex flex-col gap-2 mt-3 ml-12">
  <button>...</button> <!-- Feature cards -->
</div>
```

**If not rendered but message exists:**
- Check `msg.actions` rendering logic (line 1163)
- Verify message has `role: 'system'` and `actions` array

---

## Common Issues & Fixes

### Issue 1: Features Not Being Created
**Symptom:** `allRequestedFeatures` is empty or undefined

**Check:**
```typescript
// In PM node (lib/langgraph/nodes/pm/index.ts)
const allRequestedFeatures = [
  ...phase1Features.map(f => ({ ...f, phase: 1, included_in_mvp: true })),
  ...phase2Features.map(f => ({ ...f, phase: 2, included_in_mvp: false }))
];
```

**Fix:** Ensure phase2Features are being created and marked correctly.

### Issue 2: Features Marked as Phase 1
**Symptom:** Features exist but filter removes them all

**Check feature objects:**
```javascript
{
  id: 'feat-1',
  name: 'User Authentication',
  phase: 2, // ← Should be 2 for Phase 2
  included_in_mvp: false, // ← Should be false
  suggested: true, // ← OR this should be true
  completed: false
}
```

### Issue 3: Messages Disappearing
**Symptom:** Role messages vanish when workflow completes

**Possible Causes:**
1. **Race condition with persistence** - `onUpdateProject({messages})` overwrites with old data
2. **Parent component reset** - Parent is re-rendering and resetting messages
3. **Deduplication bug** - Messages being removed incorrectly

**Debug:**
- Check console for "MESSAGE LOSS DETECTED" error
- Check if `prev.length` is correct before workflow:complete
- Verify no other `setMessages()` calls during workflow:complete

### Issue 4: Duplicate Feature Messages
**Symptom:** Multiple sets of feature buttons appear

**Possible Causes:**
1. **workflow:complete fired multiple times** - Check event listener cleanup
2. **Message persistence bug** - Old messages loaded + new messages added

**Fix:**
- Check SSE connection lifecycle (lines 268-302)
- Verify `eventSource.close()` is called properly
- Add event deduplication if needed

---

## Quick Fix Checklist

If Phase 2 features aren't showing:

- [ ] Console shows `allRequestedFeatures` array with items
- [ ] Console shows `phase: 2` for Phase 2 features
- [ ] Console shows `included_in_mvp: false` for Phase 2 features
- [ ] Console shows `Suggested features count: N` where N > 0
- [ ] Console shows features message created
- [ ] Console shows message count increasing (not decreasing)
- [ ] DOM has feature action buttons rendered
- [ ] All role messages still visible above features

---

## Testing Command

To test the full flow:
1. Generate new app: "Create a todo app with user authentication"
2. Watch console logs during generation
3. After workflow completes, check:
   - All 6-7 role messages visible (thinking + success for each)
   - Final success message visible
   - Feature cards visible below (if Phase 2 features exist)
4. Scroll through chat - verify nothing disappeared

---

## Files to Check

If debugging:
1. `lib/langgraph/nodes/pm/index.ts` - Feature creation
2. `lib/langgraph/utils/logging/events.ts:162` - allRequestedFeatures in event
3. `lib/messaging/workflow-summary.ts:107-109` - Feature filtering
4. `components/project/ChatPanelClaude.tsx:517-587` - Event handling
5. `components/project/ChatPanelClaude.tsx:1163-1226` - Feature rendering

---

## Latest Changes Made

### Added Extensive Logging
All key points now log to console:
- allRequestedFeatures array
- Generated summary message
- Suggested features count
- Features message object
- Message counts before/after
- Sanity check for message loss

### Added Message Loss Detection
```typescript
if (newMessages.length < prev.length) {
  console.error('❌ MESSAGE LOSS DETECTED!');
  return prev; // Prevent message loss
}
```

This will catch any accidental message removal and prevent it.

---

## Next Steps

1. **Run a test generation** and watch console logs
2. **Share console output** showing:
   - allRequestedFeatures
   - Suggested features count
   - Message counts
3. **Check if features appear** in DOM
4. **Verify no messages disappeared** by scrolling up

The extensive logging will reveal exactly where the issue is occurring.
