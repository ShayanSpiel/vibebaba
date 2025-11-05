# World-Class Validation System Design

**Purpose:** Add professional syntax and error validation BEFORE code goes to preview
**Goal:** Zero malformed HTML/CSS/JS in production
**Approach:** Multi-layer validation with best-in-class tools

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     AI GENERATES CODE                        │
│                  (Prototype or Chat API)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION LAYER (NEW!)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │HTML Linting │  │CSS Linting  │  │JS Linting    │        │
│  │ (HTMLHint)  │  │ (Stylelint) │  │ (ESLint)     │        │
│  └─────────────┘  └─────────────┘  └──────────────┘        │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │Structure    │  │Placeholder  │  │Link          │        │
│  │Validation   │  │Detection    │  │Validation    │        │
│  └─────────────┘  └─────────────┘  └──────────────┘        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
                 ┌─────────┐
                 │  VALID? │
                 └────┬────┘
                      │
            ┌─────────┴──────────┐
            │                    │
            ▼                    ▼
        ✅ PASS              ❌ FAIL
            │                    │
            │              ┌─────┴─────────┐
            │              │ Auto-Fix      │
            │              │ (if possible) │
            │              └─────┬─────────┘
            │                    │
            │              ┌─────┴──────┐
            │              │            │
            │              ▼            ▼
            │         ✅ FIXED    ❌ UNFIXABLE
            │              │            │
            └──────────────┴────────────┘
                       │
                       ▼
              Return to Frontend
           (with validation report)
```

---

## VALIDATION LAYERS

### Layer 1: HTML Validation (HTMLHint)
**Tool:** `htmlhint` (npm package)
**Purpose:** Catch malformed HTML before it breaks the preview

**Checks:**
- ✓ Valid DOCTYPE
- ✓ Proper tag nesting (no `<div>` inside `<p>`)
- ✓ All tags closed
- ✓ No duplicate IDs
- ✓ Required attributes (e.g., `alt` on `<img>`)
- ✓ Valid attribute values
- ✓ Semantic HTML structure

**Configuration:**
```json
{
  "tagname-lowercase": true,
  "attr-lowercase": true,
  "attr-value-double-quotes": true,
  "doctype-first": true,
  "tag-pair": true,
  "spec-char-escape": true,
  "id-unique": true,
  "src-not-empty": true,
  "attr-no-duplication": true,
  "title-require": true
}
```

**Example Error:**
```
ERROR: Line 15, Col 5: Tag must be paired, missing: </div>
ERROR: Line 23, Col 12: ID 'container' already exists
```

---

### Layer 2: CSS Validation (Stylelint)
**Tool:** `stylelint` (npm package)
**Purpose:** Catch CSS syntax errors and bad practices

**Checks:**
- ✓ Valid CSS syntax
- ✓ No unknown properties
- ✓ Valid property values
- ✓ No duplicate properties
- ✓ Proper unit usage
- ✓ Color format consistency
- ✓ No vendor prefixes (use autoprefixer)

**Configuration:**
```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "block-no-empty": true,
    "color-no-invalid-hex": true,
    "declaration-block-no-duplicate-properties": true,
    "font-family-no-missing-generic-family-keyword": true,
    "property-no-unknown": true,
    "unit-no-unknown": true,
    "no-duplicate-selectors": true
  }
}
```

**Example Error:**
```
ERROR: Line 42: Unexpected unknown property "colour" (property-no-unknown)
ERROR: Line 58: Unexpected missing generic font family (font-family-no-missing)
WARNING: Line 73: Expected unit for "padding" (unit-no-unknown)
```

---

### Layer 3: JavaScript Validation (ESLint)
**Tool:** `eslint` (npm package)
**Purpose:** Catch JS syntax errors and runtime issues

**Checks:**
- ✓ Valid JavaScript syntax
- ✓ No undefined variables
- ✓ No unreachable code
- ✓ Proper use of `const`/`let`/`var`
- ✓ No unused variables
- ✓ Proper async/await usage
- ✓ No console errors (optional)

**Configuration:**
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "no-undef": "error",
    "no-unused-vars": "warn",
    "no-unreachable": "error",
    "no-constant-condition": "error",
    "no-dupe-keys": "error",
    "no-duplicate-case": "error",
    "semi": ["error", "always"]
  }
}
```

**Example Error:**
```
ERROR: Line 89: 'data' is not defined (no-undef)
ERROR: Line 102: Missing semicolon (semi)
WARNING: Line 115: 'oldFunction' is defined but never used (no-unused-vars)
```

---

### Layer 4: Placeholder Detection
**Tool:** Custom regex patterns
**Purpose:** Catch AI's incomplete code generation

**Patterns to Detect:**
```typescript
const PLACEHOLDER_PATTERNS = [
  /\/\/\s*\.{3,}/g,                    // // ...
  /\/\/\s*rest\s+of/gi,                 // // rest of
  /\/\/\s*existing\s+code/gi,           // // existing code
  /\/\/\s*keep\s+/gi,                   // // keep
  /<!--\s*existing/gi,                  // <!-- existing
  /<!--\s*keep/gi,                      // <!-- keep
  /<!--\s*\.{3,}/g,                     // <!-- ...
  /<!--\s*rest\s+of/gi,                 // <!-- rest of
  /\/\*\s*\.{3,}\s*\*\//g,              // /* ... */
  /\/\*\s*rest\s+of.*?\*\//gi,          // /* rest of */
  /\[\.{3,}\]/g,                        // [...]
  /{\s*\.{3,}\s*}/g,                    // {...}
];
```

**Example Detection:**
```
ERROR: Placeholder found at line 45: "// ... rest of the code ..."
ERROR: Placeholder found at line 89: "<!-- existing content -->"
```

---

### Layer 5: Structure Validation
**Tool:** Custom analysis
**Purpose:** Ensure proper file structure

**Checks:**
- ✓ Multi-page apps have all declared pages
- ✓ No missing files referenced in links
- ✓ Proper DOCTYPE in all HTML files
- ✓ Database code injection successful
- ✓ All `<script>` and `<style>` tags closed
- ✓ No malformed JSON in multi-file responses

**Example:**
```typescript
function validateStructure(files: File[]) {
  const errors = [];

  // Check 1: All HTML files have DOCTYPE
  for (const file of files) {
    if (file.path.endsWith('.html')) {
      if (!file.content.includes('<!DOCTYPE')) {
        errors.push(`Missing DOCTYPE in ${file.path}`);
      }
    }
  }

  // Check 2: All links have target files
  const htmlFiles = files.filter(f => f.path.endsWith('.html'));
  for (const file of htmlFiles) {
    const links = file.content.match(/href=["']([^"'#]+\.html)["']/gi);
    if (links) {
      for (const link of links) {
        const target = link.match(/href=["']([^"']+)["']/)[1];
        if (!files.find(f => f.path === target)) {
          errors.push(`Broken link in ${file.path}: ${target} not found`);
        }
      }
    }
  }

  return errors;
}
```

---

### Layer 6: Link Validation (Multi-Page Apps)
**Tool:** Custom parser
**Purpose:** Ensure all navigation links work

**Checks:**
- ✓ All `<a href="...">` point to existing files
- ✓ No broken internal links
- ✓ Proper file extensions (.html)
- ✓ No absolute paths in HTML apps
- ✓ Hash links only in single-page apps

**Example:**
```typescript
function validateLinks(files: File[], isMultiPage: boolean) {
  const errors = [];
  const fileNames = files.map(f => f.path);

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    // Extract all href attributes
    const hrefRegex = /href=["']([^"']+)["']/gi;
    const matches = [...file.content.matchAll(hrefRegex)];

    for (const match of matches) {
      const href = match[1];

      // Skip external links
      if (href.startsWith('http://') || href.startsWith('https://')) continue;

      // Check hash routing in multi-page apps (should not exist)
      if (isMultiPage && href.startsWith('#') && href !== '#') {
        errors.push({
          file: file.path,
          line: getLineNumber(file.content, match.index),
          error: `Hash routing "${href}" should not be used in multi-page apps`,
          fix: `Use separate .html file instead`
        });
      }

      // Check .html extension in multi-page apps
      if (isMultiPage && !href.startsWith('#') && !href.endsWith('.html')) {
        errors.push({
          file: file.path,
          line: getLineNumber(file.content, match.index),
          error: `Missing .html extension: "${href}"`,
          fix: `Change to "${href}.html"`
        });
      }

      // Check if target file exists
      if (href.endsWith('.html') && !fileNames.includes(href)) {
        errors.push({
          file: file.path,
          line: getLineNumber(file.content, match.index),
          error: `Broken link: "${href}" not found in generated files`,
          fix: `Create ${href} or fix the link`
        });
      }
    }
  }

  return errors;
}
```

---

## AUTO-FIX CAPABILITIES

Some errors can be automatically fixed:

### Auto-Fix 1: Missing Semicolons
```typescript
if (error.rule === 'semi') {
  code = code.replace(/(\w+)\n/g, '$1;\n');
}
```

### Auto-Fix 2: Missing .html Extension
```typescript
code = code.replace(/href=["']([a-z-]+)["']/gi, (match, page) => {
  if (!page.startsWith('#') && !page.includes('.')) {
    return `href="${page}.html"`;
  }
  return match;
});
```

### Auto-Fix 3: Unclosed Tags (Simple Cases)
```typescript
// Detect <div> without closing </div>
const openDivs = (code.match(/<div/gi) || []).length;
const closeDivs = (code.match(/<\/div>/gi) || []).length;
if (openDivs > closeDivs) {
  code += '</div>'.repeat(openDivs - closeDivs);
}
```

### Auto-Fix 4: Database Async/Await
```typescript
// Detect: const items = window.db.get(...)
// Fix to: const items = await window.db.get(...)
code = code.replace(
  /const\s+(\w+)\s*=\s*window\.db\.(get|find|findOne)\(/g,
  'const $1 = await window.db.$2('
);
```

---

## VALIDATION API ENDPOINT

**New Endpoint:** `POST /api/validate`

**Request:**
```json
{
  "files": [
    {"path": "index.html", "content": "<!DOCTYPE html>..."},
    {"path": "about.html", "content": "<!DOCTYPE html>..."}
  ],
  "options": {
    "autoFix": true,
    "strict": false,
    "isMultiPage": true
  }
}
```

**Response (Success):**
```json
{
  "valid": true,
  "files": [...], // Fixed files if autoFix=true
  "report": {
    "errors": [],
    "warnings": [
      {
        "file": "index.html",
        "line": 42,
        "column": 12,
        "severity": "warning",
        "message": "Consider using semantic HTML tag <header> instead of <div>",
        "rule": "semantic-html"
      }
    ],
    "fixed": [
      "Added missing semicolons (3 locations)",
      "Fixed .html extension in 2 links"
    ]
  }
}
```

**Response (Errors Found):**
```json
{
  "valid": false,
  "files": [...], // Partially fixed files
  "report": {
    "errors": [
      {
        "file": "index.html",
        "line": 89,
        "column": 5,
        "severity": "error",
        "message": "Tag must be paired, missing: </div>",
        "rule": "tag-pair",
        "autoFixable": false
      },
      {
        "file": "script.js",
        "line": 23,
        "column": 15,
        "severity": "error",
        "message": "'data' is not defined",
        "rule": "no-undef",
        "autoFixable": false
      }
    ],
    "warnings": [...],
    "fixed": [...]
  }
}
```

---

## INTEGRATION POINTS

### Integration 1: Prototype Generation
**File:** `app/api/ai/prototype/route.ts`

**Add after line 565 (after file parsing):**
```typescript
// VALIDATION STEP (NEW!)
console.log('[Prototype] 🔍 Validating generated code...');

const validationResult = await validateCode(files, {
  autoFix: true,
  strict: false,
  isMultiPage: backendConfig?.pages && backendConfig.pages.length > 0
});

if (!validationResult.valid) {
  console.error('[Prototype] ❌ Validation failed:', validationResult.report.errors);

  // If errors are critical, return them to user
  if (validationResult.report.errors.some(e => e.severity === 'error')) {
    return NextResponse.json(
      {
        error: 'Generated code has validation errors',
        validationErrors: validationResult.report.errors,
        details: 'The AI generated code with syntax errors. Please try again.',
      },
      { status: 500 }
    );
  }
}

// Use validated/fixed files
files = validationResult.files;
console.log('[Prototype] ✅ Validation passed!', {
  errors: validationResult.report.errors.length,
  warnings: validationResult.report.warnings.length,
  fixed: validationResult.report.fixed.length
});
```

### Integration 2: Chat/Modifications
**File:** `app/api/ai/chat/route.ts`

**Add after line 582 (after file parsing):**
```typescript
// VALIDATION STEP (NEW!)
const validationResult = await validateCode(updatedFiles, {
  autoFix: true,
  strict: false,
  isMultiPage: updatedFiles.length > 1
});

// Always use validated files (even if errors exist, auto-fixes are applied)
updatedFiles = validationResult.files;

// Add validation report to response message
if (validationResult.report.errors.length > 0 || validationResult.report.warnings.length > 0) {
  responseMessage += `\n\n⚠️ **Validation Report:**
${validationResult.report.errors.length > 0 ? `- Errors: ${validationResult.report.errors.length}` : ''}
${validationResult.report.warnings.length > 0 ? `- Warnings: ${validationResult.report.warnings.length}` : ''}
${validationResult.report.fixed.length > 0 ? `- Auto-Fixed: ${validationResult.report.fixed.join(', ')}` : ''}`;
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Setup (30 min)
1. Install dependencies
2. Create validation utility module
3. Configure linters

### Phase 2: Core Validation (2 hours)
1. Implement HTML validation
2. Implement CSS validation
3. Implement JS validation
4. Implement placeholder detection

### Phase 3: Advanced Validation (1 hour)
1. Structure validation
2. Link validation
3. Duplicate ID detection

### Phase 4: Auto-Fix (1 hour)
1. Implement auto-fix functions
2. Test auto-fix safety

### Phase 5: Integration (1 hour)
1. Create validation API endpoint
2. Integrate into prototype route
3. Integrate into chat route

### Phase 6: Testing (1 hour)
1. Test with malformed HTML
2. Test with CSS errors
3. Test with JS errors
4. Test auto-fix functionality
5. Test end-to-end workflow

---

## BENEFITS

✅ **Zero malformed code in preview**
✅ **Better user experience** - no broken previews
✅ **Faster debugging** - errors caught immediately
✅ **Professional quality** - enterprise-grade validation
✅ **Auto-fix common errors** - reduce regeneration need
✅ **Clear error messages** - users know what's wrong
✅ **Saves tokens** - less regeneration needed

---

## FILES TO CREATE

1. `lib/validation/html-validator.ts` - HTML validation
2. `lib/validation/css-validator.ts` - CSS validation
3. `lib/validation/js-validator.ts` - JS validation
4. `lib/validation/placeholder-detector.ts` - Placeholder detection
5. `lib/validation/structure-validator.ts` - Structure validation
6. `lib/validation/link-validator.ts` - Link validation
7. `lib/validation/auto-fixer.ts` - Auto-fix logic
8. `lib/validation/index.ts` - Main validation orchestrator
9. `app/api/validate/route.ts` - Validation API endpoint (optional)

---

**Ready to implement!** 🚀
