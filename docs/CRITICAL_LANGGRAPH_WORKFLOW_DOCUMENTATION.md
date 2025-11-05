# LangGraph Workflow - Complete Flow Reference

**Last Updated:** 2025-11-01 (Session: API Integration & Real-Time Sync Fix)
**Status:** ✅ Full-Stack with Real-Time Database Sync + API Function Name Enforcement

---

## 🎯 Workflow Sequence

```
START → Founder → PM → UX → Backend → Frontend → QA → DevOps → END
```

| # | Node | Input | Output | Triggers |
|---|------|-------|--------|----------|
| 1 | **Founder** | User description | Refined requirements, business context | → PM |
| 2 | **PM** | Requirements | Product plan, backend detection flag | → UX |
| 3 | **UX** | Plan | Design system, styling config | → Backend |
| 4 | **Backend** | Plan + needsBackend flag | Schema (collections, pages, API) OR null | → Frontend |
| 5 | **Frontend** | Backend schema + design | Next.js files + API client | → QA |
| 6 | **QA** | Files | Validation result | → AutoGen (if errors) OR DevOps |
| 7 | **DevOps** | Files + schema | Deploy URL, project saved | → END |

---

## 📋 Node Details

### 1. FOUNDER NODE
**File:** `lib/langgraph/nodes/founder-node.ts`

**Prompt:**
```
You are a Founder CEO analyzing a product idea.

User Request: {userDescription}
Previous Context: {memoryContext} [if exists]
Background Research: {backgroundContext} [if exists]

Task: Refine requirements and identify:
- Target audience
- Core business goals
- Key features needed

Output JSON:
{
  "refinedRequirements": "clear description",
  "businessContext": {
    "targetAudience": "...",
    "businessGoals": ["..."],
    "keyFeatures": ["..."]
  }
}
```

**Key Behavior:**
- Incorporates MCP memory (user preferences, past projects)
- Uses unified search results for context
- Refines vague requests into actionable requirements

---

### 2. PM NODE
**File:** `lib/langgraph/nodes/pm-node.ts`

**Prompt:**
```
You are a Product Manager creating an execution plan.

Refined Requirements: {refinedRequirements}
Business Context: {businessContext}

CRITICAL: Detect if backend is needed by checking for keywords:
- Data persistence: save, store, database, persist
- User management: login, signup, auth, users
- Forms: submit, contact form, waitlist, newsletter
- E-commerce: cart, checkout, payment, orders
- Content: blog, posts, articles, CMS
- Files: upload, file management
- Real-time: chat, notifications, live updates
- API: endpoints, REST, API

Task: Create product plan with:
1. Feature breakdown
2. Component structure
3. Technical requirements
4. Backend needs assessment

Output JSON:
{
  "plan": "detailed execution plan",
  "componentNeeds": {...},
  "context": {
    "pmPlan": {
      "needsBackend": true/false,
      "backendReason": "why backend is needed"
    }
  }
}
```

**Key Behavior:**
- Sets `needsBackend` flag (critical for Backend node)
- Analyzes 50+ backend keywords across 8 categories
- Keywords OVERRIDE static analysis

---

### 3. UX NODE
**File:** `lib/langgraph/nodes/ux-node.ts`

**Prompt:**
```
You are a Senior UX/UI Designer.

Product Plan: {plan}
Component Needs: {componentNeeds}

Task: Design UI/UX system:
1. Select component library (shadcn/ui, MUI, Radix, Headless UI)
2. Configure Tailwind design tokens
3. Define component hierarchy
4. Create styling guidelines

Output JSON:
{
  "designSystem": "shadcn/ui", // or other
  "stylingConfig": {
    "colors": {...},
    "typography": {...},
    "spacing": {...}
  },
  "designSystemPrompt": "instructions for frontend developer"
}
```

**Key Behavior:**
- Defaults to shadcn/ui for modern apps
- Creates Tailwind config with design tokens
- Provides detailed styling instructions for Frontend node

---

### 4. BACKEND NODE
**File:** `lib/langgraph/nodes/backend-node.ts`

**Prompt:**
```
You are a Backend Architect.

Product Plan: {plan}
Backend Needed: {context.pmPlan.needsBackend}

IF needsBackend = false:
  Skip and return null

IF needsBackend = true:
  Design database schema and API:

1. Collections (database tables):
   - name: string
   - fields: Array<{
       name: string,
       type: "text"|"email"|"number"|"bool"|"date"|"url"|"select"|"file"|"relation",
       required: boolean,
       unique: boolean,
       options?: string[] // for select type
     }>

2. Pages (multi-page routing):
   - name: string
   - route: string
   - description: string

3. API Endpoints (RESTful routes):
   - method: "GET"|"POST"|"PUT"|"DELETE"
   - path: string (e.g., "/api/users")
   - handler: string
   - description: string

Output JSON:
{
  "backendConfig": {
    "collections": [...],
    "pages": [...],
    "apiEndpoints": [...]
  }
}
OR null (if no backend needed)
```

**Key Behavior:**
- ONLY runs if `needsBackend = true`
- Generates PocketBase-compatible schema
- Defines RESTful API routes
- **CRITICAL:** Must run BEFORE Frontend (provides backendConfig)

---

### 5. FRONTEND NODE
**File:** `lib/langgraph/nodes/frontend-node.ts`

**Prompt (Per-File):**
```
Generate {filePath} - {purpose}

USER REQUEST: "{userDescription}"
Requirements: {pmPlan}
Tech: Next.js 14 + TypeScript + Tailwind

VIBE & STYLE: {vibe} design with {animations.intensity} animations
COLOR THEME: Primary {colors.primary} ({mode} mode) - use semantic tokens

RULES:
- Build UI with native HTML + Tailwind
- Icons from lucide-react ONLY
- Colors: bg-primary, text-primary-foreground, etc.

IF backend exists:
  🔗 API: Import from '@/lib/api'
  Available functions: {backendConfig.apiEndpoints.map(ep => ep.handler).join(', ')}

  Use EXACTLY these names. Example:
  import { submitLead } from '@/lib/api'
  await submitLead(formData)

ELSE:
  NO BACKEND: Use useState for data, no API calls.

Return raw code only.
```

**Key Behavior:**
- **CRITICAL:** Lists EXACT API function names from backendConfig
- Constraint: "ONLY use these functions" + "DO NOT invent new names"
- **Color Theme Context:** Provides actual hex color (e.g., #FF6B35) so AI understands visual theme
- Template for globals.css (prevents corruption)
- API client auto-generated if backend exists
- **Forms MUST call API client** (strongly enforced)
- AI decides file structure autonomously
- Ultra-short prompts (3-6 lines for API section)

---

### 6. QA NODE
**File:** `lib/langgraph/nodes/qa-node.ts`

**Validation Checks:**
```
1. Structure: Required Next.js files present
2. TypeScript: No type errors, no "any" types, no placeholders
3. Imports: All imports valid
4. Backend Integration (NEW):
   - Check src/lib/api.ts exists
   - Check forms import API client
   - Check forms CALL API functions (not just import)
   - Error if form exists but doesn't call API

IF errors found AND debugAttempts < 3:
  Trigger AutoGen Debugger
```

**Key Behavior:**
- Validates TypeScript and structure
- **NEW: Validates API integration** (forms must call API)
- Triggers AutoGen debugger if errors (max 3 attempts)
- Catches forms that don't submit data

---

### 7. DEVOPS NODE
**File:** `lib/langgraph/nodes/devops-node.ts`

**Responsibilities:**
```
1. File Separation:
   - userFiles = files without api/*
   - deploymentFiles = all files including api/*

2. PocketBase Storage:
   - Try to update existing project
   - If not found, create new
   - Store ONLY userFiles (shown in Code tab)

3. Return for Deployment:
   - deploymentFiles (includes api/* for deployment-server)
   - actualProjectId (PocketBase-generated)
   - deployUrl

Deployment-server handles:
- Frontend build (Next.js static export)
- API server generation and startup (if collections exist)
- PocketBase collection creation
```

**Key Behavior:**
- Filters api/* from user view (Code tab)
- Returns ALL files for deployment
- PocketBase creates actual collections

---

## 🔄 Sub-Workflows

### AutoGen Debugger
**Triggered:** QA node when errors > 0
**Max Attempts:** 3

**Sequence:**
```
Analyst → Fixer → FileOps → Reviewer
    ↓                            ↑
    └────────────────────────────┘
         (loops if errors remain)
```

1. **Analyst:** Analyzes errors, creates fix plan
2. **Fixer:** Generates code fixes
3. **FileOps:** Applies fixes to files
4. **Reviewer:** Validates, loops if needed

Returns to QA node with fixed files.

---

## 📊 State Flow

```typescript
interface AppGenState {
  // Identity
  userId: string
  projectId: string  // PocketBase-generated

  // Requirements
  userDescription: string
  refinedRequirements?: string
  businessContext?: any

  // Planning
  plan?: string
  context?: {
    pmPlan?: {
      needsBackend: boolean  // ⚠️ CRITICAL FLAG
    }
  }
  componentNeeds?: any

  // Design
  designSystem?: string
  stylingConfig?: any
  designSystemPrompt?: string

  // Backend (if needsBackend = true)
  backendConfig?: {
    collections: Collection[]
    pages?: Page[]
    apiEndpoints?: APIEndpoint[]
  }

  // Frontend
  files?: File[]
  isMultiPage?: boolean

  // Validation
  validationResult?: any
  debugAttempts?: number

  // Deployment
  deployUrl?: string
  stage: 'initial' | 'planning' | 'building' | 'complete'

  // Flow
  completedNodes: string[]
  errors: any[]

  // Context
  memoryContext?: any
  backgroundContext?: any
}
```

---

## 🗄️ Database Integration

### Project ID Generation
```
CRITICAL: All IDs use customAlphabet (no hyphens!)

// ❌ OLD (broken): nanoid(15) → "pOxt-BbMvAq0Kco"
// ✅ NEW (fixed): customAlphabet('0-9A-Za-z', 15) → "a1B2c3D4e5F6g7H"

Files using customAlphabet:
- components/chat/AIChat.tsx
- app/api/ai/plan/route.ts
- app/api/ai/prototype/route.ts
- app/api/langgraph/execute/route.ts

Reason: PocketBase collection names can't contain hyphens
Pattern: {projectId}_{collectionName}
```

### Collection Creation Flow
```
Backend Node → backendConfig.collections
     ↓
DevOps Node → Save to PocketBase
     ↓
Deployment Server → Create collections
     ↓
Collection Name: projectId_collectionName
Example: a1B2c3D4e5F6g7H_waitlist (no hyphens!)
```

### Generated API Structure
```typescript
// Auto-generated in src/lib/api.ts (if backend exists)

export class APIClient {
  // For each collection, generates:
  async getCollection() { /* GET /api/collection */ }
  async createCollection(data) { /* POST /api/collection */ }
  async updateCollection(id, data) { /* PUT /api/collection/:id */ }
  async deleteCollection(id) { /* DELETE /api/collection/:id */ }
}
```

### Real-Time Sync
```typescript
// DatabaseViewerPro.tsx
pb.collection(`${projectId}_${collectionName}`)
  .subscribe('*', handleUpdate)
  .catch(err => console.error('Subscription failed:', err));

// CRUD Operations
pb.collection(fullName).create(data);
pb.collection(fullName).update(id, data);
pb.collection(fullName).delete(id);
pb.collection(fullName).getFullList();

// Status: ✅ Working (2025-11-01)
// Note: Requires valid auth (pb.authStore.isValid)
```

---

## 🚀 Deployment Flow

```
1. Stub Creation (execute/route.ts)
   → Create project in PocketBase
   → Get projectId

2. Workflow Execution
   → Founder → PM → UX → Backend → Frontend → QA → DevOps

3. File Separation (devops-node.ts)
   → userFiles (no api/*)
   → deploymentFiles (all files)

4. PocketBase Storage
   → Store userFiles only

5. Deployment Server
   → Receive deploymentFiles
   → Build Next.js
   → Create PocketBase collections (projectId_name)
   → Start API server (if collections exist)
   → Return URLs

6. User View
   → Preview tab: Generated app
   → Code tab: userFiles only
   → Database tab: Live PocketBase collections
```

---

## 📖 Example Flow

### Backend App (Waitlist)
```
Input: "Create a waitlist landing page with email signup"

1. Founder → Refines: Landing page with email collection
2. PM → Detects: "waitlist" keyword → needsBackend = true
3. UX → Designs: Modern landing page with shadcn/ui
4. Backend → Creates:
   - Collection: waitlist { email, name }
   - API: POST /api/waitlist
5. Frontend → Generates:
   - Landing page with form
   - API client with createWaitlist()
   - Form submission integration
6. QA → Validates: All checks pass
7. DevOps → Deploys:
   - Frontend: http://localhost:4000/apps/[id]
   - API: http://localhost:5XXX
   - Database: [id]_waitlist collection

Result:
- Working waitlist form
- Data saved to PocketBase
- Real-time sync in Database tab
```

### Frontend-Only App (Portfolio)
```
Input: "Create a portfolio website"

1. Founder → Refines: Portfolio with about, projects, contact
2. PM → Detects: No keywords → needsBackend = false
3. UX → Designs: Clean portfolio with shadcn/ui
4. Backend → Skipped (needsBackend = false)
5. Frontend → Generates: Static Next.js site
6. QA → Validates: All checks pass
7. DevOps → Deploys: Frontend only

Result:
- Static portfolio site
- No API server
- No Database tab
```

---

## 🎓 Key Concepts

### Backend Detection
PM node analyzes user request for 50+ keywords:
- **Data:** save, store, database, persist
- **Auth:** login, signup, register, users
- **Forms:** submit, contact, waitlist, newsletter
- **E-commerce:** cart, checkout, payment
- **Content:** blog, posts, CMS
- **Files:** upload, attach
- **Real-time:** chat, notifications
- **API:** endpoints, REST

### Critical Ordering
**Backend MUST run BEFORE Frontend**
- Frontend needs backendConfig to generate API client
- Cannot generate API integration without schema

### File Separation
- **userFiles:** Frontend only (Code tab)
- **deploymentFiles:** Frontend + api/* (deployment)
- Reason: Internal infrastructure should not be visible to users

### Project ID
- MUST be PocketBase-generated (stub creation)
- Used consistently: workflow → deployment → collections
- Pattern: `projectId_collectionName`

---

## 📂 File Locations

```
lib/langgraph/
├── workflow.ts              # Main workflow
├── types.ts                 # State types
├── events.ts                # SSE events
└── nodes/
    ├── founder-node.ts      # 1. Business analysis
    ├── pm-node.ts           # 2. Product planning + backend detection
    ├── ux-node.ts           # 3. Design system
    ├── backend-node.ts      # 4. Schema generation
    ├── frontend-nextjs-node.ts  # 5. Next.js generation
    ├── qa-node.ts           # 6. Validation
    └── devops-node.ts       # 7. Deployment prep

app/api/langgraph/
├── execute/route.ts         # Main workflow API
└── edit/route.ts            # Edit workflow API

deployment-server/
├── server.js                # Deployment server
├── pocketbase.js            # Collection creation
└── nextjs-scaffold.js       # Backend file generation
```

---

## 🐛 Recent Fixes (2025-11-01)

### 1. API Function Naming Mismatch
**Problem:** AI generating wrong function names (e.g., `submitLeadForm` instead of `submitLead`)
**Root Cause:** Generic backend instructions didn't list exact function names
**Fix:**
- Line 251: List exact functions from `backendConfig.apiEndpoints`
- Line 508: Add "ONLY use these" + "DO NOT invent" constraints
- Result: AI now uses correct names from generated API client

### 2. Hyphen in Project IDs
**Problem:** `nanoid(15)` generates IDs with hyphens → PocketBase collection creation fails
**Error:** `validation_match_invalid` (collection names can't have hyphens)
**Fix:** Use `customAlphabet('0-9A-Za-z', 15)` in 4 files
**Result:** Clean alphanumeric IDs only

### 3. npm Install Timeout
**Problem:** 2-minute timeout too short for dependency installation
**Fix:** Increased to 5 minutes in `build-manager.js:172`

### 4. Missing zod Dependency
**Problem:** AI-generated code uses zod but it wasn't in package.json
**Fix:** Added `'zod': '^3.22.0'` to `nextjs-scaffold.js:38`

### 5. Real-Time Sync Debug Logging
**Problem:** Silent failures in PocketBase subscriptions
**Fix:** Added error handlers and auth logging in `DatabaseViewerPro.tsx:98-100`

### 6. Missing Color Theme Context in UI Generation
**Problem:** Generated apps have poor contrast/coloring despite proper styling config
**Root Cause:** AI told to use semantic tokens (bg-primary) but not told what color "primary" actually is
**Impact:** AI makes poor design decisions - can't choose appropriate contrast or understand visual theme
**Fix:**
- Line 385-386: Extract colorTheme from stylingConfig in page.tsx generation
- Line 471: Add color context to prompt: `COLOR THEME: Primary ${colors?.primary}, ${mode} mode`
- Result: AI understands actual color scheme (e.g., orange #FF6B35) when making design decisions

---

**Document Version:** 2.3
**Focus:** Workflow, Prompts, Relations, Recent Fixes
**Status:** Production ✅
