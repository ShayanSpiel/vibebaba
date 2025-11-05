# Feature Prioritization - Implementation Checklist

**Quick reference guide for implementing the feature prioritization system**

Print this out or keep it open while implementing. Check off each item as you complete it.

---

## Pre-Implementation Checklist

- [ ] **Read the implementation guide** - `PM_FEATURE_PRIORITIZATION_COPY_PASTE_READY.md`
- [ ] **Review visual examples** - `PM_FEATURE_PRIORITIZATION_VISUAL_EXAMPLES.md`
- [ ] **Create a git branch** - `git checkout -b feature/pm-feature-prioritization`
- [ ] **Backup current code** - Just in case you need to rollback
- [ ] **Close all browser tabs** - Focus mode activated
- [ ] **Start the dev server** - You'll need it for testing

---

## Implementation Steps (in order)

### Step 1: Type Definitions (5 minutes)
**File:** `lib/langgraph/types.ts`

- [ ] Open `lib/langgraph/types.ts`
- [ ] Navigate to line 158 (after `editingSession?:`)
- [ ] Paste the `allRequestedFeatures` type definition
- [ ] Save file
- [ ] Run TypeScript check: `npx tsc --noEmit`
- [ ] ✅ **Verify:** No TypeScript errors

**Time Check:** Should take ~5 minutes

---

### Step 2: PM Node Enhancement (30 minutes)
**File:** `lib/langgraph/nodes/pm-node.ts`

#### 2A: Add Feature Extraction Logic
- [ ] Open `lib/langgraph/nodes/pm-node.ts`
- [ ] Navigate to line 99 (after app type logging)
- [ ] Paste the feature extraction block
- [ ] **Verify imports are present:**
  - [ ] `extractAndParseJson` from `'../utils/json-parser'`
  - [ ] `estimateTokens` from `'@/lib/langgraph/ai-with-logging'`
  - [ ] `generateWithLogging` from `'@/lib/langgraph/ai-with-logging'`
  - [ ] `emitProgress` from `'../events'`
- [ ] Save file

#### 2B: Update Planning Prompt
- [ ] Navigate to line 110-123 (the `planPrompt` variable)
- [ ] Delete the old `planPrompt` block
- [ ] Paste the new `planPrompt` block
- [ ] **Verify:**
  - [ ] Removed "IMPORTANT" section
  - [ ] Removed "Deliver in 1-3 files" line
  - [ ] Added `mvpFeaturesList` variable
  - [ ] Dynamic feature count in prompt
- [ ] Save file

#### 2C: Update Return Statement
- [ ] Navigate to line 180-196 (return block)
- [ ] Add `allRequestedFeatures: allFeatures` to return object
- [ ] Save file

#### 2D: Test PM Node
- [ ] Run dev server: `npm run dev`
- [ ] Create project with simple request (3 features)
- [ ] Check console for: "Simple request - skipping prioritization"
- [ ] Create project with complex request (7 features)
- [ ] Check console for: "Extracted 7 features, selected 3 for MVP"
- [ ] ✅ **Verify:** Feature extraction only runs for complex requests

**Time Check:** Should take ~30 minutes

---

### Step 3: DevOps Node Update (10 minutes)
**File:** `lib/langgraph/nodes/devops-node.ts`

#### 3A: Add Feature Completion Tracking
- [ ] Open `lib/langgraph/nodes/devops-node.ts`
- [ ] Navigate to line 197 (right before return statement)
- [ ] Paste the feature completion tracking block
- [ ] Save file

#### 3B: Update Return Statement
- [ ] Navigate to line 198-204 (return block)
- [ ] Add `allRequestedFeatures: state.allRequestedFeatures`
- [ ] Add `deploymentSummary: { ... }` object
- [ ] Save file
- [ ] ✅ **Verify:** Return statement includes both new fields

**Time Check:** Should take ~10 minutes

---

### Step 4: Project Page Messages (20 minutes)
**File:** `app/project/[id]/page.tsx`

#### 4A: Add Message Construction Function
- [ ] Open `app/project/[id]/page.tsx`
- [ ] Navigate to line 215 (before `const generatePrototype`)
- [ ] Paste the `constructCompletionMessages` function
- [ ] Save file

#### 4B: Update Success Message
- [ ] Navigate to line 352-356 (messages array in updateProject)
- [ ] Replace the single message with:
  ```typescript
  ...constructCompletionMessages(workflowData, workflowSummary)
  ```
- [ ] Save file
- [ ] ✅ **Verify:** Old message is completely replaced

**Time Check:** Should take ~20 minutes

---

### Step 5: Chat Panel Feature Buttons (30 minutes)
**File:** `components/project/ChatPanelClaude.tsx`

#### 5A: Update Message Interface
- [ ] Open `components/project/ChatPanelClaude.tsx`
- [ ] Navigate to line 13-21 (Message interface)
- [ ] Replace with updated interface (includes `bubbleType` and `actions`)
- [ ] Save file

#### 5B: Add Feature Add Handler
- [ ] Navigate to line 243 (before `const handleSend`)
- [ ] Paste the `handleFeatureAdd` function
- [ ] Save file

#### 5C: Render Feature Buttons
- [ ] Navigate to line 439 (after messages.map closing)
- [ ] Paste the feature button rendering block
- [ ] **Verify:**
  - [ ] Priority dots (amber/blue/gray)
  - [ ] Disabled state styling
  - [ ] +Add button with gradient
  - [ ] Dependency warning text
- [ ] Save file

#### 5D: Test Chat Panel
- [ ] Reload browser
- [ ] Complete a complex project
- [ ] Check for three separate messages
- [ ] Check for feature action buttons
- [ ] Hover over enabled button - should highlight
- [ ] Check disabled button - should show warning
- [ ] ✅ **Verify:** All UI elements render correctly

**Time Check:** Should take ~30 minutes

---

### Step 6: Workflow Routing (15 minutes)
**File:** `lib/langgraph/workflow.ts`

#### 6A: Add Feature Addition Detection
- [ ] Open `lib/langgraph/workflow.ts`
- [ ] Navigate to line 301 (in conditional edges function)
- [ ] Paste the feature addition detection block
- [ ] **Verify placement:**
  - [ ] BEFORE the editing session check
  - [ ] INSIDE the conditional edges function
- [ ] Save file

#### 6B: Test Workflow Routing
- [ ] Click "+Add" button on a feature
- [ ] Check console for: "Feature addition detected - routing to editing workflow"
- [ ] Check console for: "Feature: [name]"
- [ ] Verify editing workflow runs
- [ ] ✅ **Verify:** Feature gets added successfully

**Time Check:** Should take ~15 minutes

---

## Testing Checklist

### Test 1: Simple Request (1-3 Features)
**Expected:** No changes to current behavior

- [ ] Create project: "Build a landing page with hero, features, and contact form"
- [ ] **Check console:**
  - [ ] "Simple request - skipping prioritization" appears
  - [ ] No "Feature Extraction" AI call
- [ ] **Check chat UI:**
  - [ ] Single "Your app is ready!" message (old behavior)
  - [ ] No feature action buttons
- [ ] ✅ **PASS:** Simple requests work exactly as before

---

### Test 2: Complex Request (4-6 Features)
**Expected:** Feature prioritization kicks in

- [ ] Create project: "Build a blog with posts, comments, search, tags, admin panel, and analytics"
- [ ] **Check console:**
  - [ ] "Complex request detected - extracting all features"
  - [ ] "AI Call: Feature Extraction (~XXX tokens)"
  - [ ] "Extracted 6 features, selected 3 for MVP"
  - [ ] "MVP Features: [names]"
- [ ] **Check chat UI:**
  - [ ] ✅ Message 1: Green success bubble "🎉 Your app is ready!"
  - [ ] ✅ Message 2: Summary with 3 MVP features listed (numbered)
  - [ ] ✅ Message 3: "You also requested X more features"
  - [ ] ✅ Feature buttons appear with +Add buttons
  - [ ] ✅ Priority dots show (amber/blue/gray)
- [ ] **Check feature buttons:**
  - [ ] Enabled buttons are clickable
  - [ ] Hover shows border highlight
  - [ ] +Add button visible on enabled features
- [ ] ✅ **PASS:** Complex requests show prioritization UI

---

### Test 3: Feature Addition
**Expected:** Editing workflow adds feature

- [ ] Complete Test 2
- [ ] Click "+Add Comments" button
- [ ] **Check console:**
  - [ ] "Feature addition detected"
  - [ ] "Routing to editing workflow"
  - [ ] "Input Detector" node runs
  - [ ] "Context Analyzer" node runs
  - [ ] "Editor" node runs
  - [ ] "Feature [name] marked as completed"
- [ ] **Check chat UI:**
  - [ ] User message: "Add Comments"
  - [ ] Success message: "Here's what I changed"
  - [ ] Modified files listed
  - [ ] "Comments" button disappears
- [ ] **Check files:**
  - [ ] Comment-related code added to files
  - [ ] No broken code
  - [ ] TypeScript compiles
- [ ] ✅ **PASS:** Features can be added successfully

---

### Test 4: Dependency Blocking
**Expected:** Disabled button prevents addition

- [ ] Create project with dependencies (e.g., Analytics depends on Dashboard)
- [ ] **Check initial state:**
  - [ ] Analytics button is grayed out
  - [ ] "⚠️ Requires: Dashboard" text visible
  - [ ] Button is not clickable
- [ ] Add Dashboard first
- [ ] **Check updated state:**
  - [ ] Analytics button becomes enabled
  - [ ] Color changes from gray to normal
  - [ ] +Add button appears
- [ ] Click Analytics +Add button
- [ ] ✅ **PASS:** Dependencies are enforced correctly

---

### Test 5: Feature Extraction Fallback
**Expected:** Graceful fallback if AI fails

- [ ] Temporarily break feature extraction (e.g., invalid prompt)
- [ ] Create complex project
- [ ] **Check console:**
  - [ ] "Feature extraction failed - falling back"
  - [ ] "Generating comprehensive product plan (standard mode)"
- [ ] **Check chat UI:**
  - [ ] Single success message (old behavior)
  - [ ] No feature buttons
- [ ] ✅ **PASS:** System gracefully falls back on error

---

## Visual Verification Checklist

### Success Bubble (Green)
- [ ] Background: Light green tint (`bg-success/10`)
- [ ] Border: Green (`border-success/40`)
- [ ] Icon: White checkmark on green gradient background
- [ ] Text: "🎉 **Your app is ready!**"

### Summary Bubble (Informational)
- [ ] Background: Light gray (`bg-background-raised`)
- [ ] Border: Light border (`border-light`)
- [ ] Icon: Green checkmark (contextual)
- [ ] Text: "I built your app with these features:"
- [ ] Features: Numbered list (1., 2., 3.)
- [ ] Feature format: "**Name** - Description"

### Feature Action Bubble
- [ ] Background: Light gray
- [ ] Icon: Lightbulb (informational)
- [ ] Text: "You also requested X more features. Ready to add them?"

### Feature Buttons (Enabled)
- [ ] Background: `bg-background-raised`
- [ ] Border: `border-border-light`
- [ ] Hover: Border changes to `border-amber-400/50`
- [ ] Shadow: `shadow-sm` → `shadow-md` on hover
- [ ] Priority dot: Amber (high), Blue (medium), or Gray (low)
- [ ] +Add button: Gradient brand background
- [ ] Text: Clear and readable

### Feature Buttons (Disabled)
- [ ] Background: `bg-background-subtle`
- [ ] Text: `text-text-tertiary`
- [ ] Opacity: 60%
- [ ] Cursor: `cursor-not-allowed`
- [ ] Warning: "⚠️ Requires: [Feature Name]" in amber text
- [ ] No +Add button visible

---

## Performance Checklist

- [ ] **PM Node:**
  - [ ] Simple requests don't trigger extra AI call
  - [ ] Feature extraction completes in < 3 seconds
  - [ ] Total PM node time: < 5 seconds

- [ ] **Chat UI:**
  - [ ] Messages render instantly (no lag)
  - [ ] Feature buttons don't cause layout shift
  - [ ] Hover effects are smooth (no jank)

- [ ] **Memory:**
  - [ ] No memory leaks in chat panel
  - [ ] Feature data doesn't bloat state
  - [ ] Old messages properly cleaned up

---

## Final Verification

### Code Quality
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint warnings: `npm run lint`
- [ ] No console errors in browser
- [ ] All files properly formatted

### Git Commit
- [ ] All files staged: `git add .`
- [ ] Descriptive commit message:
  ```
  feat: Add intelligent feature prioritization system

  - PM node extracts ALL features from complex requests
  - Selects top 3 for MVP, queues remaining features
  - Brand-aligned multi-message UI (success, summary, actions)
  - Interactive +Add buttons for incremental feature addition
  - Dependency detection prevents adding features prematurely
  - Graceful fallback if feature extraction fails

  Co-authored-by: Claude <noreply@anthropic.com>
  ```
- [ ] Push branch: `git push -u origin feature/pm-feature-prioritization`

### Documentation
- [ ] Update CHANGELOG.md with new feature
- [ ] Screenshot of new UI for documentation
- [ ] Update README if needed

---

## Rollback Instructions

If something goes wrong:

1. **Undo last commit:**
   ```bash
   git reset --soft HEAD^
   ```

2. **Revert individual files:**
   ```bash
   git checkout main -- lib/langgraph/nodes/pm-node.ts
   git checkout main -- lib/langgraph/nodes/devops-node.ts
   # ... etc
   ```

3. **Full rollback:**
   ```bash
   git checkout main
   git branch -D feature/pm-feature-prioritization
   ```

---

## Time Estimate Summary

| Step | Estimated Time |
|------|----------------|
| 1. Type Definitions | 5 min |
| 2. PM Node Enhancement | 30 min |
| 3. DevOps Node Update | 10 min |
| 4. Project Page Messages | 20 min |
| 5. Chat Panel Feature Buttons | 30 min |
| 6. Workflow Routing | 15 min |
| **Total Implementation** | **1h 50min** |
| Testing (all 5 test cases) | 2-3 hours |
| **Grand Total** | **4-5 hours** |

**Actual time may vary** depending on:
- Your familiarity with the codebase
- Number of issues encountered
- Coffee breaks ☕

---

## Support & Troubleshooting

### Common Issues

**Issue:** TypeScript error "Property 'allRequestedFeatures' does not exist"
**Fix:** Make sure you added the type definition in Step 1

**Issue:** Feature buttons don't appear
**Fix:** Check that `constructCompletionMessages` is called correctly in Step 4

**Issue:** +Add button doesn't work
**Fix:** Verify `handleFeatureAdd` function was added in Step 5B

**Issue:** Feature extraction always skips
**Fix:** Check the detection logic: `requirements.split(/[,;]|\band\b/).length > 3`

**Issue:** Console shows "Feature not found"
**Fix:** Ensure features are passed through state in PM and DevOps nodes

---

## Success!

✅ **All steps completed**
✅ **All tests passing**
✅ **Visual verification done**
✅ **Code committed**

**Congratulations!** You've successfully implemented the feature prioritization system.

Now go build some apps and watch the magic happen! ✨
