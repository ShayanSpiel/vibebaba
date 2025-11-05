# VB Codebase Analysis Report
## Complete Understanding of AI Prompt Processing, Page Generation & Validation Engine

### EXECUTIVE SUMMARY

The VB system has a sophisticated architecture for generating HTML prototypes with multi-page support. The key components are:

1. **AI Prompt Engineering** - Multiple layers that construct detailed instructions for LLMs
2. **Page Detection & Validation** - System to detect if app should be single or multi-page
3. **File Delimiter Parsing** - `---FILE:xxx.html---` format for extracting multiple files
4. **Validation & Debugging Engine** - Professional validation with 3-attempt AI debugging
5. **Error Correction Loop** - Automatic AI-powered fixing of validation errors

---

## 1. AI PROMPT PROCESSING FOR PAGE GENERATION

### Location: `/Users/shayan/Desktop/Projects/VB/app/api/ai/prototype/route.ts`

The main API route (`POST /api/ai/prototype`) orchestrates the entire prompt engineering system:

#### Step 1: Component Selection Phase (Lines 124-188)
```typescript
const componentSelectionPrompt = `Analyze this EXACT user request: "${description}"
App Type: ${appType}

🚨 CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. INTENT-BASED SELECTION: Return ONLY what user EXPLICITLY asked for
2. GRANULAR CHOICES: Use specific variants matching user's exact need
3. JUSTIFICATION REQUIRED: Explain WHY each component was selected

VALIDATION RULES:
- If user says "simple" → Maximum 2-3 components total
- If user says "just a waitlist" → ONLY emailCapture: "waitlist-only", everything else: "none"
- If user says "landing page" WITHOUT mentioning pricing → pricing: "none"
- Question: "Did the user explicitly mention this feature?" If NO → set to "none"
```

**Purpose:** AI selects which UI components to include based on user intent
**Output:** JSON with component selections and justification

#### Step 2: Intent Validation Phase (Lines 196-242)
```typescript
const intentValidationPrompt = `User's EXACT request: "${description}"
AI selected components: ${JSON.stringify(componentNeeds, null, 2)}

VALIDATION TASK:
For each selected component, verify it matches what the user ACTUALLY asked for.

Critical questions:
1. Did the user mention navigation? If NO and navigation ≠ "none" → FLAG IT
2. Did the user mention pricing? If NO and pricing ≠ "none" → FLAG IT
3. Did the user say "waitlist" but emailCapture = "contact-full"? → FLAG IT
4. Did the user say "simple" but we have 5+ components? → FLAG IT
```

**Purpose:** Validates component selection against user intent to prevent bloat
**Prevents:** Over-generation of features the user didn't ask for

#### Step 3: Component Library Assembly (Lines 245-374)
Builds a detailed section showing WHICH components are being used:
- Navigation section (if requested)
- Hero section (multiple variants based on type)
- Features section
- Email capture/forms (granular options)
- Pricing cards
- CTA sections
- Footer
- Buttons

**Critical Instruction:**
```typescript
1. ✅ COPY these components EXACTLY - they are complete and working
2. ✅ ONLY use the components listed above (don't add extra components!)
3. ✅ ADAPT text, images, and colors to match user's request
4. ❌ DON'T generate components from scratch when we have templates
5. ❌ DON'T add features the user didn't request
```

#### Step 4: Enhanced Design System Prompt (Lines 394-401)
```typescript
const enhancedDesignPrompt = getEnhancedDesignSystemPrompt(appType, isDarkMode);
```

**Location:** `/Users/shayan/Desktop/Projects/VB/lib/enhanced-design-prompt.ts`

This is a comprehensive design system that includes:
- Pixel-perfect color matching instructions (from screenshot-to-code research)
- Semantic color system (v0-style CSS classes)
- Typography guidelines (fonts, weights, sizes)
- Spacing and layout rules
- Modern UI patterns (glassmorphism, gradients, shadows)
- Component assembly rules (copy exactly, don't improvise)

**Example from design system:**
```
CRITICAL: This design system is inspired by screenshot-to-code and modern 2025 UI trends.
Your job is to ASSEMBLE, not design! Use exact colors, exact spacing, exact components.

1. PIXEL-PERFECT COLOR MATCHING (from screenshot-to-code):
   ✓ Use EXACT hex colors provided - do not improvise!
   ✓ Match colors precisely: #667eea (primary), #764ba2 (accent)
   
2. COMPONENT ASSEMBLY (from v0.diy + shadcn/ui):
   ✓ COPY pre-made components exactly
   ✓ Only change: text content, links (href), colors (to match theme)
   ✓ Do NOT modify HTML structure or Tailwind classes
```

#### Step 5: Database Integration Instructions (Lines 405-475)
If the app has a backend:
```typescript
let databaseInstructions = "";
if (backendConfig && backendConfig.collections && backendConfig.collections.length > 0) {
  databaseInstructions = `
  DATABASE INTEGRATION (CRITICAL)
  
  ⚠️ CRITICAL: This app has a REAL DATABASE with these collections:
  ${backendConfig.collections.map((c: any) => `
  • Collection: "${c.name}"
    Fields: ${c.fields?.map((f: any) => `${f.name} (${f.type})`).join(', ')}
  `).join('\n')}
  
  DATABASE API (window.db) - AUTOMATICALLY INJECTED:
  ✓ await window.db.get(collectionName) → Returns array of records
  ✓ await window.db.add(collectionName, record) → Adds new record
  ✓ await window.db.update(collectionName, id, updates) → Updates record
  ✓ await window.db.delete(collectionName, id) → Deletes record
  ```
```

#### Step 6: Multi-Page vs Single-Page Output Format (Lines 481-620)

This is the CRITICAL section that differs based on whether the app is multi-page:

**For Single-Page Apps:**
```typescript
const outputFormat = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT - SINGLE PAGE APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return a SINGLE complete HTML file.

CRITICAL RULES:
• Start your response IMMEDIATELY with <!DOCTYPE html>
• DO NOT use markdown code fences like \`\`\`html or \`\`\`
• NO explanatory text before or after the HTML
• Include ALL code from <!DOCTYPE html> to </html>
`;
```

**For Multi-Page Apps:**
```typescript
const outputFormat = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🚨 CRITICAL: YOU MUST CREATE ${backendConfig.pages.length} SEPARATE FILES 🚨  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚠️  THIS IS A MULTI-PAGE APPLICATION
⚠️  YOU CANNOT CREATE JUST 1 FILE
⚠️  YOU MUST CREATE EXACTLY ${backendConfig.pages.length} FILES

IF YOU CREATE LESS THAN ${backendConfig.pages.length} FILES, THE SYSTEM WILL REJECT YOUR RESPONSE!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED FILE DELIMITER FORMAT (ONLY WAY TO CREATE MULTIPLE FILES):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---FILE:index.html---
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <nav>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
    </nav>
    ... page content ...
  </body>
</html>
---ENDFILE---

---FILE:about.html---
<!DOCTYPE html>
...
---ENDFILE---

PAGES YOU MUST CREATE (${backendConfig.pages.length} FILES REQUIRED):
${backendConfig.pages.map((page: any, index: number) => {
  let route = page.route || page.name || 'page';
  if (route.startsWith('/')) route = route.slice(1);
  if (route === '') route = 'index';
  if (!route.endsWith('.html')) route = route + '.html';
  return `${index + 1}. ${route} - REQUIRED (must have ---FILE:${route}--- block)`;
}).join('\n')}

CRITICAL RULES FOR MULTI-PAGE APPS:
✅ Each file MUST be a complete, standalone HTML document
✅ Each page gets its OWN separate HTML file
✅ Navigation MUST use <a href="about.html"> with .html extension
✅ DO NOT use hash-based routing (href="#about" is WRONG for multi-page apps!)
❌ DO NOT create just index.html with multiple page divs
❌ DO NOT use JavaScript to show/hide pages (that's single-page routing!)
`;
```

#### Step 7: Final Combined Prompt (Lines 623-668)
All sections are combined:
```typescript
const htmlPrompt = `${outputFormat}

${enhancedDesignPrompt}${componentExamplesSection}${contextSection}${databaseInstructions}${routingSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL REMINDER: 2025 ENHANCED DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are using the ENHANCED DESIGN SYSTEM (2025 Research):
✅ Complete code (NO placeholders - research-backed requirement)
✅ Pixel-perfect colors (exact hex values from design system)
✅ Modern UI patterns (glassmorphism, gradients, micro-interactions)
✅ Semantic HTML
✅ ARIA attributes
✅ Mobile-first responsive
✅ Production-ready world-class quality

${backendConfig?.pages && backendConfig.pages.length > 0 ? `
🚨🚨🚨 FINAL CRITICAL REMINDER FOR MULTI-PAGE APPS 🚨🚨🚨

You MUST create ${backendConfig.pages.length} SEPARATE files using FILE DELIMITERS!

Start NOW with:
---FILE:index.html---
<!DOCTYPE html>
...
---ENDFILE---

Then continue with ALL other pages using the same format!

DO NOT create just one index.html file - you need ${backendConfig.pages.length} separate HTML files!
` : ''}

Generate IMMEDIATELY without explanations! ${backendConfig?.pages && backendConfig.pages.length > 0 ? 'Start with ---FILE:index.html---' : 'Start with <!DOCTYPE html>'}`;
```

---

## 2. PAGE DETECTION & COUNTING LOGIC

### How the System Determines Single vs Multi-Page

**Location:** `/Users/shayan/Desktop/Projects/VB/app/api/ai/prototype/route.ts` (Lines 481, 674-678, 796-820)

#### Detection Point 1: Backend Config Analysis (Line 481)
```typescript
const outputFormat = backendConfig?.pages && backendConfig.pages.length > 0 ? `
  // Multi-page format
` : `
  // Single-page format
`;
```

The system checks:
- `backendConfig.pages` - array of page definitions
- `backendConfig.pages.length > 0` - if length > 0, it's multi-page

#### Detection Point 2: Prompt Selection (Lines 674-678)
```typescript
const isMultiPagePrompt = backendConfig?.pages && backendConfig.pages.length > 0;
console.log(`[Prototype] 📝 Using ${isMultiPagePrompt ? 'MULTI-PAGE' : 'SINGLE-PAGE'} prompt`);
if (isMultiPagePrompt) {
  console.log(`[Prototype] 📄 Expected pages:`, 
    backendConfig.pages.map((p: any) => p.route || p.name).join(', '));
}
```

#### Detection Point 3: Expected Pages Mapping (Lines 856-862)
```typescript
const expectedPages = backendConfig?.pages ? backendConfig.pages.map((p: any) => {
  let route = p.route || p.name || 'page';
  if (route.startsWith('/')) route = route.slice(1);
  if (route === '') route = 'index';
  if (!route.endsWith('.html')) route = route + '.html';
  return route;
}) : [];
```

This converts page definitions into expected filenames:
- Route `/` → `index.html`
- Route `/about` → `about.html`
- Route `pricing` → `pricing.html`
- Route `/contact/` → `contact.html`

### Page Structure in Backend Config

**Location:** `/Users/shayan/Desktop/Projects/VB/lib/langgraph/types.ts` (Lines 45-51)

```typescript
backendConfig?: {
  collections: Array<{
    name: string;
    fields: Array<{ name: string; type: string }>;
  }>;
  pages: Array<{ name: string; route: string }>;
};
```

Each page object has:
- `name` - Display name (e.g., "Home Page")
- `route` - URL route (e.g., "/", "/about", "/pricing")

---

## 3. FILE DELIMITER PARSING SYSTEM

### Location: `/Users/shayan/Desktop/Projects/VB/app/api/ai/prototype/route.ts` (Lines 775-841)

The system uses a `---FILE:xxx.html---` delimiter format to extract multiple files from a single AI response.

#### Parsing Logic:

```typescript
// Check for FILE DELIMITER format (multi-file)
if (code.includes('---FILE:') && code.includes('---ENDFILE---')) {
  console.log('[Prototype] 🔍 Parsing FILE DELIMITER format...');

  // Split by file markers using regex
  const fileMatches = code.matchAll(/---FILE:([\w\-.]+)---([\s\S]*?)---ENDFILE---/g);
  const matchesArray = Array.from(fileMatches);

  if (matchesArray.length === 0) {
    throw new Error('No valid file delimiters found');
  }

  files = matchesArray.map(match => ({
    path: match[1].trim(),           // Group 1: filename (e.g., "index.html")
    content: match[2].trim()         // Group 2: file content
  }));

  console.log(`[Prototype] ✅ Multi-file response: ${files.length} files`);
  console.log(`[Prototype] ✅ Files: ${files.map(f => f.path).join(', ')}`);
}
```

#### Regex Pattern Breakdown:
```regex
/---FILE:([\w\-.]+)---([\s\S]*?)---ENDFILE---/g
         ^^^^^^^^^^^^^^                         Captures filename
                        ^^^^^^^^^^^            Captures file content (any characters including newlines)
```

#### Example AI Response:
```
---FILE:index.html---
<!DOCTYPE html>
<html>
  <head><title>Home</title></head>
  <body>
    <nav>
      <a href="about.html">About</a>
    </nav>
    <h1>Welcome Home</h1>
  </body>
</html>
---ENDFILE---

---FILE:about.html---
<!DOCTYPE html>
<html>
  <head><title>About Us</title></head>
  <body>
    <nav>
      <a href="index.html">Home</a>
    </nav>
    <h1>About Our Company</h1>
  </body>
</html>
---ENDFILE---
```

#### Pre-Parsing Cleanup (Lines 739-763):
```typescript
// CRITICAL: Clean up markdown code blocks MORE AGGRESSIVELY
code = code.replace(/^```(?:json|html)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

// CRITICAL: Remove AI explanations/contamination
if (code.includes('---FILE:') && code.includes('---ENDFILE---')) {
  // Extract from first ---FILE: to last ---ENDFILE---
  const firstFileMarker = code.indexOf('---FILE:');
  const lastEndFileMarker = code.lastIndexOf('---ENDFILE---');
  if (firstFileMarker !== -1 && lastEndFileMarker !== -1 && 
      lastEndFileMarker > firstFileMarker) {
    code = code.substring(firstFileMarker).trim();
    console.log(`[Prototype] 🧹 Extracted FILE DELIMITER format (multi-file)`);
  }
}
```

---

## 4. VALIDATION & FILE COUNT MISMATCH ERROR

### Location: `/Users/shayan/Desktop/Projects/VB/app/api/ai/prototype/route.ts` (Lines 795-819)

This is the CRITICAL error validation that throws the "file count mismatch" error:

```typescript
// 🚨 CRITICAL: Enforce correct number of files for multi-page apps
if (backendConfig?.pages && backendConfig.pages.length > 0) {
  const expectedFileCount = backendConfig.pages.length;
  if (files.length !== expectedFileCount) {
    console.error(
      `[Prototype] ❌ CRITICAL: Expected ${expectedFileCount} files but got ${files.length}`
    );
    console.error(`[Prototype] Expected pages:`, 
      backendConfig.pages.map((p: any) => p.route || p.name));
    console.error(`[Prototype] Got files:`, files.map(f => f.path));

    return NextResponse.json(
      {
        error: `AI generated ${files.length} file(s) but ${expectedFileCount} pages were requested`,
        details: `This is a multi-page application that requires ${expectedFileCount} separate HTML files. The AI only generated ${files.length} file(s). Please try again.`,
        expectedPages: backendConfig.pages.map((p: any) => {
          let route = p.route || p.name || 'page';
          if (route.startsWith('/')) route = route.slice(1);
          if (route === '') route = 'index';
          if (!route.endsWith('.html')) route = route + '.html';
          return route;
        }),
        receivedFiles: files.map(f => f.path),
        hint: 'The AI needs to use ---FILE:xxx.html--- delimiters to create multiple files'
      },
      { status: 500 }
    );
  }
}
```

#### What Triggers the Error:
1. User requests a multi-page app (e.g., 3 pages: home, about, contact)
2. `backendConfig.pages.length = 3`
3. Expected file count = 3
4. AI only generates 2 files (forgot one page or used hash routing)
5. `files.length = 2`
6. **Error is thrown** because `2 ≠ 3`

#### Error Response Structure:
```json
{
  "error": "AI generated 2 file(s) but 3 pages were requested",
  "details": "This is a multi-page application that requires 3 separate HTML files...",
  "expectedPages": ["index.html", "about.html", "contact.html"],
  "receivedFiles": ["index.html", "about.html"],
  "hint": "The AI needs to use ---FILE:xxx.html--- delimiters to create multiple files"
}
```

---

## 5. AI DEBUGGING ENGINE

### Location: `/Users/shayan/Desktop/Projects/VB/lib/services/ai-debugger.ts`

The system has an automatic 3-attempt debugging engine that activates when validation fails.

#### Activation (Lines 864-881 in prototype/route.ts):
```typescript
if (!validationResult.valid && validationResult.report.errors.length > 0) {
  console.log('[Prototype] ⚠️  Validation errors detected, activating AI debugging engine...');

  const { debugWithAI } = await import('@/lib/services/ai-debugger');

  // Run AI debugging engine (up to 3 attempts)
  const debugResult = await debugWithAI(files, validationResult, {
    projectId: projectId || 'unknown',
    userId: user.id,
    plan,
    description,
    backendConfig,
    context,
    isMultiPage: backendConfig?.pages && backendConfig.pages.length > 0,
    expectedPages,
  });
}
```

#### Debugging Process (Lines 49-237 in ai-debugger.ts):

**Attempt Loop:**
```typescript
for (let debugAttempt = 1; debugAttempt <= MAX_DEBUG_ATTEMPTS; debugAttempt++) {
  console.log(`[AI Debugger] 🔧 Debug Attempt ${debugAttempt}/${MAX_DEBUG_ATTEMPTS}`);

  try {
    // Build error feedback for AI
    const errorFeedback = buildErrorFeedback(
      currentValidation.report.errors,
      currentFiles,
      context
    );

    // Generate improved code with AI
    const aiResult = await regenerateWithErrorFeedback(
      errorFeedback,
      context,
      currentFiles
    );

    // Validate the new code
    const newValidation = await validateCode(aiResult.files, {
      autoFix: true,
      strict: false,
      isMultiPage: context.isMultiPage,
    });

    // Check if debugging succeeded
    if (newValidation.report.errors.length === 0) {
      console.log(`[AI Debugger] ✅ SUCCESS after ${attempt} attempts`);
      return {
        success: true,
        files: currentFiles,
        validationResult: newValidation,
        attempts: attempt,
        collaborationLog
      };
    }
  } catch (error) {
    console.error(`[AI Debugger] Error in attempt ${debugAttempt}:`, error);
  }
}
```

#### Error Feedback Building (Lines 242-346):
```typescript
function buildErrorFeedback(
  errors: ValidationError[],
  files: FileToValidate[],
  context: DebugContext
): string {
  const errorsByFile: Record<string, ValidationError[]> = {};

  // Group errors by file
  errors.forEach(error => {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  });

  // Build detailed feedback
  let feedback = `# VALIDATION ERRORS DETECTED\n\n`;
  feedback += `You generated code with ${errors.length} error(s) that need to be fixed.\n\n`;

  if (context.isMultiPage && context.expectedPages && context.expectedPages.length > 0) {
    feedback += `## CRITICAL: Multi-Page App Requirements\n`;
    feedback += `This is a MULTI-PAGE application. You MUST create separate HTML files:\n`;
    feedback += context.expectedPages.map(page => `- ${page}`).join('\n');
    feedback += `\n\nDO NOT use hash routing (href="#about"), show/hide page logic, or window.location.hash.\n`;
    feedback += `Use proper navigation: <a href="about.html">About</a>\n\n`;
  }

  feedback += `## Errors by File:\n\n`;
  // ... list all errors with suggestions ...

  feedback += `## Instructions:\n`;
  feedback += `1. Fix ALL the errors listed above\n`;
  feedback += `2. Maintain the same functionality and design\n`;
  feedback += `3. Ensure all HTML files start with <!DOCTYPE html>\n`;

  if (context.isMultiPage) {
    feedback += `4. Create SEPARATE HTML files (no hash routing!)\n`;
    feedback += `5. Use proper links: href="pagename.html" not href="#pagename"\n`;
  }

  return feedback;
}
```

#### System Prompt for Debugging (Lines 481-526):
```typescript
function buildSystemPrompt(context: DebugContext): string {
  let prompt = `You are a professional web developer fixing validation errors in HTML/CSS/JavaScript code.\n\n`;

  prompt += `Your task is to fix ALL validation errors while maintaining the original functionality and design.\n\n`;

  if (context.isMultiPage) {
    prompt += `CRITICAL: This is a MULTI-PAGE application.\n`;
    prompt += `- Generate SEPARATE HTML files for each page\n`;
    prompt += `- DO NOT use hash routing (href="#page")\n`;
    prompt += `- DO NOT use show/hide page logic\n`;
    prompt += `- Use proper navigation: <a href="page.html">Link</a>\n\n`;
  }

  prompt += `Output Format:\n`;
  if (context.isMultiPage) {
    prompt += `Use FILE DELIMITER format (NOT JSON):\n`;
    prompt += `---FILE:index.html---\n`;
    prompt += `<!DOCTYPE html>...\n`;
    prompt += `---ENDFILE---\n\n`;
    // ... more pages ...
  } else {
    prompt += `Return complete HTML starting with <!DOCTYPE html>\n\n`;
  }

  // ... validation rules, critical requirements ...
  
  return prompt;
}
```

---

## 6. ROUTING INSTRUCTIONS & CONSTRAINTS

### Location: `/Users/shayan/Desktop/Projects/VB/lib/prompts/routing-instructions.ts`

This file contains comprehensive routing guidance for AI, including:

#### Multi-Page HTML Rules (Lines 194-260):
```
When to use: Apps with 5+ pages, SEO important, or simpler architecture preferred

Implementation:
Each page is a separate .html file:

<!-- index.html -->
<!DOCTYPE html>
<html>
  <nav>
    <a href="index.html">Home</a>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
  </nav>

<!-- about.html -->
<!DOCTYPE html>
<html>
  <nav>
    <a href="index.html">Home</a>
    <a href="about.html">About</a>
    <a href="contact.html">Contact</a>
  </nav>

CRITICAL RULES for Multi-Page HTML:
✓ Use <a href="pageName.html"> for navigation (relative paths)
✓ ALWAYS include the .html extension in links
✓ Each page is a complete, standalone HTML document
✗ NEVER use hash-based routing (#pageName)
✗ NEVER omit the .html extension
✗ NEVER use absolute paths (/pricing.html)
✗ NEVER mix single-page and multi-page approaches
```

#### Single-Page HTML Rules (Lines 121-193):
```
When to use: Simple apps with 2-5 pages, no SEO requirements

Implementation:
Use <a href="#pageName"> with hash-based routing
JavaScript toggles visibility using .active class
Listen to hashchange event for route changes

✓ Use <a href="#pageName"> for navigation links
✓ Each page is a <div id="pageName" class="page">
✓ JavaScript toggles visibility using .active class
✗ NEVER use <a href="pageName.html"> in single-page apps
✗ NEVER reload the page when navigating
```

#### Common Mistakes Documented (Lines 555-646):
The instructions include examples of what NOT to do:
- Mixing routing approaches (hash + file-based)
- Omitting .html extensions
- Using absolute paths
- Forgetting mandatory entry points
- Creating files without proper structure

---

## 7. VALIDATION SYSTEM LAYERS

### Location: `/Users/shayan/Desktop/Projects/VB/lib/validation/`

The validation system has 5 layers:

**Layer 1: Structure Validation** (`structure-validator.ts`)
- DOCTYPE declarations
- Multi-page link validation
- Hash routing detection (error in multi-page)
- .html extension checking
- Script/style tag pairing

**Layer 2: HTML Validation** (`html-validator.ts`)
- Tag nesting rules
- Semantic HTML checks
- Attribute validation

**Layer 3: CSS Validation** (`css-validator.ts`)
- Hex color format (must be 3 or 6 digits)
- Invalid color values

**Layer 4: JavaScript Validation** (`js-validator.ts`)
- Syntax checking
- Common errors

**Layer 5: Placeholder Detection** (`placeholder-detector.ts`)
- "Add more items here" comments
- Lorem ipsum text
- Placeholder content indicators

### Structure Validator (Lines 12-40 in structure-validator.ts):
```typescript
export function validateStructure(
  files: FileToValidate[],
  isMultiPage: boolean
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Check all HTML files have DOCTYPE
  errors.push(...validateDocTypes(files));

  // 2. Validate links between files
  if (isMultiPage) {
    errors.push(...validateLinks(files, isMultiPage));
  }

  // 3. Check for hash routing in multi-page apps
  if (isMultiPage) {
    errors.push(...validateNoHashRouting(files));
  }

  // 4. Check for missing .html extensions in multi-page apps
  if (isMultiPage) {
    errors.push(...validateHTMLExtensions(files));
  }

  // 5. Validate that script/style tags are closed
  errors.push(...validateClosedTags(files));

  return errors;
}
```

#### Multi-Page Hash Routing Detection (Lines 136-185):
```typescript
function validateNoHashRouting(files: FileToValidate[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.html')) continue;

    const content = file.content.toLowerCase();

    // Check for hash routing indicators
    const indicators = [
      { pattern: /window\.location\.hash/gi, 
        message: 'Using window.location.hash for routing' },
      { pattern: /hashchange/gi, 
        message: 'Using hashchange event for routing' },
      { pattern: /showpage|hidepage|togglepage/gi, 
        message: 'Using show/hide page functions (single-page pattern)' },
    ];

    // Check for multiple "page" divs
    const pageIdMatches = file.content.match(
      /<div[^>]*id=["']?(home|about|contact|pricing|services|faq|blog|features)/gi
    );
    if (pageIdMatches && pageIdMatches.length > 1) {
      errors.push({
        file: file.path,
        line: 1,
        column: 1,
        severity: 'error',
        message: `Found ${pageIdMatches.length} page divs in single file - this is single-page routing pattern`,
        rule: 'no-hash-routing-multipage',
        autoFixable: false,
        suggestion: 'Split into separate HTML files for each page',
      });
    }
  }

  return errors;
}
```

---

## 8. LANGGRAPH WORKFLOW INTEGRATION

### Location: `/Users/shayan/Desktop/Projects/VB/lib/langgraph/nodes/frontend-node.ts`

The newer LangGraph-based workflow has similar logic but in a multi-agent architecture:

#### Frontend Node (Lines 8-111):
```typescript
export async function frontendNode(state: AppGenState): Promise<Partial<AppGenState>> {
  try {
    // Build component library section based on selected components
    const componentLibrarySection = buildComponentLibraryFromNeeds(state.componentNeeds);

    // Determine if multi-page
    const isMultiPage = state.backendConfig?.pages && state.backendConfig.pages.length > 0;

    // Build output format instructions
    const outputFormat = isMultiPage && state.backendConfig
      ? buildMultiPageOutputFormat(state.backendConfig.pages)
      : buildSinglePageOutputFormat();

    // Build code generation prompt
    const codePrompt = `${state.designSystemPrompt}
${componentLibrarySection}
${databaseInstructions}
${ROUTING_INSTRUCTIONS}
${outputFormat}

Generate IMMEDIATELY without explanations!`;

    const aiResult = await generateWithFallback(codePrompt, true);
    let code = aiResult.text;

    // Clean up
    code = code.replace(/^```(?:json|html)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

    // Parse files
    let files: Array<{path: string; content: string}> = [];

    if (code.includes('---FILE:') && code.includes('---ENDFILE---')) {
      // Multi-file
      const fileMatches = code.matchAll(/---FILE:([\w\-.]+)---([\s\S]*?)---ENDFILE---/g);
      files = Array.from(fileMatches).map(match => ({
        path: match[1].trim(),
        content: match[2].trim()
      }));
    } else {
      // Single file
      if (!code.startsWith('<!DOCTYPE') && !code.startsWith('<html')) {
        code = '<!DOCTYPE html>\n' + code;
      }
      files = [{ path: 'index.html', content: code }];
    }

    return {
      files,
      isMultiPage,
      completedNodes: [...state.completedNodes, 'frontend'],
      artifacts: newArtifacts
    };
  } catch (error) {
    // ... error handling ...
  }
}
```

#### Output Format Builders (Lines 157-210):
```typescript
function buildMultiPageOutputFormat(pages: any[]): string {
  const pageList = pages.map((page: any) => {
    let route = page.route || page.name || 'page';
    if (route.startsWith('/')) route = route.slice(1);
    if (route === '') route = 'index';
    if (!route.endsWith('.html')) route = route + '.html';
    return route;
  }).join(', ');

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT - MULTI-PAGE APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  CRITICAL: Create SEPARATE HTML files ONLY for the pages listed below.

Use FILE DELIMITERS:
---FILE:filename.html---
<!DOCTYPE html>
... complete HTML ...
</html>
---ENDFILE---

Pages to create: ${pageList}

RULES:
✅ Each file = complete HTML document
✅ Navigation links use relative paths
✅ ONLY create links to pages that actually exist
✅ Shared content (nav, footer) duplicated in each file
❌ NO hash-based routing (e.g., #about)
❌ NO markdown code fences
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}

function buildSinglePageOutputFormat(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT - SINGLE PAGE APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return a SINGLE complete HTML file.

RULES:
• Start with <!DOCTYPE html> IMMEDIATELY
• NO markdown code fences
• NO explanatory text
• Complete code from <!DOCTYPE html> to </html>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
```

---

## 9. COMPLETE FLOW DIAGRAM

```
User Input (description, plan, backendConfig)
        ↓
┌─────────────────────────────────────────────┐
│ COMPONENT SELECTION PHASE                   │
│ - Analyze user intent                       │
│ - Select only requested components          │
│ - Return JSON with selections               │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ INTENT VALIDATION PHASE                     │
│ - Verify components match user needs        │
│ - Remove unwanted features                  │
│ - Correct component selections              │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ DETERMINE PAGE TYPE                         │
│ IF backendConfig.pages.length > 0           │
│   → MULTI-PAGE APP                          │
│ ELSE                                        │
│   → SINGLE-PAGE APP                         │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ BUILD COMPREHENSIVE PROMPT                  │
│                                             │
│ 1. Output Format (multi-page rules)         │
│ 2. Design System (colors, typography)       │
│ 3. Component Library (pre-made components)  │
│ 4. Database Instructions (if applicable)    │
│ 5. Routing Instructions (file structure)    │
│ 6. Validation Rules (hex colors, nesting)   │
│                                             │
│ FOR MULTI-PAGE:                             │
│ - Expected file count                       │
│ - File delimiter format                     │
│ - Required pages list                       │
│ - Multi-page routing rules                  │
│                                             │
│ FOR SINGLE-PAGE:                            │
│ - Hash routing instructions                 │
│ - Single HTML file format                   │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ SEND PROMPT TO AI (Claude/GPT)              │
│ Timeout: 90 seconds                         │
│ Retry: Up to 2 attempts on failure          │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ PARSE AI RESPONSE                           │
│                                             │
│ IF has ---FILE:xxx.html--- delimiters       │
│   → Use regex to extract multiple files     │
│   → Parse: /---FILE:([\w\-.]+)---(...)      │
│   → Extract path and content                │
│ ELSE                                        │
│   → Treat as single HTML file               │
│   → Wrap with <!DOCTYPE html> if needed     │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ VALIDATE FILE COUNT (MULTI-PAGE ONLY)       │
│                                             │
│ IF isMultiPage:                             │
│   expectedCount = backendConfig.pages.length│
│   receivedCount = files.length              │
│                                             │
│   IF expectedCount !== receivedCount        │
│     → RETURN ERROR (file count mismatch)    │
│     → Include expected pages list           │
│     → Include received files list           │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ RUN VALIDATION SYSTEM (5 LAYERS)            │
│                                             │
│ Layer 1: Structure (DOCTYPE, links)         │
│ Layer 2: HTML (nesting, tags)               │
│ Layer 3: CSS (hex colors)                   │
│ Layer 4: JavaScript (syntax)                │
│ Layer 5: Placeholders (temp content)        │
│                                             │
│ → Returns: errors[], warnings[]             │
└─────────────────────────────────────────────┘
        ↓
        IF errors detected:
            ↓
┌─────────────────────────────────────────────┐
│ AI DEBUGGING ENGINE (3 ATTEMPTS)            │
│                                             │
│ Attempt 1: Build error feedback             │
│            Send to AI for fixing            │
│            Validate result                  │
│                                             │
│ Attempt 2: If still errors, try again       │
│                                             │
│ Attempt 3: Final attempt                    │
│                                             │
│ IF all errors fixed → Return success        │
│ ELSE → Return detailed error report         │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ INJECT DATABASE CODE (if applicable)        │
│ Inject window.db API into all HTML files    │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ RETURN RESPONSE TO CLIENT                   │
│                                             │
│ {                                           │
│   code: mainFile.content,  // backward compat
│   files: [                 // new multi-file│
│     { path: 'index.html', content: '...' },│
│     { path: 'about.html', content: '...' }│
│   ],                                        │
│   aiMetadata: {                             │
│     model: 'claude-opus-4',                 │
│     provider: 'openrouter',                 │
│     filesGenerated: 2,                      │
│     totalCharacters: 15240                  │
│   }                                         │
│ }                                           │
└─────────────────────────────────────────────┘
```

---

## 10. KEY FILES SUMMARY

| File | Purpose | Key Functions |
|------|---------|---|
| `/api/ai/prototype/route.ts` | Main generation API | POST handler, prompt building, validation, file parsing |
| `/lib/services/ai-debugger.ts` | 3-attempt debugging | debugWithAI(), buildErrorFeedback(), parseAIResponse() |
| `/lib/enhanced-design-prompt.ts` | Design system instructions | getEnhancedDesignSystemPrompt() |
| `/lib/prompts/routing-instructions.ts` | Routing guidelines | ROUTING_INSTRUCTIONS constant |
| `/lib/validation/index.ts` | Validation orchestrator | validateCode(), 5-layer validation |
| `/lib/validation/structure-validator.ts` | Structure checking | validateStructure(), hash routing detection |
| `/lib/langgraph/nodes/frontend-node.ts` | LangGraph frontend agent | frontendNode(), output format builders |
| `/lib/langgraph/types.ts` | Type definitions | AppGenState interface |

---

## 11. ERROR HANDLING EXAMPLES

### Example 1: File Count Mismatch Error

**What triggers it:**
```typescript
backendConfig.pages = [
  { route: '/', name: 'Home' },
  { route: '/about', name: 'About' },
  { route: '/contact', name: 'Contact' }
]
// Expected count: 3

// AI generates only 2 files:
files = [
  { path: 'index.html', content: '...' },
  { path: 'about.html', content: '...' }
]
// Received count: 2

// 2 ≠ 3 → ERROR!
```

**Error response:**
```json
{
  "error": "AI generated 2 file(s) but 3 pages were requested",
  "details": "This is a multi-page application that requires 3 separate HTML files...",
  "expectedPages": ["index.html", "about.html", "contact.html"],
  "receivedFiles": ["index.html", "about.html"],
  "hint": "The AI needs to use ---FILE:xxx.html--- delimiters to create multiple files",
  "status": 500
}
```

### Example 2: Hash Routing in Multi-Page App

**What triggers it:**
AI generates:
```html
---FILE:index.html---
<!DOCTYPE html>
<html>
  <nav>
    <a href="#home">Home</a>
    <a href="#about">About</a>
    <a href="#contact">Contact</a>
  </nav>
  <div id="home" class="page active">Home content</div>
  <div id="about" class="page">About content</div>
  <div id="contact" class="page">Contact content</div>
  <script>
    window.addEventListener('hashchange', () => {
      // hash routing logic
    });
  </script>
</html>
---ENDFILE---
```

**Validation error:**
- Rule: `no-hash-routing-multipage`
- Message: "Using hashchange event for routing - this is a single-page pattern, not multi-page"
- Suggestion: "Use separate HTML files with <a href=\"page.html\"> instead"

### Example 3: Hex Color Validation Error

**What triggers it:**
```html
<div style="color: #; background: #FF0000;">...</div>
```

**Validation error:**
- Rule: `color-no-invalid-hex`
- Message: "Invalid hex color: #"
- Suggestion: "Hex colors must be 3 or 6 digits: #FFF, #FFFFFF"

---

## 12. PROMPT ENGINEERING BEST PRACTICES USED

The system implements several sophisticated prompt engineering techniques:

### 1. **Explicit Output Format First**
Place output format at the beginning of prompt so AI reads it first:
```
"OUTPUT FORMAT FIRST - before any other instructions"
```

### 2. **Multi-Level Instructions**
Break down into multiple levels:
- System prompt (critical rules)
- Main prompt (what to do)
- Examples (how to do it)
- Validation rules (constraints)
- Final reminder (emphasis)

### 3. **Constraint Emphasis**
Use visual hierarchy and repetition:
```
🚨 CRITICAL
⚠️  WARNING
✅ CORRECT
❌ WRONG
```

### 4. **Intent-Based Selection**
Force AI to match user intent:
```
"Question: Did the user explicitly mention this feature?"
```

### 5. **File Delimiter Format**
Clear, unambiguous format for multi-file generation:
```
---FILE:filename.html---
content
---ENDFILE---
```

### 6. **Validation Rules in Prompt**
Include validation rules so AI knows what will fail:
```
"All hex colors MUST be exactly 3 or 6 digits"
"No block elements inside <p> tags"
"SEPARATE files, not hash routing"
```

### 7. **Example Responses**
Show correct and incorrect examples:
```
✅ CORRECT: <a href="about.html">About</a>
❌ WRONG: <a href="#about">About</a>
```

---

## 13. CRITICAL VALIDATION RULES IN PROMPTS

These rules are embedded in the AI prompts to prevent common errors:

### Hex Color Rules:
```
❌ INVALID: #, ##, #F, #FF, #FFFF, #FFFFF
✅ VALID: #FFF, #000, #FF0000, #667eea
```

### HTML Nesting Rules:
```
❌ INVALID: <p><div>Text</div></p>
✅ VALID: <div><p>Text</p></div>
```

### Multi-Page Rules:
```
❌ INVALID: <a href="#about">About</a> (hash routing)
✅ VALID: <a href="about.html">About</a> (separate files)
```

### Placeholder Rules:
```
❌ INVALID: "Add more items here..."
✅ VALID: Complete content with all items listed
```

---

## CONCLUSION

The VB system implements a sophisticated prompt engineering architecture with:

1. **Multi-stage prompt construction** - Component selection → Validation → Design system → Final prompt
2. **Clear page detection** - Based on `backendConfig.pages.length`
3. **Robust file parsing** - Regex-based extraction of `---FILE:xxx.html---` delimiters
4. **Strict validation** - 5-layer validation system with detailed error reporting
5. **AI-powered debugging** - Up to 3 automatic attempts to fix validation errors
6. **Comprehensive constraints** - Output format, validation rules, routing instructions all embedded in prompts

This creates a robust system that generates production-ready HTML with minimal human intervention.
