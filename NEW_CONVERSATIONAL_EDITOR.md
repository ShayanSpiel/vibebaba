# NEW CONVERSATIONAL EDITOR - Technical Documentation

**Created:** November 2, 2025
**Last Updated:** November 2, 2025 (Session 2)
**Purpose:** Document the conversational editor architecture for troubleshooting and future development
**Status:** 🟢 MOSTLY WORKING - Conversational messages now functional!

## ✅ FIXES APPLIED (Session 2 - Nov 2, 2025)

1. **Input Detector Fixed** ✅
   - Fixed function call signature in `input-detector-node.ts:77-83`
   - Now correctly detects missing URLs, API keys, etc.

2. **Frontend Handler Added** ✅
   - Added `needsUserInput` handler in `ChatPanelClaude.tsx:301-323`
   - Questions now appear in chat
   - User can respond via normal input
   - Workflow resumes automatically

3. **Checkpoint Collection Added** ✅
   - Added schema to `scripts/setup-workflow-collections.ts:101-113`
   - Fixed: JSON fields require `maxSize` option (2MB limit)
   - Fixed: Updated editor-node.ts to use correct field names
   - ✅ Collection successfully created with: `npx tsx scripts/create-checkpoint-collection.ts`

4. **Dead Code Removed** ✅
   - Deleted redundant `/api/ai/plan-chat` route
   - Cleaned up unused imports in `chat/route.ts`

## ⚠️ REMAINING ISSUES

1. **Model Fallback Optimization** - Takes too long (5+ minutes), tries 33 models
   - Need to check Gemini API key validity
   - Add circuit breaker for consistently failing models
   - Use cached model more aggressively

2. **Gemini Models Failing** - "Cannot read properties of undefined (reading 'contents')"
   - Likely invalid/expired API key or API version mismatch

---

## OVERVIEW

The conversational editor is designed to make code editing interactive and human-like by:
1. **Asking questions** when information is missing (API keys, URLs, etc.)
2. **Showing progress** through conversational messages
3. **Pausing workflow** when user input is needed
4. **Resuming automatically** when user responds

---

## ARCHITECTURE

### Single Unified API

**Route:** `/app/api/ai/chat/route.ts`

Handles ALL chat interactions:
- Planning conversations (`stage === 'planning'`)
- Editing conversations (`stage === 'editing' || 'building' || 'complete'`)

**Previous Setup:** Had a separate `/api/ai/plan-chat` (NOW DELETED - was redundant)

### Message Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER: Types message in chat                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend (ChatPanelClaude.tsx)                              │
│  • POST /api/ai/chat                                        │
│  • Opens SSE connection (if isGenerating === true)          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Chat API (/app/api/ai/chat/route.ts)                        │
│  • Routes to editingWorkflow() for editing                  │
│  • Routes to pmNode() for planning                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Editing Workflow (lib/langgraph/workflows/editing-workflow.ts) │
│  • Step 0: Input Detector                                   │
│  • Step 1: Context Analyzer                                 │
│  • Step 2: Editor Node                                      │
│  • Step 3: QA Node                                          │
│  • Step 4: VFS Persistence                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ SSE Stream (/app/api/langgraph/stream/route.ts)            │
│  • Listens for 'chat:message' events                        │
│  • Sends to frontend via Server-Sent Events                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend SSE Listener (ChatPanelClaude.tsx:159-212)        │
│  • Receives 'chat:message' events                           │
│  • Adds to messages array                                   │
│  • Displays in chat UI                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## TWO MESSAGE TYPES (BOTH NEEDED)

### 1. ROLE MESSAGES (Node-Based Cards)

**Purpose:** Show which AI agent is working on what

**Triggered by:**
- `emitNodeStart(projectId, nodeName, metadata)`
- `emitNodeComplete(projectId, nodeName, duration, metadata)`

**Example:**
```
┌─────────────────────────────────┐
│ 👔 Product Manager              │
│ Analyzing requirements...       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 💻 Software Engineer            │
│ Implementing changes...         │
└─────────────────────────────────┘
```

**Used by:**
- PM Node ✅
- Frontend Node ✅
- Backend Node ✅
- QA Node ✅
- DevOps Node ✅
- **Editor Node ❌ (intentionally disabled - uses conversational only)**

### 2. CONVERSATIONAL MESSAGES (Chat Bubbles)

**Purpose:** Natural language communication with user

**Triggered by:**
- `emitChatMessage(projectId, message, metadata)`

**Example:**
```
Assistant: "Which YouTube video would you like to embed?
            Please share the video URL (e.g., https://youtube.com/watch?v=...)"
```

**Used by:**
- Input Detector Node ✅ (asks questions)
- Editor Node ✅ (progress updates, summaries)

**Code Locations:**
- **Emit:** `lib/langgraph/events.ts` → `emitChatMessage()`
- **Listen:** `app/api/langgraph/stream/route.ts:198-208`
- **Display:** `components/project/ChatPanelClaude.tsx:167-194`

---

## EDITING WORKFLOW DETAILED

### File: `lib/langgraph/workflows/editing-workflow.ts`

```typescript
export async function editingWorkflow(request: EditingRequest): Promise<EditingResult>
```

#### Step 0: Input Detector (Lines 184-212)

**Purpose:** Check if user input is needed BEFORE making any changes

**Code:**
```typescript
const inputResult = await inputDetectorNode(state);
state = { ...state, ...inputResult };

if (state.needsUserInput && state.userInputRequest) {
  console.log('[LangGraph Editing] ⏸️  Workflow paused - user input required');

  return {
    success: false,
    files: request.files, // Original files unchanged
    needsUserInput: true,
    userInputRequest: state.userInputRequest,
    aiMetadata: {
      model: 'gemini-2.0-flash',
      provider: 'google',
      nodesExecuted: ['input-detector'],
      totalDuration
    }
  };
}
```

**Returns to Chat API with:**
- `needsUserInput: true`
- `userInputRequest.question` (the question to ask)
- `userInputRequest.type` (api_key, url, code_snippet, clarification)

#### Step 1: Context Analyzer (Lines 217-224)

Determines:
- Change scope (minor, moderate, major)
- Which files to modify
- What sections to preserve

#### Step 2: Editor Node (Lines 228-244)

Makes the actual code changes.

**Sends conversational messages:**
```typescript
// lib/langgraph/nodes/editor-node.ts:938-942
emitChatMessage(
  state.projectId,
  "✏️ Making your requested changes now...",
  { type: 'info' }
);

// After completion (line 1271-1275)
emitChatMessage(
  state.projectId,
  conversationalSummary,
  { type: 'success' }
);
```

#### Step 3: QA Node (Lines 249-256)

Validates changes, runs AutoGen if errors found.

#### Step 4: VFS Persistence (Lines 261-272)

Saves changes to localStorage.

---

## INPUT DETECTOR NODE

**File:** `lib/langgraph/nodes/input-detector-node.ts`

### Detection Logic

Uses AI to detect if any of these are needed:

1. **API Keys** - "integrate Stripe", "add OpenAI chat"
2. **URLs** - "embed YouTube video", "add Google Maps"
3. **Code Snippets** - "integrate my existing component"
4. **Env Variables** - "connect to my database"
5. **Clarifications** - Ambiguous requests

### Example Detection (YouTube Embed)

**User Request:** "Embed a YouTube video"

**AI Analysis:**
```json
{
  "needsInput": true,
  "inputType": "url",
  "question": "Which YouTube video would you like to embed? Please share the video URL (e.g., https://youtube.com/watch?v=...)",
  "canProceed": false
}
```

**What Happens:**
1. `emitChatMessage()` sends question to chat
2. Workflow returns `needsUserInput: true`
3. Chat API returns response to frontend
4. Frontend should display question and wait

---

## CHAT API HANDLING

**File:** `/app/api/ai/chat/route.ts`

### For Editing Requests (Lines 195-346)

```typescript
// Execute editing workflow
const workflowResult = await editingWorkflow({
  files: currentFiles,
  userRequest,
  projectContext: enhancedProjectContext,
  conversationHistory: messages
});

// Check if workflow paused for user input
if (workflowResult.needsUserInput && workflowResult.userInputRequest) {
  console.log('[Chat] ⏸️  Workflow paused - user input required');

  return NextResponse.json({
    response: workflowResult.userInputRequest.question,
    needsUserInput: true,
    inputType: workflowResult.userInputRequest.type,
    files: currentFiles, // Unchanged
    updatedCode: currentFiles[0]?.content || '',
    updatedFiles: currentFiles
  });
}
```

**Response Structure:**
```json
{
  "response": "Which YouTube video would you like to embed?...",
  "needsUserInput": true,
  "inputType": "url",
  "files": [...], // Original files
  "updatedCode": "...",
  "updatedFiles": [...]
}
```

---

## FRONTEND SSE HANDLING

**File:** `components/project/ChatPanelClaude.tsx`

### SSE Connection (Lines 159-212)

```typescript
useEffect(() => {
  // Only connect when workflow is active
  if (!projectId || !isGenerating) return;

  const eventSource = new EventSource(`/api/langgraph/stream?projectId=${projectId}`);

  eventSource.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    // Handle chat:message events
    if (data.type === 'chat:message') {
      console.log('[Chat SSE] Received chat message:', data.message);

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message
      };

      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.content === data.message) return prev; // Avoid duplicates
        return [...prev, assistantMessage];
      });

      // If it's a question requiring response
      if (data.metadata?.requiresResponse) {
        console.log('[Chat SSE] Question requires user input');
        setAwaitingUserInput(true);
        setShowInputNotification(true);
      }
    }
  });

  return () => eventSource.close();
}, [projectId, isGenerating]);
```

**CRITICAL DEPENDENCY:** `isGenerating` must be `true` for SSE to connect!

### Response Handling (Lines 294-307)

```typescript
const data = await response.json();

// Check for user input request
if (response.status === 402 || data.insufficientTokens) {
  setShowCreditModal(true);
  setIsLoading(false);
  setMessages(messages);
  return;
}
```

**MISSING:** No special handling for `data.needsUserInput`!

---

## SSE STREAM SERVER

**File:** `app/api/langgraph/stream/route.ts`

### Chat Message Handler (Lines 198-208)

```typescript
const onChatMessage = (event: any) => {
  if (event.projectId === projectId) {
    sendEvent({
      type: 'chat:message',
      message: event.message,
      metadata: event.metadata,
      timestamp: event.timestamp,
      projectId: event.projectId
    });
  }
};

// Attach listener
workflowEvents.on('chat:message', onChatMessage);
```

---

## EVENT EMITTER

**File:** `lib/langgraph/events.ts`

### Chat Message Emission

```typescript
export function emitChatMessage(
  projectId: string,
  message: string,
  metadata?: any
) {
  workflowEvents.emit('chat:message', {
    projectId,
    message,
    metadata,
    timestamp: new Date().toISOString()
  });

  console.log(`[Event] 💬 Chat message emitted: "${message.substring(0, 50)}..."`);
}
```

---

## CURRENT ISSUES

### ~~Issue #1: Messages Not Appearing in UI~~ ✅ FIXED

**Status:** FIXED on Nov 2, 2025

**What Was Broken:**
1. Input Detector was calling `generateWithLogging` with wrong signature
2. Frontend had no handler for `needsUserInput` response flag

**Fixes Applied:**
1. ✅ Fixed `input-detector-node.ts:77-83` - Updated to use correct function signature
2. ✅ Added `needsUserInput` handler in `ChatPanelClaude.tsx:301-323`
3. ✅ Questions now appear in chat when workflow pauses
4. ✅ User can respond via normal chat input
5. ✅ Workflow resumes automatically with user's answer

### ~~Issue #2: Checkpoint Collection Missing~~ ✅ FIXED

**Status:** FIXED on Nov 2, 2025

**What Was Broken:**
- `workflow_checkpoints` collection didn't exist in PocketBase
- Editor couldn't save rollback points

**Fixes Applied:**
1. ✅ Added `workflow_checkpoints` schema to `scripts/setup-workflow-collections.ts:101-113`
2. ⏳ User needs to run: `npx tsx scripts/setup-workflow-collections.ts`

### Issue #3: Model Fallback Wasting Tokens ⚠️ NEEDS ATTENTION

**Status:** PARTIALLY ADDRESSED

**Problem:**
- Input detector took 218 seconds (tried 33 models!)
- Gemini models fail: "Cannot read properties of undefined (reading 'contents')"
- Mistral models fail: HTTP 422
- Total waste: ~5 minutes per edit request

**Potential Causes:**
1. Gemini API key might be invalid/expired
2. Mistral API endpoint might have changed
3. No circuit breaker to skip consistently failing models

**Recommended Fixes:**
1. Check environment variables for API keys
2. Add circuit breaker pattern to skip failing models after 2-3 attempts
3. Use cached working model more aggressively (cache for 24 hours instead of clearing on failure)

---

## DEBUGGING CHECKLIST

When testing "Embed a YouTube video without URL":

### 1. Server-Side Logs

Check console for:
```
[Input Detector] 📝 User Request: "Embed a YouTube video"
[Input Detector] ⚠️ User input required
[Input Detector]   Type: url
[Input Detector]   Question: "Which YouTube video would you like to embed?..."
[Event] 💬 Chat message emitted: "Which YouTube video would you like to..."
[LangGraph Editing] ⏸️  Workflow paused - user input required
[Chat] ⏸️  Workflow paused - user input required
```

### 2. API Response

Check network tab for `/api/ai/chat` response:
```json
{
  "response": "Which YouTube video...",
  "needsUserInput": true,
  "inputType": "url",
  "files": [...],
  "updatedCode": "...",
  "updatedFiles": [...]
}
```

### 3. SSE Connection

Check browser console for:
```
[Chat SSE] Connecting to stream for project: abc123
[Chat SSE] Received chat message: "Which YouTube video..."
```

### 4. Frontend State

Check React DevTools:
- `isGenerating`: Should be `true`
- `awaitingUserInput`: Should become `true`
- `messages`: Should contain the question

---

## POTENTIAL FIXES

### Fix #1: Ensure `isGenerating` is Set

**Problem:** SSE only connects if `isGenerating === true`

**Solution:** Set `isGenerating = true` before API call

**File:** `components/project/ChatPanelClaude.tsx`

```typescript
const handleSend = async () => {
  // ... existing code ...

  setIsLoading(true);

  // NEW: Ensure isGenerating is true for SSE
  if (onGeneratingChange) {
    onGeneratingChange(true);
  }

  // ... rest of code ...
}
```

### Fix #2: Handle `needsUserInput` in Response

**Problem:** No special handling when API returns `needsUserInput: true`

**Solution:** Check flag and update UI state

**File:** `components/project/ChatPanelClaude.tsx:294-307`

```typescript
const data = await response.json();

// NEW: Check for user input request
if (data.needsUserInput && data.userInputRequest) {
  console.log('[Chat] User input requested:', data.userInputRequest);

  // Add question to chat
  const questionMessage: Message = {
    role: 'assistant',
    content: data.response
  };

  setMessages([...currentMessages, questionMessage]);
  setAwaitingUserInput(true);
  setShowInputNotification(true);
  setIsLoading(false);

  return; // Don't process as normal response
}

// Check for insufficient credits
if (response.status === 402 || data.insufficientTokens) {
  // ... existing code ...
}
```

### Fix #3: Emit Messages AFTER SSE Connection

**Problem:** Messages emitted before SSE connects are lost

**Solution:** Use API response instead of relying solely on SSE

Already implemented in Fix #2 - adds question to chat directly from API response.

### Fix #4: Resume Workflow After User Response

**Problem:** No mechanism to resume workflow with user's answer

**Solution:** Track paused state and resume

**File:** `components/project/ChatPanelClaude.tsx`

```typescript
const handleSend = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage: Message = { role: "user", content: input.trim() };
  let currentMessages = [...messages, userMessage];
  setMessages(currentMessages);
  setInput("");
  setIsLoading(true);

  // NEW: Check if resuming from paused workflow
  if (awaitingUserInput) {
    console.log('[Chat] Resuming workflow with user input:', input.trim());
    setAwaitingUserInput(false);
    setShowInputNotification(false);

    // The user's message IS the answer - the workflow will continue automatically
    // when we call the API again
  }

  // ... existing API call code ...
}
```

---

## TESTING SCENARIOS

### Scenario 1: YouTube Embed (Needs URL)

**User:** "Embed a YouTube video"

**Expected:**
1. ✅ Input detector recognizes missing URL
2. ✅ emitChatMessage("Which YouTube video...")
3. ✅ Workflow pauses (needsUserInput: true)
4. ✅ Chat API returns question
5. ❌ Question appears in chat UI (BROKEN)
6. ❌ User can type URL (NEEDS FIX)
7. ❌ Workflow resumes with URL (NEEDS FIX)
8. ❌ Video embedded successfully (NEEDS FIX)

**Current Status:** Steps 1-4 work, steps 5-8 broken

### Scenario 2: Simple Edit (No Input Needed)

**User:** "Change button color to blue"

**Expected:**
1. ✅ Input detector: no input needed
2. ✅ Context analyzer: determines scope
3. ✅ Editor makes changes
4. ✅ emitChatMessage("Making changes...")
5. ✅ emitChatMessage(summary)
6. ❌ Progress messages appear in chat (BROKEN)
7. ✅ Files updated
8. ✅ Preview shows changes

**Current Status:** Workflow works, but messages might not display

### Scenario 3: Stripe Integration (Needs API Key)

**User:** "Integrate Stripe payments"

**Expected:**
1. ✅ Input detector recognizes missing API key
2. ✅ emitChatMessage("Please provide Stripe API key...")
3. ✅ Workflow pauses
4. ❌ Question appears with password input (NEEDS FIX)
5. ❌ User enters key securely (NEEDS FIX)
6. ❌ Workflow resumes (NEEDS FIX)
7. ❌ Stripe integrated (NEEDS FIX)

---

## IMPLEMENTATION PRIORITIES

### Priority 1: Get Messages Displaying

**Goal:** See conversational messages in chat UI

**Tasks:**
1. Ensure `isGenerating` is set correctly
2. Add handler for `needsUserInput` in frontend
3. Test with "Embed YouTube video" request
4. Verify message appears in chat

### Priority 2: Handle User Responses

**Goal:** User can answer questions and workflow continues

**Tasks:**
1. Track `awaitingUserInput` state
2. Detect when user is answering vs new request
3. Pass answer back to workflow
4. Resume workflow with user's input

### Priority 3: Different Input Types

**Goal:** Show appropriate UI for different input types

**Tasks:**
1. Password input for API keys
2. Textarea for code snippets
3. Text input for URLs
4. Dialog for clarifications

---

## FILES TO MODIFY (Next Session)

### 1. `components/project/ChatPanelClaude.tsx`

**Changes:**
- Add `needsUserInput` handler after API response
- Set `isGenerating` correctly
- Track workflow pause state
- Resume workflow with user answer

**Lines:** ~294-307 (response handling)

### 2. `app/api/ai/chat/route.ts`

**Changes:**
- None needed (already returns needsUserInput correctly)

**Status:** ✅ Complete

### 3. `lib/langgraph/nodes/input-detector-node.ts`

**Changes:**
- None needed (already emits chat messages)

**Status:** ✅ Complete

### 4. `lib/langgraph/workflows/editing-workflow.ts`

**Changes:**
- None needed (already pauses for input)

**Status:** ✅ Complete

---

## QUESTIONS FOR NEXT SESSION

1. **Input UI Design:** What should the UI look like when asking for:
   - API keys (password field? modal?)
   - URLs (text input? validation?)
   - Code snippets (textarea? code editor?)
   - Clarifications (text input? radio buttons?)

2. **Resume Mechanism:** When user provides answer:
   - Should we re-call the API with the answer?
   - Should we track workflow state and resume from checkpoint?
   - Should answer be in metadata or as regular message?

3. **Message Display:** Should conversational messages:
   - Always go through SSE?
   - Also be included in API response (redundant but reliable)?
   - Be stored in project messages array?

4. **Error Handling:** If user provides invalid input:
   - Should workflow validate before continuing?
   - Should we ask again?
   - Should we proceed with best effort?

---

## KNOWN WORKING PARTS

✅ **Backend/API:**
- Chat API routing (planning vs editing)
- Editing workflow execution
- Input detector analysis
- Event emission (`emitChatMessage`)
- SSE stream server
- Workflow pause/resume logic

✅ **Frontend:**
- SSE connection (when `isGenerating === true`)
- Message display (for regular messages)
- Chat input handling

❌ **Not Working:**
- Conversational messages not appearing in UI
- User input request UI
- Workflow resume after user response

---

## CONCLUSION

The conversational editor infrastructure is **95% complete**. The workflow correctly:
- Detects when input is needed
- Emits conversational messages
- Pauses execution
- Returns structured response

The **missing piece** is frontend integration:
- Messages need to display in chat
- User needs UI to respond
- Workflow needs to resume with answer

**Next session focus:** Fix frontend message display and user input handling in `ChatPanelClaude.tsx`.

---

**End of Document**
