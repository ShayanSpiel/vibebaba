# Deployment Issues & Fixes

**Date:** 2025-10-28
**Status:** 🔧 IN PROGRESS

---

## Issues Found

### 1. Import/Export Mismatch (CRITICAL) ❌

**Error:**
```
Type error: Module '"@/components/ui/Calendar"' has no exported member 'Calendar'.
Did you mean to use 'import Calendar from "@/components/ui/Calendar"' instead?
```

**Root Cause:**
AI generates files with inconsistent import/export patterns:

**Calendar.tsx** (component):
```typescript
export default Calendar  // ← Default export
```

**ChecklistForm.tsx** (consumer):
```typescript
import { Calendar } from '@/components/ui/Calendar'  // ← Named import ❌
```

**Why This Happens:**
- Frontend AI generates multiple files independently
- Each file doesn't know the export signature of other files
- AI guesses the import style (sometimes wrong)

**Impact:** Build fails during `next build`

---

### 2. Race Condition - Duplicate Deployment ⚠️

**Logs:**
```
🚀 Deploying Next.js project: mh9p9mlrtk6etf291pd
🚀 Deploying Next.js project: mh9p9mlrtk6etf291pd  ← DUPLICATE
[DependencyAnalyzer] ❌ Error: Unexpected end of JSON input
```

**Root Cause:**
- Two API calls trigger deployment simultaneously
- Both try to write `package.json` at the same time
- File gets corrupted (incomplete JSON)

**Impact:** Corrupted `package.json`, npm install fails

---

### 3. Network Issue - Google Fonts (Minor) 🌐

**Error:**
```
request to https://fonts.gstatic.com/... failed
getaddrinfo ENOTFOUND fonts.gstatic.com
```

**Root Cause:**
- Next.js tries to download Google Fonts during build
- Network connection issue or DNS resolution failure
- Intermittent, not critical

**Impact:** Slows down build, usually retries and succeeds

---

## Solutions

### Fix 1: Enforce Consistent Import/Export Patterns

**Strategy:** Guide AI to use **default exports** consistently for React components.

**Why Default Exports?**
- React convention for components
- Simpler import syntax
- Less prone to naming errors
- Works better with dynamic imports

**Implementation:**

**File:** `lib/langgraph/nodes/frontend-node.ts`

**Add to file generation prompt:**

```typescript
CRITICAL - Import/Export Consistency:
- React components: ALWAYS use default export
  Example: export default function MyComponent() { ... }
  Import as: import MyComponent from '@/components/MyComponent'

- Utility functions/types: Use named exports
  Example: export function helper() { ... }
  Import as: import { helper } from '@/lib/utils'

- Types/interfaces: Use named exports
  Example: export interface User { ... }
  Import as: import { User } from '@/lib/types'

When generating files that import from other files you're generating:
1. Components → default import: import Calendar from '@/components/ui/Calendar'
2. Types → named import: import { Task } from '@/lib/types'
3. Utils → named import: import { formatDate } from '@/lib/utils'
```

---

### Fix 2: Add Deployment Lock

**Strategy:** Prevent concurrent deployments of the same project.

**Implementation:**

**File:** `deployment-server/server.js`

**Add deployment lock mechanism:**

```javascript
// Track active deployments
const activeDeployments = new Set();

app.post('/api/deploy', async (req, res) => {
  const { projectId } = req.body;

  // Check if already deploying
  if (activeDeployments.has(projectId)) {
    return res.status(409).json({
      error: 'Deployment already in progress',
      projectId
    });
  }

  try {
    // Lock deployment
    activeDeployments.add(projectId);

    // Deploy...
    const result = await deployProject(projectId, files);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    // Always unlock
    activeDeployments.delete(projectId);
  }
});
```

---

### Fix 3: Offline Font Fallback (Optional)

**Strategy:** Use system fonts or bundle fonts locally to avoid network dependency.

**Implementation:**

**File:** Generated `app/layout.tsx`

**Option A: System fonts**
```typescript
// Remove Google Fonts import
// import { Inter } from 'next/font/google'

// Use system fonts
const inter = {
  className: 'font-sans'  // Uses Tailwind's default font stack
}
```

**Option B: Local fonts** (if fonts are critical)
```typescript
import localFont from 'next/font/local'

const inter = localFont({
  src: './fonts/Inter-Variable.woff2',
  variable: '--font-inter',
})
```

---

## Priority Order

1. **Fix 1 (Import/Export)** - CRITICAL, blocks all deployments
2. **Fix 2 (Race Condition)** - Important, causes intermittent failures
3. **Fix 3 (Fonts)** - Optional, low priority (usually self-resolves)

---

## Testing Checklist

After implementing fixes:

- [ ] Generate new project with 10 files
- [ ] Verify all components use default exports
- [ ] Verify types use named exports
- [ ] Deploy project
- [ ] Check no "Module has no exported member" errors
- [ ] Try deploying same project twice simultaneously
- [ ] Verify second deployment gets 409 error (blocked)
- [ ] Build succeeds
- [ ] App runs without errors

---

**Status:** Ready to implement Fix 1 (Import/Export consistency)
