# Unified Messaging System - Quick Reference

**Last Updated:** 2025-11-14
**Status:** ✅ Core infrastructure complete, 7/16 tasks done

---

## 🎯 What Is This?

A **single, type-safe API** for all user-facing messages that replaces the previous fragmented 3-system architecture.

### Before (BROKEN):
```typescript
// ❌ Confusing - which to use?
addAssistantMessage(projectId, message, 'pm');  // Only saves, doesn't display!
emitChatMessage(projectId, message);             // Only displays, doesn't save!
emitNodeComplete('pm', state, duration, { summary: message }); // Auto-displays

// ❌ Easy to forget one and break UX
await addAssistantMessage(projectId, message, 'pm');
// Oops! Forgot emitChatMessage() - user never sees the message!
```

### After (FIXED):
```typescript
// ✅ One call does everything
await messageManager.sendEvent(projectId, {
  type: 'plan-ready',
  plan,
  phase1Features: ['Feature 1', 'Feature 2'],
  phase2Count: 5
}, 'pm');
// Automatically saves to database AND displays in UI!
```

---

## 📁 File Structure

```
lib/messaging/
├── message-types.ts        # All possible message events (13 types)
├── message-manager.ts      # Single API for sending messages
├── message-builder.ts      # Builder pattern for custom messages
└── tone-guidelines.ts      # Voice/tone standards & helpers
```

---

## 🚀 Quick Start

### 1. Import the MessageManager

```typescript
import { messageManager } from '@/lib/messaging/message-manager';
```

### 2. Send a Message

```typescript
// Example: PM Node sending plan with features
await messageManager.sendEvent(
  state.projectId,
  {
    type: 'plan-ready',
    plan: 'Your app plan here...',
    phase1Features: ['Landing Page', 'Dashboard'],
    phase2Count: 8
  },
  'pm'
);
```

### 3. That's It!

The message is automatically:
- ✅ Saved to `conversation_memory` database
- ✅ Displayed in chat UI via SSE
- ✅ Formatted consistently
- ✅ Type-checked by TypeScript

---

## 📋 Available Message Types

| Event Type | Node | Purpose |
|------------|------|---------|
| `plan-ready` | PM | Plan with Phase 1 features |
| `incremental-feature-planned` | PM | Feature addition |
| `design-ready` | UX | Design system created |
| `file-generation-complete` | Frontend | Files generated |
| `backend-complete` | Backend | API/DB generated |
| `validation-complete` | QA | Code validation results |
| `deployment-success` | DevOps | App deployed |
| `deployment-failed` | DevOps | Deployment error |
| `analysis-complete` | Context Analyzer | Analysis done |
| `clarification-needed` | Context Analyzer | Need user input |
| `editing-complete` | Editor | Files edited |
| `rollback-offer` | Editor | Offer to undo changes |
| `input-required` | Input Detector | Need API key, etc. |

**Generic types:** `success`, `error`, `question`, `info`, `warning`

---

## 💡 Common Patterns

### Success Message
```typescript
await messageManager.sendSuccess(
  projectId,
  'Files created successfully!',
  'frontend',
  'Created 5 components: Header, Footer, Sidebar, Hero, Contact'
);
```

### Error Message
```typescript
await messageManager.sendError(
  projectId,
  'Build failed',
  'qa',
  'TypeScript found type mismatches',
  'Run `npm run type-check` to see details'
);
```

### Question
```typescript
await messageManager.sendQuestion(
  projectId,
  'Which API provider would you like to use?',
  'input-detector',
  'api_key'
);
```

### Custom Message (Advanced)
```typescript
import { MessageBuilder } from '@/lib/messaging/message-builder';

const message = new MessageBuilder('custom-node')
  .setType('info')
  .addSection('Analysis', 'I found the following issues:')
  .addList(['Issue 1', 'Issue 2', 'Issue 3'])
  .addCode('const x: number = "string";', 'typescript')
  .build();

await messageManager.sendMessage(projectId, message);
```

---

## 🐛 Bugs Fixed

### Critical Bugs (HIGH severity)

**1. Backend Node** - Users never saw backend generation
```typescript
// ❌ BEFORE: Memory-only (broken)
addAssistantMessage(projectId, 'Backend generated', 'backend');
// Message saved but NEVER displayed!

// ✅ AFTER: Automatic display
await messageManager.sendEvent(projectId, {
  type: 'backend-complete',
  collections: [...],
  endpoints: [...],
  needsAuth: true
}, 'backend');
```

**2. QA Node** - Users never saw validation results
```typescript
// ❌ BEFORE: Memory-only (broken)
addAssistantMessage(projectId, 'Validation passed', 'qa');
// Message saved but NEVER displayed!

// ✅ AFTER: Automatic display
await messageManager.sendEvent(projectId, {
  type: 'validation-complete',
  valid: true,
  errorCount: 0,
  warningCount: 2,
  autoFixedCount: 3
}, 'qa');
```

**3. PM Node** - Original bug (fixed earlier, now migrated)
```typescript
// ❌ BEFORE: Had to remember both calls
await addAssistantMessage(projectId, plan, 'pm');
emitChatMessage(projectId, plan, { type: 'success' });

// ✅ AFTER: One call
await messageManager.sendEvent(projectId, {
  type: 'plan-ready',
  plan,
  phase1Features: [...],
  phase2Count: 5
}, 'pm');
```

---

## ✅ Migration Checklist

For each node that sends messages:

- [ ] Import `messageManager`
- [ ] Remove `addAssistantMessage` import (no longer needed directly)
- [ ] Remove `emitChatMessage` import (handled by messageManager)
- [ ] Find all `addAssistantMessage()` calls
- [ ] Find all `emitChatMessage()` calls
- [ ] Replace with `messageManager.sendEvent()` using appropriate event type
- [ ] Test that message appears in UI

**Example commit pattern:**
```
Fix: Migrate [NodeName] to Unified Messaging System

- Replace addAssistantMessage() + emitChatMessage() with messageManager.sendEvent()
- Use 'event-type-name' event for [specific message]
- Fixes bug where [message] was not displayed to users
```

---

## 📊 Migration Status

**Completed (7/16):**
- ✅ Core infrastructure (message-types, message-manager, builder, guidelines)
- ✅ PM Node
- ✅ Backend Node (critical bug fix)
- ✅ QA Node (critical bug fix)

**In Progress (0/16):**
- (None currently)

**Remaining (9/16):**
- ⏳ DevOps Node
- ⏳ Context Analyzer Node
- ⏳ Editor Node
- ⏳ Input Detector Node
- ⏳ Frontend Node
- ⏳ UX Node
- ⏳ ChatBubble component
- ⏳ ChatPanelClaude component
- ⏳ Documentation

---

## 🎨 Tone & Style Guidelines

### Voice
- Professional but friendly
- Expert assistant, not robotic
- Collaborative partner

### Tone
- ✅ DO: Active voice ("I created" not "was created")
- ✅ DO: Specific ("Updated Header, Footer" not "Updated some files")
- ✅ DO: User-focused ("Your app is ready!" not "Process completed")
- ❌ DON'T: Technical jargon ("I saved settings" not "I persisted config")
- ❌ DON'T: Excessive excitement (max 2 exclamation marks)

### Emoji Standards
- ✅ Success/Done
- 🚀 Deployed
- ❌ Error
- ⚠️ Warning
- 💡 Info/Tip
- ❓ Question
- 🔨 Building
- 🔍 Analyzing

**See `lib/messaging/tone-guidelines.ts` for full details**

---

## 🧪 Testing

### Test That Messages Display

1. Generate a new app
2. Watch for messages in chat UI:
   - **PM Node:** "🚀 Phase 1 Features (Building Now)"
   - **Backend Node:** "✅ Backend Generated" with collections
   - **QA Node:** "✅ Validation Passed" or "⚠️ Validation Issues Found"

3. Verify messages are both:
   - Visible in chat UI (real-time SSE)
   - Saved in database (check conversation_memory collection)

### Test Type Safety

```typescript
// This should give TypeScript error (missing required field):
await messageManager.sendEvent(projectId, {
  type: 'plan-ready',
  plan: 'My plan'
  // ❌ Missing: phase1Features, phase2Count
}, 'pm');
```

---

## 📚 Detailed Documentation

- **Migration Progress:** `MESSAGING_SYSTEM_MIGRATION_PROGRESS.md`
- **Original Bug Report:** `FIRST_MESSAGE_FIX.md`
- **Message Types Reference:** `lib/messaging/message-types.ts` (inline comments)
- **Tone Guidelines:** `lib/messaging/tone-guidelines.ts`

---

## 🤝 Contributing

When adding new message types:

1. Add event type to `MessageEvent` union in `message-types.ts`
2. Add formatter function (e.g., `formatBackendCompleteMessage`)
3. Add case to `formatMessageEvent()` switch
4. Update this documentation with new event type
5. Test that message displays correctly

**Example:**
```typescript
// 1. Add to MessageEvent union
export type MessageEvent =
  | { type: 'new-event-type'; field1: string; field2: number }
  | ...existing types;

// 2. Add formatter
function formatNewEventMessage(event: Extract<MessageEvent, { type: 'new-event-type' }>): string {
  return `✨ ${event.field1} - Count: ${event.field2}`;
}

// 3. Add to switch
case 'new-event-type':
  return {
    type: 'success',
    content: formatNewEventMessage(event),
    metadata: { nodeId }
  };
```

---

## ❓ FAQ

**Q: When should I use MessageBuilder instead of MessageEvent types?**
A: Only for truly custom messages not covered by the 13 event types. 99% of cases should use MessageEvent.

**Q: Can I still use addAssistantMessage() directly?**
A: Technically yes, but DON'T. It won't display in UI unless you also call emitChatMessage(). Use messageManager instead.

**Q: What if I only want to save to database, not display?**
A: Use `messageManager.sendEvent(projectId, event, nodeId, { display: false })`

**Q: What if I only want to display, not save?**
A: Use `messageManager.sendEvent(projectId, event, nodeId, { persist: false })`

**Q: How do I add custom actions (buttons) to messages?**
A: Use MessageBuilder:
```typescript
const message = new MessageBuilder('node')
  .addText('Would you like to undo?')
  .addAction({ type: 'rollback', label: 'Undo', data: { checkpointId: '123' } })
  .build();
```

---

**For full details, see:** `MESSAGING_SYSTEM_MIGRATION_PROGRESS.md`
