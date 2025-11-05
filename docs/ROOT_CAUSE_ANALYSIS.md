# ROOT CAUSE ANALYSIS - Critical Issues
**Date**: 2025-11-04
**Status**: 🚨 CRITICAL - Architecture Changes Required

---

## Executive Summary

The system has **3 fundamental architectural problems** that cannot be fixed with prompts alone:

1. **Routing**: Static export + in-memory builds = deployment/serving mismatch
2. **Feature Placement**: No file-to-feature mapping system
3. **Data Flow**: No generated SDK + inconsistent API signatures

---

## Issue 1: Multi-Page Routing Failures
### Symptom
```
Cannot GET /apps/project-YCZtbLPqLjSzing/dashboard/settings
```

### ROOT CAUSE: Static Export + Deployment Architecture Mismatch

**The Problem Chain:**
1. `next.config.js` sets `output: 'export'` (static HTML generation)
2. Static export requires ALL pages pre-rendered at build time
3. Files stored in PocketBase, NOT as actual Next.js project on disk
4. Preview URL is `/project/${id}` but basePath is `/apps/project-${id}`
5. No actual Next.js `npm run build` happens during generation
6. Pages created by AI but never actually built/validated

**Evidence:**
- `next.config.js:4` - `basePath: '/apps/project-YCZtbLPqLjSzing'`
- `devops-node.ts:29` - `generateScaffold()` merges files but doesn't build
- `frontend-node.ts:647-673` - `generateStaticParams()` rules exist but not enforced
- No actual file artifacts on disk - everything in PocketBase JSON

**Why It Fails:**
```javascript
// What AI generates:
src/app/dashboard/settings/page.tsx

// What Next.js static export needs:
1. page.tsx exists ✓
2. generateStaticParams() if dynamic routes ✗
3. npm run build to create /apps/project-X/dashboard/settings.html ✗
4. Proper serving of static HTML from build output ✗
```

### SOLUTION OPTIONS:

#### Option A: Build Validation (Quick Fix)
```typescript
// devops-node.ts - AFTER file generation
const buildResult = await execSync('npm run build', { cwd: projectPath });
if (buildResult.status !== 0) {
  // Build failed - AI made mistakes
  // Parse errors, regenerate broken files
}
```
**Pros**: Catches build errors, forces valid code
**Cons**: Slower, still doesn't fix root architecture

#### Option B: Server Components + API Routes (Recommended)
```javascript
// next.config.js
module.exports = {
  // Remove 'output: export'
  basePath: '/apps/project-X',
  // Keep images unoptimized
}
```
**Pros**: Supports true multi-page apps, API routes work, SSR available
**Cons**: Requires hosting Node.js server (not just static files)

#### Option C: Client-Side Routing Only (Hacky)
```typescript
// Force all apps to be SPA with client-side routing
// src/app/layout.tsx - intercept ALL routes
// Use state management for "fake" pages
```
**Pros**: Works with static export
**Cons**: Poor SEO, breaks browser back button, not real multi-page

---

## Issue 2: PM Context Awareness (Feature Placement)
### Symptom
- Blog editor dashboard on main blog page
- User requests auth but gets dashboard without auth
- "White and Yellow theme" interpreted as "add theme management"

### ROOT CAUSE: No File-to-Feature Mapping System

**The Missing Link:**

```typescript
// PM Node outputs:
allRequestedFeatures = [
  { id: 'blog-posts', name: 'Blog Posts', included_in_mvp: true },
  { id: 'admin-dashboard', name: 'Admin Dashboard', included_in_mvp: true }
]

// Frontend Node receives features BUT...
// ❌ NO mapping of: "Blog Posts" → src/app/page.tsx
// ❌ NO mapping of: "Admin Dashboard" → src/app/dashboard/page.tsx

// When generating src/app/page.tsx, AI sees:
"Build these features: Blog Posts, Admin Dashboard"
// And thinks: "Let me put BOTH on the home page!"
```

**Evidence:**
- `pm-node.ts:113-155` - Feature extraction works perfectly ✓
- `frontend-node.ts:107-177` - File planning prompt lists features BUT no assignment
- `frontend-node.ts:500-950` - Page generation has NO context about which feature this file is for

**Current Flow:**
```
PM → Extract Features → [Feature1, Feature2, Feature3]
                                ↓
Frontend → Plan Files → [page1.tsx, page2.tsx, page3.tsx]
                                ↓
          → Generate Each File ← ALL FEATURES MIXED TOGETHER ❌
```

**Needed Flow:**
```
PM → Extract Features with Routes → [
  { feature: 'Blog Posts', route: '/', file: 'src/app/page.tsx' },
  { feature: 'Admin Dashboard', route: '/dashboard', file: 'src/app/dashboard/page.tsx' }
]
                                ↓
Frontend → Generate File → ONLY the feature assigned to this file ✓
```

### SOLUTION OPTIONS:

#### Option A: UX Node Assigns Routes (Recommended)
```typescript
// NEW: ux-node.ts
export async function uxNode(state) {
  // ... existing styling ...

  // NEW: Route assignment using AI
  const routeMapping = await generateWithAI(`
    Assign routes to features:

    Features:
    ${state.allRequestedFeatures.map(f => `- ${f.name}: ${f.description}`).join('\n')}

    Rules:
    - Main user-facing feature → "/" (home page)
    - Admin/dashboard features → "/dashboard"
    - Auth features → "/login", "/register"
    - Detail pages → "/[resource]/[id]"

    Return JSON:
    {
      "routes": [
        { "featureId": "blog-posts", "route": "/", "file": "src/app/page.tsx", "purpose": "Blog listing" },
        { "featureId": "admin-dashboard", "route": "/dashboard", "file": "src/app/dashboard/page.tsx", "purpose": "Manage blog posts" }
      ]
    }
  `);

  return {
    ...state,
    featureRouteMapping: routeMapping
  };
}
```

Then in frontend-node.ts:
```typescript
async function generateFile(state, filePlan, ...) {
  // Find which feature this file is for
  const assignment = state.featureRouteMapping.find(r => r.file === filePlan.path);

  if (assignment) {
    // Generate ONLY this feature
    const feature = state.allRequestedFeatures.find(f => f.id === assignment.featureId);
    prompt = `Generate ${assignment.route} page ONLY for:

    Feature: ${feature.name}
    Description: ${feature.description}
    Purpose: ${assignment.purpose}

    DO NOT include other features - focus ONLY on ${feature.name}`;
  }
}
```

**Pros**: AI makes intelligent UX decisions, clean separation
**Cons**: Extra AI call

#### Option B: Convention-Based Mapping (Faster)
```typescript
// frontend-node.ts - planFileStructure()
function mapFeaturesToFiles(features) {
  const mapping = [];

  features.forEach(feature => {
    const featureLower = feature.name.toLowerCase();

    // Convention: Admin/Dashboard features → /dashboard
    if (featureLower.includes('admin') || featureLower.includes('dashboard')) {
      mapping.push({
        featureId: feature.id,
        route: '/dashboard',
        file: 'src/app/dashboard/page.tsx'
      });
    }
    // Convention: First high-priority feature → home page
    else if (feature.priority === 'high' && mapping.length === 0) {
      mapping.push({
        featureId: feature.id,
        route: '/',
        file: 'src/app/page.tsx'
      });
    }
    // Convention: Other features → /[feature-slug]
    else {
      const slug = feature.id;
      mapping.push({
        featureId: feature.id,
        route: `/${slug}`,
        file: `src/app/${slug}/page.tsx`
      });
    }
  });

  return mapping;
}
```

**Pros**: No extra AI calls, deterministic
**Cons**: Less flexible, may miss nuances

---

## Issue 3: Backend Data Flow Issues
### Symptom
- Posts load when using subscription form
- Data inconsistencies between components

### ROOT CAUSE: No Generated SDK + Manual API Client

**The Problem:**

```typescript
// backend-node.ts generates:
{
  apiEndpoints: [
    { method: 'POST', path: '/api/posts', handler: 'createPost' },
    { method: 'GET', path: '/api/posts/:id', handler: 'getPost' }
  ]
}

// devops-node.ts manually generates lib/api.ts:
export async function createPost(data: any) {
  return fetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getPost(id: string) {
  return fetch(`/api/posts/${id}`); // ← Manual string interpolation
}

// Frontend uses it:
const post = await getPost('123'); // ← Might call wrong function
```

**Issues:**
1. **No Type Safety** - `data: any`, no validation
2. **String Concatenation** - Easy to mess up `/api/posts${id}` vs `/api/posts/${id}`
3. **Inconsistent Signatures** - AI keeps getting confused about parameters
4. **No Shared State** - Each component has own useState, no sync

**Evidence:**
- `frontend-node.ts:339-355` - "EXACT FUNCTION SIGNATURES" warnings (repeated 3x!)
- `frontend-node.ts:678-702` - More warnings about NOT modifying parameters
- Multiple TODOs about API signature mismatches

### SOLUTION OPTIONS:

#### Option A: Generate Typed SDK (Recommended)
```typescript
// NEW: lib/sdk-generator.ts
export function generateSDK(backendConfig) {
  const types = generateTypes(backendConfig);
  const client = generateClient(backendConfig);

  return {
    'src/lib/types.ts': types,
    'src/lib/api.ts': client
  };
}

function generateTypes(config) {
  return `
// Auto-generated types from backend schema
${config.collections.map(c => `
export interface ${capitalize(c.name)} {
  id: string;
  ${c.fields.map(f => `${f.name}: ${mapType(f.type)};`).join('\n  ')}
}
`).join('\n')}
`;
}

function generateClient(config) {
  return `
import { ${config.collections.map(c => capitalize(c.name)).join(', ')} } from './types';

const API_BASE = '/api';

${config.apiEndpoints.map(ep => {
  const collection = config.collections.find(c => c.name === ep.collection);
  const returnType = capitalize(ep.collection);
  const pathParams = (ep.path.match(/:[a-z]+/g) || []).map(p => p.slice(1));
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method);

  let signature = `${ep.handler}(`;
  if (pathParams.length > 0) {
    signature += pathParams.map(p => `${p}: string`).join(', ');
  }
  if (hasBody) {
    signature += `${pathParams.length > 0 ? ', ' : ''}data: Partial<${returnType}>`;
  }
  signature += `)`;

  return `
export async function ${signature}: Promise<${returnType}> {
  const url = \`\${API_BASE}${ep.path.replace(/:([a-z]+)/g, '${$1}')}\`;
  const res = await fetch(url, {
    method: '${ep.method}',
    ${hasBody ? "headers: { 'Content-Type': 'application/json' }," : ''}
    ${hasBody ? 'body: JSON.stringify(data),' : ''}
  });
  if (!res.ok) throw new Error('API call failed');
  return res.json();
}`;
}).join('\n\n')}
`;
}
```

**Benefits:**
- ✅ Type-safe API calls
- ✅ No signature confusion
- ✅ Autocomplete in IDE
- ✅ Compile-time errors if misused

**Cons:** Requires code generation refactor

#### Option B: Use React Query + Simplified API (Medium)
```typescript
// Install: npm install @tanstack/react-query

// src/lib/api.ts - Simplified base
const api = {
  async get(endpoint: string) {
    const res = await fetch(`/api${endpoint}`);
    return res.json();
  },
  async post(endpoint: string, data: any) {
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

// Components use hooks:
function BlogPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get('/posts')
  });

  const createMutation = useMutation({
    mutationFn: (post) => api.post('/posts', post),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] })
  });
}
```

**Benefits:**
- ✅ Automatic caching
- ✅ State management built-in
- ✅ No more useState for each API call

**Cons:** New dependency, learning curve

---

## RECOMMENDATION: Phased Approach

### Phase 1: Quick Wins (1-2 days)
1. **Add Build Validation** - Catch errors before deployment
2. **Convention-Based Route Mapping** - Fix feature placement
3. **Improve API Signature Prompts** - Add more examples

### Phase 2: Architectural Fixes (1 week)
1. **Implement Feature-to-Route Mapping** (Option A from Issue 2)
2. **Generate Typed SDK** (Option A from Issue 3)
3. **Add Actual Next.js Build Step** - Store build artifacts properly

### Phase 3: Infrastructure (2-3 weeks)
1. **Switch to Server Components** - Remove static export limitation
2. **Add React Query** - Better state management
3. **Create Preview Server** - Proper serving of generated apps
4. **Add E2E Testing** - Validate generated apps automatically

---

## Immediate Action Items

### For Routing Issue:
```typescript
// devops-node.ts - Add build validation
const buildPath = await writeToDisk(allFiles, projectId);
const buildResult = await exec(`cd ${buildPath} && npm install && npm run build`);

if (buildResult.stderr) {
  // Parse errors, mark specific files as broken
  return {
    errors: parseBuildErrors(buildResult.stderr),
    needsRegeneration: true
  };
}
```

### For Feature Placement:
```typescript
// Add to types.ts
interface FeatureRouteMapping {
  featureId: string;
  featureName: string;
  route: string;
  file: string;
  purpose: string;
  dependencies: string[];
}

// In ux-node.ts - NEW SECTION
const routeMapping = assignFeaturesToRoutes(
  state.allRequestedFeatures,
  state.userDescription
);

return {
  ...state,
  featureRouteMapping: routeMapping
};
```

### For API Client:
```typescript
// Replace manual api.ts generation with template-based SDK
const sdkFiles = generateTypedSDK(state.backendConfig);
allFiles.push(...sdkFiles);
```

---

## Testing Plan

### Test Case 1: Multi-page Blog
```
Input: "Create a blog with admin panel"

Expected:
✓ / (home) - Blog post listing
✓ /post/[slug] - Individual post page
✓ /dashboard - Admin dashboard for managing posts
✓ All routes work (no 404s)
✓ npm run build succeeds
✓ Data flows correctly between pages
```

### Test Case 2: Auth-gated App
```
Input: "Create a todo app with user authentication"

Expected:
✓ /login - Login page (included in MVP)
✓ / - Todo list (requires auth)
✓ Login form works, stores token
✓ Todo CRUD works with backend
✓ Auth state persists across pages
```

### Test Case 3: Theme Recognition
```
Input: "Blog with white and yellow theme"

Expected:
✓ Primary color: yellow (#FCD34D)
✓ Background: white (#FFFFFF)
✓ NO theme management UI created
✓ Styling applied correctly to all pages
```

---

## Conclusion

The issues are **architectural**, not prompt-based. The quick wins can help (Phase 1), but the system needs structural changes (Phase 2-3) for reliable multi-page apps.

**Priority**: Implement Phase 1 this week, plan Phase 2 for next sprint.
