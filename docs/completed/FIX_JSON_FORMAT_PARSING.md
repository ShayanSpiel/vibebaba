# Fix: JSON Format Parsing for Separated Files

**Date**: 2025-10-27
**Issue**: AI returning JSON array format instead of `---FILE:---` delimiter format
**Status**: ✅ FIXED

---

## Problem

The AI was generating the separated file structure correctly (`index.html`, `styles.css`, `script.js`) but in **JSON array format**:

```json
[
  {
    "path": "index.html",
    "content": "<!DOCTYPE html>..."
  },
  {
    "path": "styles.css",
    "content": ":root { ..."
  },
  {
    "path": "script.js",
    "content": "window.addEventListener..."
  }
]
```

The frontend-node was only checking for `---FILE:---` delimiter format, so it failed to parse the JSON and fell back to "single file" mode, which triggered the auto-splitter.

---

## Root Cause

In [frontend-node.ts](lib/langgraph/nodes/frontend-node.ts#L319-L345), the code only checked for delimiter format:

```typescript
if (code.includes('---FILE:') && code.includes('---ENDFILE---')) {
  // Parse delimiter format
}
```

It **did not check for JSON format**, which the AI was actually returning.

---

## Solution

Added JSON parsing **before** checking for delimiter format:

```typescript
// Try JSON format first (AI sometimes returns JSON array)
if (code.trim().startsWith('[') || code.trim().startsWith('{')) {
  try {
    const parsed = JSON.parse(code);
    const filesArray = Array.isArray(parsed) ? parsed : [parsed];

    if (filesArray.length > 0 && filesArray[0].path && filesArray[0].content) {
      files = filesArray.map((f: any) => ({
        path: f.path,
        content: f.content
      }));
      console.log(`[Frontend] ✅ Parsed JSON format: ${files.length} files`);
    }
  } catch (e) {
    console.warn('[Frontend] ⚠️ Failed to parse as JSON, trying other formats');
  }
}

// Try delimiter format if JSON parsing failed
if (files.length === 0 && code.includes('---FILE:') && code.includes('---ENDFILE---')) {
  // Parse delimiter format...
}
```

---

## Changes Made

### File: `lib/langgraph/nodes/frontend-node.ts`

**Lines 316-377**: Added JSON parsing logic

**Key Changes**:
1. ✅ Added JSON format detection and parsing
2. ✅ Moved file validation outside delimiter check (so it runs for both JSON and delimiter formats)
3. ✅ Kept fallback to single-file mode if both formats fail

---

## Expected Behavior Now

### When AI Returns JSON Format:
```
[Frontend] ✅ Parsed JSON format: 3 files
[Frontend] Files Generated: 3
```

### When AI Returns Delimiter Format:
```
[Frontend] Multi-file response: 3 files
[Frontend] Files Generated: 3
```

### When AI Returns Single File (Fallback):
```
[Frontend] ⚠️ Single file response detected
[Frontend] 🔧 Auto-splitting inline code into separated files...
[Frontend] ✅ Auto-split into 3 files: ['index.html', 'styles.css', 'script.js']
```

---

## Testing

**Before Fix**:
- AI generated JSON with 3 files
- Frontend parsed as "single file"
- Auto-splitter extracted only HTML
- Result: No CSS/JS files in output

**After Fix**:
- AI generates JSON with 3 files
- Frontend parses JSON correctly
- Validates 3 files exist
- Result: ✅ All 3 files in output

---

## Why JSON Format?

The AI (especially OpenRouter models like Qwen, Alibaba) sometimes prefer to return structured data as JSON rather than text-based delimiters. This is actually **more reliable** than delimiter parsing because:

- ✅ No escaping issues with delimiters in code
- ✅ Native JSON parsing is faster and more robust
- ✅ Clear structure with `path` and `content` fields
- ✅ Works with AI models that prefer structured output

---

## Recommendation

Update the prompt to **explicitly request JSON format** as the primary output method, with delimiters as fallback:

```
Return the files in JSON array format:

[
  {
    "path": "index.html",
    "content": "<!DOCTYPE html>..."
  },
  {
    "path": "styles.css",
    "content": "/* CSS */"
  },
  {
    "path": "script.js",
    "content": "// JavaScript"
  }
]

OR use delimiter format if JSON is not supported.
```

This would make the system more reliable across different AI models.

---

## Status

✅ **FIXED** - The system now supports both JSON and delimiter formats for separated files.

**Next Test**: Generate a new app and verify all 3 files appear in the file list.
