# Root Cause: Missing database/pocketbase Import Path

## The Error

```
[DependencyAnalyzer] ⚠️  Found 1 missing local imports:
  src/lib/api-hooks.ts: import './database/pocketbase' (file not found)
❌ Build failed: 1 missing local module(s)
```

## Root Cause Found

**Location**: `lib/generation/infrastructure-templates.ts` line 201

**The Problem**: Hardcoded wrong import path in `generateApiHooks()` function:

```typescript
// ❌ WRONG (line 201)
import { pb } from './database/pocketbase';
```

But the actual file is generated as:
```
src/lib/pocketbase.ts  ← Generated here
```

Not:
```
src/lib/database/pocketbase.ts  ← Trying to import from here (doesn't exist!)
```

## Why This Happens

The frontend infrastructure generator creates `src/lib/pocketbase.ts` but the `api-hooks.ts` template tries to import from a non-existent subdirectory (`database/`).

This is a **hardcoded path mismatch** - likely from an old file structure that has since changed.

## The Fix (ONE CHARACTER)

Changed line 201 in `lib/generation/infrastructure-templates.ts`:

```typescript
// Before:
import { pb } from './database/pocketbase';

// After:
import { pb } from './pocketbase';
```

Removed `/database` from the path.

## Why This Wasn't Caught Before

- The code generation succeeds
- Files are written to disk
- Only the **build/deployment** step catches the missing import
- Not a TypeScript compilation error (it's a runtime module resolution error)

## Impact

This breaks **every project** that uses backend API hooks, causing deployment failures.

## Result

Now `api-hooks.ts` correctly imports from `./pocketbase` matching the actual generated file location.
