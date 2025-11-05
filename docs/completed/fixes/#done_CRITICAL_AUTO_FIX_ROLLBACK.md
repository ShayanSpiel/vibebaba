# CRITICAL: Auto-Fix Rollback for spec-char-escape

**Date**: 2025-10-26
**Priority**: 🔴 CRITICAL
**Status**: ✅ FIXED

---

## Problem: Auto-Fix Broke HTML Rendering

The `spec-char-escape` auto-fix was **TOO AGGRESSIVE** and escaped actual HTML tags, not just text content!

### What Happened:

Generated HTML:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>App</title>
</head>
<body>
    <div>Content</div>
</body>
</html>
```

After auto-fix (BROKEN):
```html
<!DOCTYPE html>
&lt;html lang="en"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    <title>App&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    <div>Content&lt;/div&gt;
&lt;/body&gt;
</html>
```

Result: **The entire HTML was escaped and rendered as plain text!**

---

## Root Cause

The regex pattern in [lib/validation/auto-fixer.ts](lib/validation/auto-fixer.ts) was matching ALL `<` and `>` characters, including those in actual HTML tags:

```typescript
// BROKEN CODE (removed):
newContent = newContent.replace(
  />([^<]*?[<>]+[^<]*?)</g,
  (match, textContent) => {
    const escaped = textContent
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `>${escaped}<`;
  }
);
```

This pattern tried to match "text between tags" but was too broad and also matched HTML tag attributes and structure.

---

## Solution: DISABLE Auto-Fix for spec-char-escape

**Decision**: Auto-fixing HTML entity escaping is **TOO RISKY** and should be handled by:
1. ✅ **Prevention**: Updated AI prompts to generate properly escaped HTML from the start
2. ✅ **AI Debugging**: Let AutoGen AI debugger fix these errors when they occur
3. ❌ **NOT** by regex auto-fix (too dangerous)

---

## Changes Made

### 1. Reverted Auto-Fixable Flag

**File**: [lib/validation/html-validator.ts](lib/validation/html-validator.ts)

```typescript
// Line 166: < and > errors
autoFixable: false, // TOO RISKY - can escape actual HTML tags

// Line 182: & warnings
autoFixable: false, // TOO RISKY - can break attributes
```

### 2. Removed Auto-Fix Implementation

**File**: [lib/validation/auto-fixer.ts](lib/validation/auto-fixer.ts)

Removed entire `case 'spec-char-escape':` block and added comment:
```typescript
// spec-char-escape is NOT auto-fixable because it's too risky
// Escaping < and > can accidentally escape actual HTML tags
// The AI generation prompts have been updated to prevent this at source
// If this error occurs, it should be fixed by AutoGen AI debugger
```

---

## Final Fix Strategy

| Issue | Solution | Responsible |
|-------|----------|-------------|
| AI generates unescaped `<`, `>`, `&` | AI prompts with entity escaping rules | **Frontend Node** |
| Validation detects unescaped entities | Report as error (do NOT auto-fix) | **Validation Engine** |
| Errors persist after generation | AutoGen AI debugger fixes them | **AutoGen Workflow** |

---

## Testing

To verify the fix works:

1. **Generate a new app** - should render properly ✅
2. **Check logs** - should NOT see "Auto-fixed: spec-char-escape" ✅
3. **Check HTML** - should NOT have escaped tags like `&lt;html&gt;` ✅

---

## Lessons Learned

1. **Regex on HTML is dangerous** - HTML is not a regular language
2. **Auto-fix should be conservative** - Only fix things that are 100% safe
3. **Prevention > Correction** - Better to fix at source (AI prompts) than after
4. **Test with real output** - Always check rendered result, not just validation

---

## Status

✅ **FIXED** - Auto-fix disabled, AI prompts updated, HTML renders correctly

The `spec-char-escape` errors will now be:
- **Prevented** by improved AI prompts (lines 472-479, 577-590 in frontend-node.ts)
- **Detected** by validation (but not auto-fixed)
- **Fixed** by AutoGen debugger if they occur

This is the **correct** and **safe** approach.
