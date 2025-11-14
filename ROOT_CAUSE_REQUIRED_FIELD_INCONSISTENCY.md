# Root Cause: Required Field Inconsistency

## The Recurring Error

```typescript
Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
Type 'undefined' is not assignable to type 'string'.
```

## Root Cause Found

**Location**: `lib/langgraph/nodes/backend/index.ts` line ~443

**The Problem**: Backend prompt shows field schema as:
```json
{ "name": "field_name", "type": "text|...", "required": true|false }
```

**What's Missing**: **ZERO guidance** on WHEN to use `required: true` vs `required: false`!

## Why This Causes Errors

1. Backend AI sees `"required": true|false` and guesses randomly
2. Sometimes generates `imageUrl: required: true` → frontend gets `imageUrl: string` → works
3. Sometimes generates `imageUrl: required: false` → frontend gets `imageUrl?: string` → TypeScript error!
4. Non-deterministic behavior explains why "errors keep coming back"

## Verified Working Components

✅ **API Client Generator** - Correctly interprets `required: true/false`
✅ **Type Extractor** - Correctly extracts optional vs required
✅ **Frontend Prompts** - Correctly show type information
❌ **Backend Prompt** - No guidance on which fields should be required!

## The Fix (ONE LINE)

Add to backend prompt after line 443:

```typescript
🚨 DEFAULT: Set required: true for all user-defined fields unless explicitly optional (notes, tags, metadata).
```

This gives AI clear, deterministic guidance.

## Why Previous Fixes Didn't Work

Previous fixes targeted:
- Type extraction formatting
- Frontend null checks
- Prompt warnings

But these all addressed **symptoms**, not the **root cause**: Backend AI has no rules for setting `required` field.
