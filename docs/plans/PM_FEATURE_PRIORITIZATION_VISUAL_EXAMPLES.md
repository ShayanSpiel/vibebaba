# Feature Prioritization - Visual Examples & UI Mockups

**Companion Document to:** `PM_FEATURE_PRIORITIZATION_COPY_PASTE_READY.md`

This document provides visual examples of:
- What users will see at each step
- How the UI should look
- Expected console output
- Error scenarios and edge cases

---

## Table of Contents

1. [User Journey - Simple Request](#user-journey---simple-request-1-3-features)
2. [User Journey - Complex Request](#user-journey---complex-request-4-features)
3. [Feature Addition Flow](#feature-addition-flow)
4. [Console Output Examples](#console-output-examples)
5. [UI Component Specifications](#ui-component-specifications)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## User Journey - Simple Request (1-3 Features)

### User Input:
```
"Build a landing page with hero section, features grid, and contact form"
```

### PM Node Processing:
```
[PM] 📝 Requirements: "Build a landing page with hero section, features grid, and contact form"
[PM] 🔍 Feature detection: 3 clauses found
[PM] ⏭️  Simple request (≤3 features) - skipping prioritization
[PM] 📝 Generating MVP plan...
```

### Chat UI (After Completion):

**OLD BEHAVIOR (What you have now):**
```
┌─────────────────────────────────────────────────────────────┐
│ 💬 Assistant                                                │
│                                                             │
│ ✅ Team Workflow Summary:                                  │
│                                                             │
│ ✅ **Managing Director** - Refined requirements            │
│ ✅ **Product Manager** - Created MVP plan                  │
│ ✅ **UX Designer** - Designed UI system                    │
│ ✅ **Frontend Engineer** - Built Next.js app               │
│ ✅ **QA Manager** - Validated code                         │
│ ✅ **DevOps Engineer** - Deployed successfully             │
│                                                             │
│ **Your app is ready!** Test it in the preview, explore     │
│ the code, and check out your database. You can ask me to   │
│ make any changes you'd like.                                │
└─────────────────────────────────────────────────────────────┘
```

**NEW BEHAVIOR (No change for simple requests):**
Same as above! Simple requests (1-3 features) continue to work exactly as before.

✅ **No breaking changes** - Existing functionality preserved

---

## User Journey - Complex Request (4+ Features)

### User Input:
```
"Build a task management app with user authentication, task creation,
task assignment, comments on tasks, file uploads, admin dashboard,
and analytics"
```

### PM Node Processing:

**Console Output:**
```
[PM] 📝 Requirements: "Build a task management app with user authentication..."
[PM] 🔍 Feature detection: 7 clauses found
[PM] 🎯 Complex request detected - extracting all features...
[PM] 🤖 AI Call: Feature Extraction (~350 tokens, gemini-2.0-flash)

[PM] 📊 Extracted 7 features, selected 3 for MVP
[PM] 📊 MVP Features: User Authentication, Task Creation & Management, Task Assignment

[PM] 📝 Generating MVP plan with 3 selected features...
[PM] 🤖 AI Call: Planning (~420 tokens, gemini-2.0-flash)

[PM] ✅ Completed in 2841ms
```

**Feature Extraction AI Response (JSON):**
```json
{
  "features": [
    {
      "id": "auth",
      "name": "User Authentication",
      "description": "User signup, login, password reset, session management",
      "priority": "high",
      "dependencies": [],
      "complexity": "moderate"
    },
    {
      "id": "tasks",
      "name": "Task Creation & Management",
      "description": "Create, edit, delete, view tasks with title, description, due date",
      "priority": "high",
      "dependencies": ["auth"],
      "complexity": "simple"
    },
    {
      "id": "assignment",
      "name": "Task Assignment",
      "description": "Assign tasks to team members, view assigned tasks",
      "priority": "high",
      "dependencies": ["auth", "tasks"],
      "complexity": "simple"
    },
    {
      "id": "comments",
      "name": "Task Comments",
      "description": "Add comments to tasks, view comment history",
      "priority": "medium",
      "dependencies": ["tasks"],
      "complexity": "simple"
    },
    {
      "id": "uploads",
      "name": "File Uploads",
      "description": "Attach files to tasks, download attachments",
      "priority": "medium",
      "dependencies": ["tasks"],
      "complexity": "moderate"
    },
    {
      "id": "admin",
      "name": "Admin Dashboard",
      "description": "Manage users, view all tasks, system settings",
      "priority": "medium",
      "dependencies": ["auth"],
      "complexity": "moderate"
    },
    {
      "id": "analytics",
      "name": "Analytics",
      "description": "Task completion rates, user activity, charts and graphs",
      "priority": "low",
      "dependencies": ["tasks"],
      "complexity": "complex"
    }
  ]
}
```

### Chat UI (After Completion):

**NEW BEHAVIOR (3 separate messages):**

#### Message 1: Success Bubble (Green)
```
┌─────────────────────────────────────────────────────────────┐
│                 ┌─────────────────────────────┐              │
│                 │  🎉 Your app is ready!      │              │
│                 └─────────────────────────────┘              │
│                                                               │
│ Background: Light green (#10b981/5)                          │
│ Border: Green (#10b981/40)                                   │
│ Icon: White checkmark on green gradient background           │
└───────────────────────────────────────────────────────────────┘
```

#### Message 2: Summary Bubble (Informational)
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ Assistant                                                 │
│                                                             │
│ I built your app with these features:                       │
│                                                             │
│ 1. **User Authentication** - User signup, login, password   │
│    reset, session management                                │
│                                                             │
│ 2. **Task Creation & Management** - Create, edit, delete,   │
│    view tasks with title, description, due date             │
│                                                             │
│ 3. **Task Assignment** - Assign tasks to team members,      │
│    view assigned tasks                                      │
│                                                             │
│ Test it in the preview, explore the code, and check out     │
│ your database. You can ask me to make any changes.          │
│                                                             │
│ Background: Light gray (bg-background-raised)               │
│ Border: Light border (border-light)                         │
│ Icon: Contextual checkmark icon (green gradient)            │
└─────────────────────────────────────────────────────────────┘
```

#### Message 3: Feature Action Bubble (Interactive)
```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Assistant                                                │
│                                                             │
│ You also requested 4 more features. Ready to add them?      │
└─────────────────────────────────────────────────────────────┘

      ┌──────────────────────────────────────────────────┐
      │ 🟡 +Add Task Comments                            │
      │ Task comments - Add comments to tasks, view      │
      │ comment history                                   │
      │                                          [ + ]    │
      └──────────────────────────────────────────────────┘

      ┌──────────────────────────────────────────────────┐
      │ 🔵 +Add File Uploads                             │
      │ File uploads - Attach files to tasks, download   │
      │ attachments                                       │
      │                                          [ + ]    │
      └──────────────────────────────────────────────────┘

      ┌──────────────────────────────────────────────────┐
      │ 🔵 +Add Admin Dashboard                          │
      │ Admin dashboard - Manage users, view all tasks,  │
      │ system settings                                   │
      │                                          [ + ]    │
      └──────────────────────────────────────────────────┘

      ┌──────────────────────────────────────────────────┐
      │ ⚪ +Add Analytics                     [DISABLED]  │
      │ Analytics - Task completion rates, user activity,│
      │ charts                                            │
      │ ⚠️ Requires: Dashboard                            │
      └──────────────────────────────────────────────────┘

Legend:
- 🟡 = High priority (amber-500)
- 🔵 = Medium priority (blue-500)
- ⚪ = Low priority (gray-400)
- [ + ] = Add button (gradient-brand, visible on hover)
- [DISABLED] = Grayed out, unmet dependencies
```

**CSS Classes for Feature Buttons:**

Enabled button:
```css
bg-background-raised
border border-border-light
text-text-primary
hover:border-amber-400/50
hover:shadow-md
transition-all
```

Disabled button:
```css
bg-background-subtle
border border-border-light
text-text-tertiary
cursor-not-allowed
opacity-60
```

Add button (+):
```css
w-7 h-7
rounded-lg
bg-gradient-brand
flex items-center justify-center
shadow-sm
```

---

## Feature Addition Flow

### Step 1: User Clicks "+Add Task Comments"

**Chat UI Update:**
```
┌─────────────────────────────────────────────────────────────┐
│ 💭 User                                                     │
│                                                             │
│ Add Task Comments                                           │
│                                                             │
│ Background: Gradient brand (amber-400 to yellow-600)        │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Editing Workflow Triggered

**Console Output:**
```
[Workflow] 🎯 Feature addition detected - routing to editing workflow
[Workflow]   Feature: "Task Comments"
[Workflow]   Scope: moderate

[Input Detector] 📝 User Request: "Add this feature: Task Comments
Add comments to tasks, view comment history"
[Input Detector] ✅ All information available - no user input needed

[Context Analyzer] 🔍 Analyzing change scope...
[Context Analyzer] 📊 Change Scope: moderate
[Context Analyzer] 📂 Files to modify: app/tasks/[id]/page.tsx, api/routes/comments.js
[Context Analyzer] 🛡️  Preserving: authentication logic, task creation

[Editor] ✏️  Applying changes...
[Editor] ✅ Modified: app/tasks/[id]/page.tsx
[Editor] ✅ Modified: api/routes/comments.js
[Editor] ✅ Created: components/CommentSection.tsx

[QA] 🔍 Validating changes...
[QA] ✅ TypeScript validation passed
[QA] ✅ No errors found

[DevOps] 🚀 Deploying changes...
[DevOps] ✅ Feature "Task Comments" marked as completed
```

### Step 3: Success Message

**Chat UI Update:**
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ Assistant                                                 │
│                                                             │
│ ✅ **Here's what I changed:**                               │
│                                                             │
│ I've added the Task Comments feature to your app:           │
│                                                             │
│ **Modified Files:**                                         │
│ - `app/tasks/[id]/page.tsx` - Added comment section UI     │
│ - `api/routes/comments.js` - Created comment API endpoints │
│                                                             │
│ **New Files:**                                              │
│ - `components/CommentSection.tsx` - Comment component       │
│                                                             │
│ Users can now add comments to any task and view the full    │
│ comment history. Try it out in the preview!                 │
│                                                             │
│ Background: Green tint (success/10)                         │
│ Icon: Green checkmark (gradient-success)                    │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Feature List Update

**The "Task Comments" button disappears, remaining features shown:**
```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Assistant                                                │
│                                                             │
│ You have 3 more features to add. Ready to continue?         │
└─────────────────────────────────────────────────────────────┘

      ┌──────────────────────────────────────────────────┐
      │ 🔵 +Add File Uploads                             │
      │ ...                                               │
      └──────────────────────────────────────────────────┘

      ┌──────────────────────────────────────────────────┐
      │ 🔵 +Add Admin Dashboard                          │
      │ ...                                               │
      └──────────────────────────────────────────────────┘

      ┌──────────────────────────────────────────────────┐
      │ ⚪ +Add Analytics                                 │
      │ ...                                               │
      └──────────────────────────────────────────────────┘

✓ Task Comments - COMPLETED
```

---

## Console Output Examples

### Successful Feature Prioritization

```bash
[PM] 🚀 Starting PM node (Product Manager)
[PM] 📝 Requirements: "Build a blog with posts, comments, search, tags, admin panel, and analytics"
[PM] 📝 Analyzing app type and complexity...
[PM] 🤖 AI Call: Analysis (~280 tokens, gemini-2.0-flash)
[PM] 📊 App Type: blog, Complexity: moderate, Design: modern
[PM] Framework: Next.js (AI autonomy for file structure)

[PM] 🎯 Complex request detected - extracting all features...
[PM] 🤖 AI Call: Feature Extraction (~350 tokens, gemini-2.0-flash)
[PM] 📊 Extracted 6 features, selected 3 for MVP
[PM] 📊 MVP Features: Posts, Search, Admin Panel

[PM] 📝 Generating comprehensive product plan...
[PM] 🤖 AI Call: Planning (~420 tokens, gemini-2.0-flash)
[PM] ✅ Memory context injected
[PM] ✅ Completed in 2841ms

[PM] 🔍 Analyzing backend requirements...
[PM] 🔧 Backend keywords detected - API required
[PM]   Matched keywords: posts, admin panel, search
[PM] ✅ Backend required
```

### Feature Extraction Failed (Fallback)

```bash
[PM] 🎯 Complex request detected - extracting all features...
[PM] 🤖 AI Call: Feature Extraction (~350 tokens, gemini-2.0-flash)
[JSON Parser] ⚠️  Control characters detected, sanitizing...
[JSON Parser] ❌ Failed to parse JSON after all sanitization attempts
[JSON Parser] Original error: Unexpected token in JSON at position 45
[JSON Parser] JSON snippet: {"features": [{"id": "auth", "name": "User Auth...
[JSON Parser] Tip: Ensure AI returns valid JSON with properly escaped strings

[PM] ⚠️  Feature extraction failed - falling back to standard MVP generation
[PM] 📝 Generating comprehensive product plan (standard mode)...
```

### Feature Addition with Unmet Dependencies

```bash
[Workflow] 🎯 Feature addition detected - routing to editing workflow
[Workflow]   Feature: "Analytics"
[Workflow] ❌ Cannot add "Analytics" - requires: Dashboard

Error: Cannot add "Analytics" - requires: Dashboard
```

---

## UI Component Specifications

### Feature Action Button (Enabled)

**HTML Structure:**
```html
<button class="feature-add-button enabled">
  <div class="feature-content">
    <!-- Priority Indicator -->
    <div class="priority-dot high"></div>

    <!-- Text Content -->
    <div class="feature-text">
      <div class="feature-label">+Add Task Comments</div>
      <div class="feature-description">Add comments to tasks, view comment history</div>
    </div>
  </div>

  <!-- Add Icon -->
  <div class="add-icon">
    <svg>...</svg>
  </div>
</button>
```

**CSS (Tailwind):**
```jsx
className={`
  flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left
  transition-all shadow-sm hover:shadow-md
  bg-background-raised border border-border-light text-text-primary
  hover:border-amber-400/50
`}
```

**Priority Dot Colors:**
```jsx
// High priority - Amber/Golden (matches brand)
className="w-2 h-2 rounded-full bg-amber-500"

// Medium priority - Blue (informational)
className="w-2 h-2 rounded-full bg-blue-500"

// Low priority - Gray (neutral)
className="w-2 h-2 rounded-full bg-gray-400"
```

**Add Button (+):**
```jsx
className={`
  w-7 h-7 rounded-lg bg-gradient-brand
  flex items-center justify-center flex-shrink-0 shadow-sm
`}
```

### Feature Action Button (Disabled)

**CSS (Tailwind):**
```jsx
className={`
  flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left
  transition-all shadow-sm
  bg-background-subtle border border-border-light text-text-tertiary
  cursor-not-allowed opacity-60
`}
```

**Dependency Warning:**
```jsx
{action.disabledReason && (
  <div className="text-xs text-warning mt-1">
    ⚠️ {action.disabledReason}
  </div>
)}
```

### Chat Bubble Types

**Success Bubble (Green):**
```jsx
{
  role: "assistant",
  content: "🎉 **Your app is ready!**",
  bubbleType: "success"
}

// Rendered with:
className="bg-success/10 border border-success/40"
// Icon: Green checkmark on gradient-success background
```

**Informational Bubble (Default Assistant):**
```jsx
{
  role: "assistant",
  content: "I built your app with these features...",
  bubbleType: "assistant"
}

// Rendered with:
className="bg-background-raised border border-light"
// Icon: Contextual (checkmark for "ready", lightbulb for "planning", etc.)
```

**Warning Bubble (Amber/Yellow):**
```jsx
{
  role: "assistant",
  content: "⚠️ Cannot add feature - missing dependency",
  bubbleType: "warning"
}

// Rendered with:
className="bg-warning/10 border border-warning/40"
// Icon: Warning triangle on gradient-warning background
```

---

## Edge Cases & Error Handling

### Edge Case 1: No Features Detected

**User Input:**
```
"Make it look nice"
```

**PM Node Behavior:**
```
[PM] 🔍 Feature detection: 0 clauses found
[PM] ⏭️  Simple request (≤3 features) - skipping prioritization
[PM] 📝 Generating MVP plan (standard mode)...
```

**Chat UI:**
Standard single success message (old behavior)

---

### Edge Case 2: All Features Have Same Priority

**Feature Extraction Response:**
```json
{
  "features": [
    {"id": "a", "priority": "high", "dependencies": []},
    {"id": "b", "priority": "high", "dependencies": []},
    {"id": "c", "priority": "high", "dependencies": []},
    {"id": "d", "priority": "high", "dependencies": []}
  ]
}
```

**PM Node Behavior:**
```
[PM] 📊 All features have same priority - selecting first 3 in order
[PM] 📊 MVP Features: a, b, c
```

---

### Edge Case 3: Circular Dependencies

**Feature Extraction Response:**
```json
{
  "features": [
    {"id": "a", "dependencies": ["b"]},
    {"id": "b", "dependencies": ["a"]}
  ]
}
```

**PM Node Behavior:**
```
[PM] ⚠️  Circular dependency detected: a ↔ b
[PM] ⚠️  Breaking cycle - removing dependency from lower priority feature
[PM] 📊 MVP Features: a (dependency removed)
```

---

### Edge Case 4: Feature Extraction Timeout

**Console Output:**
```
[PM] 🤖 AI Call: Feature Extraction (~350 tokens, gemini-2.0-flash)
[PM] ⏰ Timeout after 30s - falling back to standard mode
[PM] 📝 Generating comprehensive product plan (standard mode)...
```

**Chat UI:**
Standard single success message (fallback behavior)

---

### Edge Case 5: User Cancels Feature Addition Mid-Flow

**Workflow Behavior:**
```
[Editor] ✏️  Applying changes to app/tasks/[id]/page.tsx...
[User] ❌ Cancel requested
[Editor] 🔄 Rolling back changes...
[Editor] ✅ Rollback complete - files restored to original state
```

**Chat UI:**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Assistant                                               │
│                                                             │
│ Feature addition cancelled. Your app has been restored to   │
│ its previous state.                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Brand Color Reference

Based on `components/chat/ChatBubble.tsx` and brand guidelines:

**Success (Green):**
- Background: `bg-success/10` or `bg-success/5`
- Border: `border-success` or `border-success/40`
- Icon BG: `bg-gradient-success` (green gradient)
- Use for: "App ready", "Feature added", "Deployment complete"

**Info (Amber/Yellow - GOLDEN):**
- Background: `bg-amber-400/10` or `bg-amber-50/80 dark:bg-amber-950/30`
- Border: `border-amber-400/30` or `border-amber-500/30`
- Icon BG: `bg-gradient-to-br from-amber-400 to-yellow-600`
- Use for: Summaries, explanations, helpful information

**Warning (Amber/Yellow):**
- Background: `bg-warning/10`
- Border: `border-warning/40`
- Icon BG: `bg-gradient-warning`
- Use for: Missing dependencies, cautions, "Please review..."

**Error (Red):**
- Background: `bg-red-50/80 dark:bg-red-950/30`
- Border: `border-red-500/30`
- Icon BG: `bg-gradient-to-br from-red-500 to-red-600`
- Use for: Build failures, validation errors, "Something went wrong"

**Brand (Amber/Yellow gradient):**
- Background: `bg-gradient-brand` (from-amber-400 to-yellow-600)
- Use for: User messages, action buttons, +Add buttons, primary CTAs

---

## Complete Example: E-commerce App

### User Request:
```
"Build an e-commerce site with product catalog, shopping cart, checkout,
user accounts, reviews, admin panel, and inventory management"
```

### Feature Extraction:
```json
{
  "features": [
    {
      "id": "products",
      "name": "Product Catalog",
      "description": "Browse products, view details, search and filter",
      "priority": "high",
      "dependencies": [],
      "complexity": "simple"
    },
    {
      "id": "accounts",
      "name": "User Accounts",
      "description": "Sign up, login, profile management",
      "priority": "high",
      "dependencies": [],
      "complexity": "moderate"
    },
    {
      "id": "cart",
      "name": "Shopping Cart",
      "description": "Add to cart, update quantities, view total",
      "priority": "high",
      "dependencies": ["products"],
      "complexity": "simple"
    },
    {
      "id": "checkout",
      "name": "Checkout",
      "description": "Payment processing, order confirmation",
      "priority": "high",
      "dependencies": ["cart", "accounts"],
      "complexity": "complex"
    },
    {
      "id": "reviews",
      "name": "Product Reviews",
      "description": "Rate and review products",
      "priority": "medium",
      "dependencies": ["products", "accounts"],
      "complexity": "simple"
    },
    {
      "id": "admin",
      "name": "Admin Panel",
      "description": "Manage products, orders, users",
      "priority": "medium",
      "dependencies": ["accounts"],
      "complexity": "moderate"
    },
    {
      "id": "inventory",
      "name": "Inventory Management",
      "description": "Track stock levels, reorder alerts",
      "priority": "low",
      "dependencies": ["admin", "products"],
      "complexity": "complex"
    }
  ]
}
```

### MVP Selection (Top 3):
1. **Product Catalog** (high, no deps)
2. **User Accounts** (high, no deps)
3. **Shopping Cart** (high, depends on products ✓)

### Remaining Features (4):
- **Checkout** - DISABLED (requires cart ✓ + accounts ✓, but checkout is complex)
  - Wait... both deps are in MVP, so this should be ENABLED
  - Let me recalculate:

**CORRECTED MVP Selection:**
1. **Product Catalog** (high, no deps)
2. **User Accounts** (high, no deps)
3. **Shopping Cart** (high, depends on products ✓)

**Remaining Features:**
- **Checkout** - ENABLED (cart ✓ + accounts ✓ both in MVP)
- **Product Reviews** - ENABLED (products ✓ + accounts ✓ both in MVP)
- **Admin Panel** - ENABLED (accounts ✓ in MVP)
- **Inventory Management** - DISABLED (requires admin ❌ + products ✓)

### Chat UI:
```
Message 1: 🎉 Your app is ready!

Message 2:
I built your app with these features:
1. Product Catalog - Browse products, view details, search and filter
2. User Accounts - Sign up, login, profile management
3. Shopping Cart - Add to cart, update quantities, view total

Message 3:
You also requested 4 more features. Ready to add them?

┌──────────────────────────────────────────────────┐
│ 🟡 +Add Checkout                                 │
│ Payment processing, order confirmation            │
│                                          [ + ]    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ 🔵 +Add Product Reviews                          │
│ Rate and review products                          │
│                                          [ + ]    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ 🔵 +Add Admin Panel                              │
│ Manage products, orders, users                    │
│                                          [ + ]    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ ⚪ +Add Inventory Management          [DISABLED]  │
│ Track stock levels, reorder alerts                │
│ ⚠️ Requires: Admin Panel                          │
└──────────────────────────────────────────────────┘
```

---

## FINAL CHECKLIST

When implementing, verify these visual elements appear correctly:

✅ **Simple Requests (1-3 features):**
- [ ] Single "Your app is ready!" message (old behavior)
- [ ] No feature buttons
- [ ] No changes to existing UX

✅ **Complex Requests (4+ features):**
- [ ] Three separate messages (success, summary, actions)
- [ ] Success message has green background + checkmark
- [ ] Summary message lists MVP features with numbers
- [ ] Feature buttons appear with correct priority colors
- [ ] Disabled buttons show warning icon + dependency text
- [ ] +Add button appears on enabled features

✅ **Feature Addition:**
- [ ] User message shows "Add [Feature Name]"
- [ ] Success message shows "Here's what I changed"
- [ ] Completed feature button disappears from list
- [ ] Remaining feature count updates

✅ **Dependencies:**
- [ ] Disabled button has grayed out appearance
- [ ] "⚠️ Requires: [Feature Name]" text visible
- [ ] Button becomes enabled after dependency added

---

**This completes the visual examples guide!**

Use this document alongside `PM_FEATURE_PRIORITIZATION_COPY_PASTE_READY.md` to verify your implementation matches the expected UX.
