# #done Fix: Escaped HTML Breaking CSS/JS Loading (404 Errors)

**STATUS:** ✅ IMPLEMENTED (in LangGraph architecture)

## Problem Summary

Deployed HTML files contained escaped quotes (`\"`) and other escape sequences throughout the code, causing:
- **404 errors** for external resources (e.g., `%22https://cdn.tailwindcss.com/%22`)
- **Broken CSS** loading
- **Malformed HTML** attributes

### Example of the Issue

**Before (Broken):**
```html
<html lang=\"en\">
<script src=\"https://cdn.tailwindcss.com\"></script>
<meta charset=\"UTF-8\">
```

**After (Fixed):**
```html
<html lang="en">
<script src="https://cdn.tailwindcss.com"></script>
<meta charset="UTF-8">
```

## Root Cause

The AI was returning escaped content in its responses, and the code was only unescaping some characters (`\n`) but **NOT** quotes, apostrophes, or tabs. This happened in two critical routes:

1. **Prototype generation** ([app/api/ai/prototype/route.ts](../../app/api/ai/prototype/route.ts))
2. **Chat modifications** ([app/api/ai/chat/route.ts](../../app/api/ai/chat/route.ts))

### Specific Bug Locations

Both routes had THREE code paths that process AI responses:

1. **Multi-file JSON response** - ✅ Already fixed correctly
2. **Single-file HTML response** - ❌ Only fixed `\n`, not quotes
3. **Error fallback path** - ❌ Only fixed `\n`, not quotes

## Files Modified

### 1. [app/api/ai/prototype/route.ts](../../app/api/ai/prototype/route.ts)

**Line ~330-340** (Single-file path):
```typescript
// BEFORE (Broken)
code = code.replace(/\\n/g, '\n');

// AFTER (Fixed)
code = code
  .replace(/\\n/g, '\n')           // Fix newlines
  .replace(/\\"/g, '"')             // Fix quotes
  .replace(/\\'/g, "'")             // Fix single quotes
  .replace(/\\t/g, '\t');          // Fix tabs
```

**Line ~347-357** (Error fallback path):
```typescript
// BEFORE (Broken)
code = code.replace(/\\n/g, '\n');

// AFTER (Fixed)
code = code
  .replace(/\\n/g, '\n')           // Fix newlines
  .replace(/\\"/g, '"')             // Fix quotes
  .replace(/\\'/g, "'")             // Fix single quotes
  .replace(/\\t/g, '\t');          // Fix tabs
```

### 2. [app/api/ai/chat/route.ts](../../app/api/ai/chat/route.ts)

**Line ~555-567** (Single-file path):
```typescript
// BEFORE (Broken)
code = code.replace(/\\n/g, '\n');

// AFTER (Fixed)
code = code
  .replace(/\\n/g, '\n')           // Fix newlines
  .replace(/\\"/g, '"')             // Fix quotes
  .replace(/\\'/g, "'")             // Fix single quotes
  .replace(/\\t/g, '\t');          // Fix tabs
```

**Line ~570-582** (Error fallback path):
```typescript
// BEFORE (Broken)
code = code.replace(/\\n/g, '\n');

// AFTER (Fixed)
code = code
  .replace(/\\n/g, '\n')           // Fix newlines
  .replace(/\\"/g, '"')             // Fix quotes
  .replace(/\\'/g, "'")             // Fix single quotes
  .replace(/\\t/g, '\t');          // Fix tabs
```

### 3. [scripts/fix-escaped-html.js](../../scripts/fix-escaped-html.js) (New File)

Created a cleanup script to fix **existing** deployed files that were already broken.

## How to Apply the Fix

### For New Projects

The fix is **automatic** - all new projects generated after this fix will have properly unescaped HTML.

### For Existing Deployed Projects

Run the cleanup script to fix all previously deployed files:

```bash
node scripts/fix-escaped-html.js
```

This will:
- Scan all projects in `deployment-server/deployments/`
- Fix any HTML files with escaped content
- Provide a summary of files processed

### Manual Fix (if needed)

If you need to manually fix a specific project:

1. Navigate to the deployment directory:
   ```bash
   cd deployment-server/deployments/project-[YOUR_PROJECT_ID]
   ```

2. For each HTML file, run:
   ```bash
   sed -i '' 's/\\"/"/g' index.html
   sed -i '' "s/\\'/'/g" index.html
   sed -i '' 's/\\n/\n/g' index.html
   sed -i '' 's/\\t/\t/g' index.html
   ```

## Testing the Fix

### 1. Check Browser Console

Before fix:
```
GET http://localhost:4000/%22https://cdn.tailwindcss.com/%22 404 (Not Found)
```

After fix:
```
GET https://cdn.tailwindcss.com/ 200 OK
```

### 2. Inspect HTML Source

Before fix:
```html
<script src=\"https://cdn.tailwindcss.com\"></script>
```

After fix:
```html
<script src="https://cdn.tailwindcss.com"></script>
```

### 3. Verify CSS Loading

- Check that Tailwind CSS styles are applied
- Verify fonts load correctly
- Confirm no 404 errors in Network tab

## Prevention

This fix ensures that **all escape sequences** are properly handled in:
- ✅ Multi-file JSON responses
- ✅ Single-file HTML responses
- ✅ Error fallback paths

The consistent escape sequence handling across all code paths prevents this issue from recurring.

## Impact

- **2 files fixed** in existing deployments (out of 27 scanned)
- **25 files** were already correct
- **All future projects** will generate properly formatted HTML

## Related Issues

- HTTP 404 errors for CDN resources
- Broken external CSS/JS loading
- Malformed HTML attributes
- URL encoding issues (`%22` in URLs)

## Date Fixed

**January 2025**

## Implementation Notes (Updated)

**NOTE:** The file paths mentioned in this document refer to the OLD architecture. The codebase has been refactored to use LangGraph nodes.

The escape sequence fix IS implemented, but in the new location:
- **Current implementation:** [lib/langgraph/nodes/frontend-node.ts](../../lib/langgraph/nodes/frontend-node.ts) (lines 191-207)
- The routes mentioned (prototype/route.ts, chat/route.ts) now use LangGraph workflows
- All escape sequences (`\"`, `\'`, `\n`, `\t`, `\\`) are properly handled

## Contributors

Fixed comprehensively across all code paths with automated cleanup for existing deployments.
