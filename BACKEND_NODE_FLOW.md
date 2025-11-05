# BACKEND NODE FLOW DOCUMENTATION

**Date:** Nov 2, 2025
**Purpose:** Document backend architecture and fixes for waitlist bug + deployment failures

---

## 🏗️ ARCHITECTURE OVERVIEW

### The Complete Flow

```
User Request
    ↓
PM Node (analyzes request)
    ↓
Backend Node (generates schema) → Creates:
    - collections: [{ name: "domains", fields: [...] }]
    - apiEndpoints: [{ method: "POST", path: "/api/domains", ... }]
    ↓
Frontend Node (generates UI) → Creates:
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/lib/api.ts (calls Express backend)
    ↓
DevOps Node (combines all) → Creates:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    SCAFFOLD FILES (hidden from user):
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    - api/server.js (Express server)
    - api/db.js (PocketBase client)
    - api/routes/domains.js (Express route handlers)
    - api/routes/waitlist.js (Express route handlers)
    - api/package.json
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    USER-FACING FILES:
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    - src/app/* (Next.js frontend - static export)
    - src/lib/api.ts (calls Express backend)
    - package.json, next.config.js, etc.
    ↓
Deployment → Builds Next.js → Static HTML/CSS/JS
           → Starts Express → Serves API + Database Tab
```

### Runtime Flow

```
┌─────────────────┐
│  Next.js App    │  (Static - runs in browser)
│  (port 4000)    │
└────────┬────────┘
         │ fetch('http://localhost:5XXX/api/domains')
         │
         ↓
┌─────────────────┐
│ Express Backend │  (api/server.js)
│  (port 5XXX)    │
└────────┬────────┘
         │ pb.collection('projectId_domains').getFullList()
         │
         ↓
┌─────────────────┐
│   PocketBase    │
│  (port 8090)    │
└─────────────────┘
```

**Key Points:**
- Next.js is **static export** (`output: 'export'`) - NO server-side code
- Express backend handles ALL API calls
- Express also powers the **Database Tab** (real-time collection viewer)
- Frontend → Express → PocketBase (3-tier architecture)

---

## 🐛 BUGS FOUND

### Bug 1: Hardcoded Waitlist Example ✅ FIXED

**File:** `lib/langgraph/nodes/backend-node.ts:130-169`

**Problem:**
The backend prompt had a hardcoded waitlist example:
```typescript
🚨 FOR THIS REQUEST - SIMPLE FORM:
Return JSON:
{
  "collections": [
    {
      "name": "waitlist",  // ← HARDCODED EXAMPLE
      ...
    }
  ]
}
```

**Effect:**
- AI sees "waitlist" example and copies it
- User requests "domain search engine"
- AI generates both domains + waitlist collections
- Waitlist appears even though user never asked for it

**Root Cause:**
Few-shot learning pollution - the example contaminates the output

---

### Bug 2: Next.js API Routes Generated (Incompatible with Static Export) ✅ FIXED

**File:** `lib/langgraph/nodes/frontend-node.ts:197-203`

**Problem:**
The fallback code adds Next.js API routes:
```typescript
if (hasBackend) {
  fileStructure.push({ path: 'src/lib/db.ts', purpose: 'PocketBase database client' });
  for (const collection of collections) {
    fileStructure.push({
      path: `src/app/api/${collection.name}/route.ts`,  // ❌ Wrong!
      purpose: `API route for ${collection.name}`
    });
  }
}
```

**Generated Files:**
```
✅ src/app/api/domains/route.ts
✅ src/app/api/waitlist/route.ts
```

**These files try to:**
```typescript
import pb from '@/lib/db'  // ❌ File doesn't exist!
import { NextResponse } from 'next/server'

export async function GET() {
  const items = await pb.collection('domains').getFullList()
  return NextResponse.json(items)
}
```

**Why This is Wrong:**

1. **`next.config.js` has `output: 'export'`**
   - Static export mode = pre-rendered HTML/CSS/JS only
   - NO server-side code allowed
   - Next.js API routes REQUIRE a Node.js server at runtime
   - **Incompatible!**

2. **Missing `src/lib/db.ts`**
   - API routes import `@/lib/db`
   - File never generated (prompt says "NO db.ts file")
   - Build fails: `Module not found: Can't resolve '@/lib/db'`

3. **Express Backend Already Exists**
   - `api/server.js` + `api/db.js` handle all API calls
   - Next.js API routes are redundant
   - Frontend should call Express directly

**Effect:**
```
npm run build
❌ Failed to compile.
./src/app/api/domains/route.ts
Module not found: Can't resolve '@/lib/db'
```

---

## 🔧 FIXES APPLIED

### Fix 1: Remove Hardcoded Waitlist Example

**File:** `lib/langgraph/nodes/backend-node.ts`

**BEFORE:**
```typescript
function buildBackendPrompt(state: AppGenState): string {
  const plan = state.plan || 'No plan provided';

  return `Generate Express.js API for: "${state.userDescription}"

PLAN:
${plan}

🚨 GENERATE MINIMAL MVP - ONLY WHAT USER EXPLICITLY REQUESTED:

1. Collections - Database tables
2. Pages - ONLY 1 page: "/" (home)
3. API Endpoints - ABSOLUTE MINIMUM

CRITICAL RULES (FOLLOW EXACTLY):
- Waitlist/Contact/Signup form → ONLY 1 POST endpoint, 1 page ("/")
- Dashboard with list → GET + POST endpoints, 1 page ("/")
- Full admin panel → All CRUD endpoints, multiple pages

🚨 FOR THIS REQUEST - SIMPLE FORM:
Return JSON:
{
  "collections": [
    {
      "name": "waitlist",
      "fields": [
        { "name": "id", "type": "text", "required": true },
        { "name": "email", "type": "email", "required": true }
      ]
    }
  ],
  "pages": [
    { "name": "Home", "route": "/" }
  ],
  "apiEndpoints": [
    { "method": "POST", "path": "/api/waitlist", "handler": "addToWaitlist", "collection": "waitlist", "description": "Add to waitlist" }
  ]
}

ONLY JSON, no markdown.`;
}
```

**AFTER:**
```typescript
function buildBackendPrompt(state: AppGenState): string {
  const plan = state.plan || 'No plan provided';

  return `USER REQUEST: "${state.userDescription}"

PLAN: ${plan}

Generate backend for what user requested. Return JSON only (no markdown):

{
  "collections": [{ "name": "...", "fields": [{ "name": "...", "type": "text|email|number", "required": true|false }] }],
  "pages": [{ "name": "...", "route": "/" }],
  "apiEndpoints": [{ "method": "GET|POST|PUT|DELETE", "path": "/api/...", "handler": "...", "collection": "...", "description": "..." }]
}

Build minimal MVP based on request.`;
}
```

**Changes:**
- ✅ Removed hardcoded waitlist example
- ✅ Removed verbose rules that pollute AI context
- ✅ Simplified to directive-based prompt
- ✅ No negative examples (AI should infer from request)

---

### Fix 2: Remove Next.js API Route Generation

**File:** `lib/langgraph/nodes/frontend-node.ts`

**BEFORE (lines 196-203):**
```typescript
// Add backend integration if needed
if (hasBackend) {
  fileStructure.push({ path: 'src/lib/db.ts', purpose: 'PocketBase database client' });
  for (const collection of collections) {
    fileStructure.push({
      path: `src/app/api/${collection.name}/route.ts`,
      purpose: `API route for ${collection.name}`
    });
  }
  // Add pages from backend
```

**AFTER:**
```typescript
// Add backend integration if needed
if (hasBackend) {
  // NOTE: Backend handled by Express (api/server.js, api/db.js)
  // Frontend calls Express via src/lib/api.ts (auto-generated after loop)
  // NO Next.js API routes needed (static export mode)
  // Add pages from backend
```

**Changes:**
- ✅ Removed `src/lib/db.ts` from fileStructure
- ✅ Removed `src/app/api/*/route.ts` from fileStructure
- ✅ Added comment explaining architecture

**Why Safe:**
- Express backend (`api/server.js` + `api/db.js`) generated by scaffold (lines 578-627 in `deployment-server/nextjs-scaffold.js`)
- `src/lib/api.ts` auto-generated after loop (line 2046 in frontend-node.ts)
- Frontend → `src/lib/api.ts` → Express → PocketBase (correct flow)

---

## 📋 RELATED CODE NOT CHANGED

### File Generation Loop (frontend-node.ts:1968-1989)

```typescript
for (let i = 0; i < otherFiles.length; i++) {
  const filePlan = otherFiles[i];
  const content = await generateFile(state, filePlan, previousFiles, componentCatalog, pagePatterns);
  files.push({ path: filePlan.path, content });
}
```

**Only generates files in `fileStructure`** - since we removed API routes from fileStructure, they won't be generated.

### API Client Auto-Generation (frontend-node.ts:2039-2051)

```typescript
if (state.backendConfig?.apiEndpoints && state.backendConfig.apiEndpoints.length > 0) {
  console.log('[Frontend] 🔗 Backend detected - generating API client...');
  const apiClientCode = generateApiClient(state.backendConfig.apiEndpoints, state.projectId);
  files.push({
    path: 'src/lib/api.ts',
    content: apiClientCode
  });
}
```

**Generates `src/lib/api.ts` that calls Express backend:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:${apiPort}';

export async function addToWaitlist(data: any): Promise<any> {
  const url = `${API_BASE}/api/waitlist`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}
```

**This is the CORRECT approach** - calls Express, not Next.js API routes.

### Scaffold Generation (deployment-server/nextjs-scaffold.js:578-627)

```javascript
function generateScaffold(projectId, backendConfig = null) {
  const files = [/* Next.js config files */];

  if (backendConfig?.apiEndpoints && backendConfig.apiEndpoints.length > 0) {
    files.push({
      path: 'api/server.js',
      content: generateExpressServer(projectId, backendConfig)
    });
    files.push({
      path: 'api/db.js',
      content: generateDbClient(projectId, backendConfig)
    });
    backendConfig.collections.forEach(collection => {
      files.push({
        path: `api/routes/${collection.name}.js`,
        content: generateRouteFile(collection.name)
      });
    });
  }
  return files;
}
```

**Generates Express backend** - `api/server.js`, `api/db.js`, `api/routes/*.js`

**These files are hidden from user** but deployed alongside Next.js app.

---

## 🎯 EXPECTED RESULTS AFTER FIX

### For Request: "ai powered domain search engine"

**Backend Node Output:**
```json
{
  "collections": [
    {
      "name": "domains",
      "fields": [
        { "name": "id", "type": "text", "required": true },
        { "name": "domain", "type": "text", "required": true },
        { "name": "available", "type": "boolean", "required": true }
      ]
    }
  ],
  "pages": [
    { "name": "Home", "route": "/" }
  ],
  "apiEndpoints": [
    { "method": "GET", "path": "/api/domains", "handler": "getDomains", "collection": "domains" },
    { "method": "POST", "path": "/api/domains", "handler": "checkDomain", "collection": "domains" }
  ]
}
```

**NO waitlist!** ✅

**Frontend Node Output:**
```
Files generated:
- src/app/layout.tsx
- src/app/page.tsx
- src/app/globals.css
- src/lib/api.ts (auto-generated, calls Express)
```

**NO `src/app/api/*/route.ts`!** ✅
**NO `src/lib/db.ts`!** ✅

**Scaffold Output:**
```
Hidden backend files:
- api/server.js
- api/db.js
- api/routes/domains.js
- api/package.json
```

**Build Result:**
```bash
npm run build
✅ Compiled successfully
✅ Export complete
```

**NO build errors!** ✅

---

## 🚨 POTENTIAL ISSUES TO WATCH

### Issue 1: Special Instructions for Non-Existent Files

**File:** `lib/langgraph/nodes/frontend-node.ts:257-286`

```typescript
if (filePlan.path === 'src/lib/db.ts') {
  specialInstructions = `...`;  // Never executes (file not in fileStructure)
} else if (filePlan.path.includes('/api/') && filePlan.path.endsWith('/route.ts')) {
  specialInstructions = `...`;  // Never executes (files not in fileStructure)
}
```

**Current Status:** Dead code (harmless but should be removed for clarity)

**Decision:** Keep for now as fallback in case AI somehow adds these files to plan

---

### Issue 2: Planning Prompt Says "NO db.ts"

**File:** `lib/langgraph/nodes/frontend-node.ts:143`

```typescript
- NO API routes, NO db.ts file
```

**Why This Instruction Exists:**
AI was sometimes generating `src/lib/db.ts` (TypeScript) on top of `api/db.js` (JavaScript), causing conflicts.

**Current Status:** Still correct - we don't want `src/lib/db.ts` in frontend

---

## 📊 SUMMARY OF CHANGES

| File | Lines | Change | Status |
|------|-------|--------|--------|
| `backend-node.ts` | 130-169 | Removed hardcoded waitlist example | ✅ Done |
| `backend-node.ts` | 130-145 | Simplified prompt (removed verbose rules) | ✅ Done |
| `frontend-node.ts` | 197-203 | Removed Next.js API routes from fileStructure | ✅ Done |
| `frontend-node.ts` | 257-286 | Dead code (special instructions for removed files) | ⚠️ Keeping as fallback |

**Total Lines Changed:** ~50 lines
**Risk Level:** Low (removing file generation, not changing existing logic)

---

## ✅ VERIFICATION CHECKLIST

Before deploying:
- [ ] Test with "domain search engine" request - should generate domains collection only
- [ ] Test with "waitlist form" request - should generate waitlist collection
- [ ] Verify build succeeds (no missing module errors)
- [ ] Verify Express backend starts and serves API
- [ ] Verify frontend can call Express backend
- [ ] Verify Database tab shows collections
- [ ] Test with multiple different requests to ensure no regression

---

**END OF DOCUMENT**
