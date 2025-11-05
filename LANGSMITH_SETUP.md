# LangSmith Setup Guide

## ✅ What's Working Now

1. **Mistral Authentication** - FIXED ✅
   - All HTTP 401 errors resolved
   - Mistral models working perfectly in LangSmith context
   - Prompt generation successful

2. **Prompt Generation** - WORKING ✅
   ```
   ✓ Created "concise" variant (222 chars) using mistral/ministral-8b-latest
   ✓ Created "detailed" variant (2326 chars) using mistral/ministral-8b-latest
   ✓ Created "structured" variant (2457 chars) using mistral/ministral-8b-latest
   ✓ Created "creative" variant (440 chars) using mistral/ministral-8b-latest
   ✓ Created "technical" variant (1185 chars) using mistral/ministral-8b-latest
   ✓ Created "conversational" variant (530 chars) using mistral/ministral-8b-latest
   ```

## ⚠️ One More Step: LangSmith Hub Upload

The prompts are generated but can't upload to LangSmith Hub yet:

```
✗ Cannot create a prompt for another tenant.
   Current tenant: null
   Requested tenant: YOUR-LANGSMITH-USERNAME
```

### How to Fix

**Step 1: Find Your LangSmith Username**

1. Go to https://smith.langchain.com/
2. Log in with your account
3. Look at the URL - your username is after `/o/`:
   ```
   https://smith.langchain.com/o/YOUR-USERNAME-HERE/
   ```

**Step 2: Update the Config**

Open `lib/langsmith/ai-prompt-generator.ts` and replace ALL occurrences of:
```typescript
projectName: 'YOUR-LANGSMITH-USERNAME/...'
```

With your actual username:
```typescript
projectName: 'your-actual-username/...'
```

**Step 3: Verify Your API Key**

Make sure your `.env.local` has a valid LangSmith API key:

```bash
LANGCHAIN_API_KEY=lsv2_pt_...  # Your actual key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=vibebaba-prompts
```

To get/verify your API key:
1. Go to https://smith.langchain.com/settings
2. Navigate to API Keys section
3. Create a new key or copy existing one
4. Update `LANGCHAIN_API_KEY` in `.env.local`

**Step 4: Test Upload**

```bash
npm run langsmith:generate-prompts pm
```

Expected success output:
```
📤 [Hub Upload] Uploading 6 prompts...
   ✓ Uploaded: your-username/pm-planning-concise
   ✓ Uploaded: your-username/pm-planning-detailed
   ✓ Uploaded: your-username/pm-planning-structured
   ✓ Uploaded: your-username/pm-planning-creative
   ✓ Uploaded: your-username/pm-planning-technical
   ✓ Uploaded: your-username/pm-planning-conversational

✅ Upload complete!
```

## Summary of All Fixes

### Fix 1: HTTP 401 (Module Loading Order)
**Problem**: API keys loaded as constants before dotenv
**Solution**: Changed to lazy-evaluated functions
**File**: `lib/ai.ts`
**Status**: ✅ Fixed

### Fix 2: rawPrompt.trim Error
**Problem**: Passing object instead of string
**Solution**: Extract `.text` property from result
**File**: `lib/langsmith/ai-prompt-generator.ts:54-55`
**Status**: ✅ Fixed

### Fix 3: Invalid Identifier Format
**Problem**: 3-part identifier `vibebaba/pm-planning/concise`
**Solution**: Use hyphen instead of slash for 2-part format
**File**: `lib/langsmith/ai-prompt-generator.ts:185-189`
**Status**: ✅ Fixed

### Fix 4: Tenant Authentication (Current)
**Problem**: Trying to upload to wrong organization
**Solution**: Update username in config
**File**: `lib/langsmith/ai-prompt-generator.ts` (9 occurrences)
**Status**: ⚠️ Needs your username

## Test Commands

```bash
# Test API keys
npm run langsmith:test-api-keys

# Generate prompts for PM node
npm run langsmith:generate-prompts pm

# Generate prompts for all nodes
npm run langsmith:generate-prompts

# Run experiments (after prompts are uploaded)
npm run langsmith:test-all
```

## Current Status

- ✅ Mistral authentication working
- ✅ Prompt generation working
- ✅ Identifier format fixed
- ⚠️ Need to update LangSmith username
- ⚠️ Need to verify API key has permissions

Once you update your username, everything should work end-to-end!

---

**Date**: 2025-11-04
**Status**: Almost complete - just needs username update
