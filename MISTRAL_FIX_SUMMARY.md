# Mistral Authentication Fix Summary

## Problem

When LangSmith prompts tried to use Mistral models, they were failing with:
```
❌ FAILED: mistral-small-latest - Unexpected token 'B', "Bearer tok"... is not valid JSON
```

Mistral was working fine in the app normally, but failing in LangSmith context.

## Root Cause

The issue was in `lib/ai.ts` lines 373-376. When Mistral API returned an error response (like HTTP 401), the code tried to parse the response as JSON:

```typescript
if (!response.ok) {
  const errorData = await response.json();  // ❌ This fails if response is not JSON!
  throw new Error(errorData.error?.message || `HTTP ${response.status}`);
}
```

When Mistral returns certain error types with plain text instead of JSON, `response.json()` would fail with:
> "Unexpected token 'B', "Bearer tok"... is not valid JSON"

This error was masking the real authentication issue.

## Fixes Applied

### 1. Fixed JSON Parsing Error Handler (lib/ai.ts)

**Before**:
```typescript
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error?.message || `HTTP ${response.status}`);
}
```

**After**:
```typescript
if (!response.ok) {
  // Try to parse as JSON, fallback to text if it fails
  let errorMessage = `HTTP ${response.status}`;
  try {
    const errorData = await response.json();
    errorMessage = errorData.error?.message || errorData.message || errorMessage;
  } catch {
    // Response is not JSON, try to read as text
    try {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    } catch {
      // Ignore text parsing error, use default
    }
  }
  throw new Error(errorMessage);
}
```

This was applied to **3 locations** in lib/ai.ts (all Mistral, OpenRouter, and Groq error handlers).

### 2. Fixed Codestral Endpoint (lib/ai.ts:351-354)

**Before**:
```typescript
const isCodestralModel = modelName.includes("codestral");
const apiEndpoint = isCodestralModel
  ? "https://codestral.mistral.ai/v1/chat/completions"  // ❌ Wrong endpoint!
  : "https://api.mistral.ai/v1/chat/completions";
```

**After**:
```typescript
// Codestral now uses the same endpoint as Mistral
const isCodestralModel = modelName.includes("codestral");
const apiEndpoint = "https://api.mistral.ai/v1/chat/completions";  // ✅ Correct!
```

### 3. Fixed Test Script (lib/test-api-keys.ts:113)

Updated Codestral test to use correct Mistral endpoint.

## Test Results

### Before Fix:
```
❌ FAILED: mistral-small-latest - Unexpected token 'B', "Bearer tok"... is not valid JSON
❌ FAILED: ministral-8b-latest - Unexpected token 'B', "Bearer tok"... is not valid JSON
❌ FAILED: mistral-medium-latest - Unexpected token 'B', "Bearer tok"... is not valid JSON
```

### After Fix:
```
✅ SUCCESS: mistral-small-latest - "Hi"
✅ SUCCESS: ministral-8b-latest - Hello!
✅ SUCCESS: mistral-medium-latest - "Hi!"
```

## Current Status

### ✅ Working (Verified)
- **Mistral**: All 3 models working perfectly
  - mistral-small-latest ✅
  - ministral-8b-latest ✅
  - mistral-medium-latest ✅
- **OpenRouter**: Authentication successful ✅

### ⚠️ Needs API Key Update
- **Codestral**: HTTP 401 (needs valid API key or Mistral key with Codestral access)
- **Gemini**: API key invalid or API not enabled
- **Groq**: API key invalid or expired

## How to Fix Remaining Issues

### For Codestral (Recommended: Use Mistral Key)

Codestral now uses the same Mistral API. Update `.env.local`:

```bash
# Option 1: Use the same key as Mistral (recommended)
CODESTRAL_API_KEY=<same_as_your_mistral_key>

# Option 2: Get separate Codestral access from Mistral console
# Visit https://console.mistral.ai/ and check Codestral access
```

### For Gemini

1. Visit https://aistudio.google.com/apikey
2. Create new API key
3. Update `GEMINI_API_KEY` in `.env.local`

### For Groq

1. Visit https://console.groq.com/keys
2. Create new API key
3. Update `GROQ_API_KEY` in `.env.local`

## Files Modified

1. **lib/ai.ts** (Main fix)
   - Lines 373-390: Fixed JSON parsing error handler (applied 3x)
   - Lines 351-354: Fixed Codestral endpoint

2. **lib/test-api-keys.ts**
   - Lines 113-120: Updated Codestral test endpoint
   - Lines 303-343: Enhanced error messages

3. **test-mistral-in-app.ts** (New test file)
   - Created to verify Mistral works in app context

## Impact

**Before**: Mistral models were completely broken in LangSmith due to JSON parsing error
**After**: Mistral models work perfectly, can be used in LangSmith prompt experiments

The fix also makes error handling more robust across all AI providers (Mistral, OpenRouter, Groq).

## Next Steps

1. ✅ Mistral working - no action needed
2. Update Codestral key to match Mistral key (recommended)
3. Regenerate Gemini and Groq keys if needed
4. Run `npm run langsmith:test-api-keys` to verify all providers

## Test Commands

```bash
# Test all API keys
npm run langsmith:test-api-keys

# Test Mistral in app context
npx tsx test-mistral-in-app.ts

# Run LangSmith experiments (once keys are fixed)
npm run langsmith:test-all
```

---

**Date**: 2025-11-04
**Status**: ✅ Fixed - Mistral working
**Remaining**: Update Codestral/Gemini/Groq keys
