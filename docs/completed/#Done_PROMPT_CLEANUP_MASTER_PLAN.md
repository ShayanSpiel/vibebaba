# #notDone PROMPT CLEANUP - MASTER PLAN & IMPLEMENTATION GUIDE

**Date:** 2025-10-27
**Status:** 📋 NOT STARTED - READY FOR IMPLEMENTATION
**Estimated Time:** 9-13 hours (includes deep review fixes)
**Expected ROI:** 35% token reduction (~3,000 tokens saved) + improved Next.js code quality + resolved 13 critical inconsistencies

---

## 📊 EXECUTIVE SUMMARY

### The Problem

We successfully implemented **Next.js AI Autonomy Architecture** (2-phase generation), but the codebase still contains extensive HTML-era prompts that:
- Waste **3,000 tokens** per generation (35% overhead)
- Confuse AI with contradictory instructions (HTML vs Next.js)
- Limit AI autonomy by prescribing component layouts
- Duplicate rules across multiple files (4+ times)
- **13 critical inconsistencies** found across 8 files (5 original + 8 from deep review)

### The Solution

Comprehensive prompt cleanup to align with Next.js-first paradigm:
- Delete 718 lines of HTML routing instructions → 100 lines Next.js only
- Remove UX component selection (AI decides autonomously)
- Eliminate `generationMode` logic (always Next.js)
- Consolidate duplicate precision rules
- Modernize all prompts for trust-based AI autonomy

### Expected Impact

```
┌──────────────────────────────┬──────────┬──────────┬──────────┐
│ Metric                       │  Before  │  After   │ Savings  │
├──────────────────────────────┼──────────┼──────────┼──────────┤
│ Token usage (simple app)     │   8500   │   5500   │  -3000   │
│ Token usage (medium app)     │  16000   │  10500   │  -5500   │
│ Token usage (complex app)    │  32000   │  21000   │ -11000   │
├──────────────────────────────┼──────────┼──────────┼──────────┤
│ Cost per generation          │ $0.0170  │ $0.0110  │  -35%    │
│ Annual savings (10K gens)    │    —     │   $585   │   $585   │
└──────────────────────────────┴──────────┴──────────┴──────────┘

**Updated after deep review:** Token savings increased from 29% → 35% due to 8 additional
inconsistencies found in node implementations (PM contradictory mode, pages arrays,
HTML references, component selection logic, window.db guidance, editor defaults).
```

---

## 🎯 DETAILED ANALYSIS

### Current State Issues

#### 1. Routing Instructions Bloat

**File:** `lib/prompts/routing-instructions.ts` (718 lines)

**Breakdown:**
- 200 lines: HTML single-page (hash routing) - ❌ OBSOLETE
- 250 lines: HTML multi-page (.html files) - ❌ OBSOLETE
- 100 lines: React Router (Vite) - ❌ OUT OF SCOPE
- 100 lines: Next.js App Router - ✅ KEEP
- 68 lines: Expo/React Native - ❌ NOT IMPLEMENTED

**Problem:** 618 lines (86%) are irrelevant for Next.js-only architecture

**Current Code:**
```typescript
// lib/prompts/routing-instructions.ts (lines 1-718)
export const ROUTING_INSTRUCTIONS = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTING & URL HANDLING (CRITICAL FOR MULTI-PAGE APPS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ⚠️ ⚠️  CRITICAL - READ BEFORE GENERATING ⚠️ ⚠️ ⚠️

ROUTING IS THE #1 SOURCE OF BUGS!
Make SURE you understand which routing approach to use:

✅ Multi-Page HTML → Use <a href="page.html"> with .html extension
✅ Single-Page HTML → Use <a href="#page"> with hash routing
✅ React → Use <Link to="/page"> from react-router-dom
✅ Next.js → Use <Link href="/page"> from next/link

... [618 more lines of HTML/React routing instructions]
`;
```

---

#### 2. UX Node Component Prescription

**File:** `lib/prompts/node-prompts.ts` (lines 156-236)

**Problem:** UX node prescribes exact component layout, limiting AI autonomy

**Current Code:**
```typescript
// lib/prompts/node-prompts.ts:156-236
ux: {
  nodeId: 'ux',
  nodeName: 'UX Designer',
  category: 'product',
  systemPrompt: `You are a UX Designer selecting components based on user intent.

Product Plan: {{productPlan}}
User Request: "{{userDescription}}"
App Type: {{appType}}

Your task: Select ONLY components the user explicitly requested or clearly implied.

Return JSON:
{
  "navigation": "none|simple|full",
  "hero": "none|minimal-cta|centered|gradient|product-showcase",
  "features": "none|icon-grid|cards|timeline",
  "testimonials": "none|simple|carousel",
  "pricing": "none|simple|comparison-table",
  "contact": "none|simple-form|detailed-form",
  "footer": "none|minimal|full",
  "justification": "Explain WHY each non-none component was selected."
}

${PRECISION_RULES}

CRITICAL RULES:
1. DEFAULT to "none" for all components
2. ONLY select if user explicitly mentioned or clearly implied
3. Provide justification for EVERY non-none selection
4. Quote user's words in justification

COMPONENT SELECTION GUIDE:

navigation:
- "none": Default for single pages, forms, landing pages without nav
- "simple": User mentions "navigation" or multiple pages/sections
- "full": User requests "full website" or "complete navigation"

hero:
- "none": Forms, dashboards, tools (no hero needed)
- "minimal-cta": Simple landing with just headline + CTA
- "centered": Standard landing page
- "gradient": User mentions "modern" or "vibrant"
- "product-showcase": User showcasing specific product/service

... [80 more lines of component guidelines]
`,
  estimatedTokens: 800,
  enabled: true
},
```

**Issue:** This is HTML-era thinking where we built pages from 7 predefined sections. In Next.js AI Autonomy, Frontend AI should autonomously choose from full Ant Design library (100+ components).

---

#### 3. PM Node GenerationMode Logic

**File:** `lib/langgraph/nodes/pm-node.ts` (lines 87-93)

**Problem:** Hardcoded HTML mode, references disabled Next.js

**Current Code:**
```typescript
// lib/langgraph/nodes/pm-node.ts:87-93
    // ✅ HARDCODED TO HTML MODE (Next.js will be explicit UI choice later)
    const mode = 'html'; // Hardcoded to HTML for now
    console.log(`[PM] Generation Mode: html (explicit - Next.js disabled)`);

    // NOTE: generationMode removed - framework is always Next.js + TypeScript + Tailwind
    // Frontend node will handle all generation with AI autonomy
    const contextWithMode = context;
```

**Issue:** Contradictory comments and logic. Architecture doc says "always Next.js", but code says "HTML mode, Next.js disabled".

---

#### 4. Duplicate Precision Rules

**Problem:** "Generate only what user requested" repeated in 4+ places

**Locations:**
1. ✅ `lib/prompts/precision-rules.ts` - Exported constant (GOOD)
2. ❌ `lib/prompts/node-prompts.ts` - Inlined via `${PRECISION_RULES}` in founder, pm, ux, backend
3. ❌ `lib/langgraph/nodes/frontend-node.ts` - Inline duplication
4. ❌ `lib/langgraph/subgraphs/autogen-debugger.ts` - Inline duplication

**Current (Good):**
```typescript
// lib/prompts/precision-rules.ts
export const PRECISION_RULES = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PRECISION RULE (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ONLY generate what the user EXPLICITLY requested.

When in doubt: Generate LESS, not more.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
```

**Problem (Inline):**
```typescript
// Some nodes still have inline versions instead of importing
const prompt = `
Generate only what user requested.
When in doubt, generate LESS not more.
... [duplicated content]
`;
```

---

#### 5. Frontend Node HTML References

**File:** `lib/langgraph/nodes/frontend-node.ts` (lines 140-180)

**Problem:** References to HTML/CSS/JS files, should be pure Next.js

**Current Code:**
```typescript
// lib/langgraph/nodes/frontend-node.ts:140-180
const prompt = `Generate: ${filePath}
Purpose: ${filePlan.purpose}

Tech Stack:
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- File type: ${filePath.endsWith('.tsx') ? 'React component' : filePath.endsWith('.ts') ? 'TypeScript module' : 'CSS file'}

${previousFilesContext}

${backendInstructions}

${componentLibrary}

Design: ${state.context?.designStyle || 'modern'}

Return ONLY the code for ${filePath}.
Generate complete, production-ready code.
No explanations, no markdown fences, just the code.`;
```

**Issues:**
- Mentions "CSS file" (Next.js uses Tailwind inline)
- Missing 'use client' directive guidance
- No Server Component best practices
- Generic "production-ready" without Next.js specifics

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Quick Wins (1-2 hours)

#### Step 1.1: Routing Instructions Cleanup

**DELETE:** `lib/prompts/routing-instructions.ts`

```bash
# Check for references first
grep -r "routing-instructions" lib/ --include="*.ts" --include="*.tsx"
grep -r "ROUTING_INSTRUCTIONS" lib/ --include="*.ts" --include="*.tsx"
grep -r "getRoutingInstructions" lib/ --include="*.ts" --include="*.tsx"

# Move to legacy (don't delete, preserve history)
mkdir -p docs/legacy/html-generation/prompts
mv lib/prompts/routing-instructions.ts docs/legacy/html-generation/prompts/
```

**CREATE:** `lib/prompts/routing-nextjs.ts`

```typescript
/**
 * NEXT.JS ROUTING GUIDE
 * Focused guide for Next.js App Router only
 * Replaces 718 lines of mixed routing instructions
 */

export const NEXTJS_ROUTING = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT.JS APP ROUTER - FILE-BASED ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## File Structure → Routes

- app/page.tsx → / (home page - REQUIRED)
- app/about/page.tsx → /about
- app/blog/[id]/page.tsx → /blog/:id (dynamic route)
- app/api/users/route.ts → /api/users (API endpoint)

## Mandatory Files

✅ app/layout.tsx - Root layout with <html> and <body>
✅ app/page.tsx - Home page (entry point)

## Navigation

Use <Link> component from 'next/link':
\`\`\`tsx
import Link from 'next/link';

<Link href="/about">About</Link>
<Link href="/blog/123">Blog Post</Link>
\`\`\`

For programmatic navigation:
\`\`\`tsx
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
\`\`\`

## Server vs Client Components

✅ Server Components (default):
- Better performance
- Direct database access
- Zero JavaScript to client
- Use when: Displaying data, static content

✅ Client Components ('use client'):
- Interactive elements
- Use React hooks
- Use when: Forms, modals, interactive UI

Add 'use client' at top of file when component needs:
- useState, useEffect, useContext, etc.
- onClick, onChange, onSubmit, etc.
- window, document, localStorage, etc.

## API Routes

Create route.ts files in app/api/ directory:
\`\`\`tsx
// app/api/users/route.ts
export async function GET(request: Request) {
  return Response.json({ users: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ success: true });
}
\`\`\`

## Best Practices

✅ Use Server Components by default
✅ Add 'use client' only when needed
✅ Co-locate related files in same folder
✅ Use Tailwind classes inline (no separate CSS files)
✅ Every route folder needs page.tsx to be accessible

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

/**
 * Get Next.js routing guide for prompts
 */
export function getNextJSRouting(): string {
  return NEXTJS_ROUTING;
}
```

**UPDATE IMPORTS:** Search and replace all imports

```bash
# Find files importing old routing
grep -r "from '@/lib/prompts/routing-instructions'" lib/

# Update each file:
# Before:
# import { ROUTING_INSTRUCTIONS } from '@/lib/prompts/routing-instructions';

# After:
# import { NEXTJS_ROUTING } from '@/lib/prompts/routing-nextjs';
```

**Token Savings:** ~600 tokens per generation

---

#### Step 1.2: Remove UX Component Selection

**MODIFY:** `lib/prompts/node-prompts.ts` (lines 156-236)

**Before:**
```typescript
ux: {
  nodeId: 'ux',
  nodeName: 'UX Designer',
  category: 'product',
  systemPrompt: `You are a UX Designer selecting components based on user intent.

Product Plan: {{productPlan}}
User Request: "{{userDescription}}"
App Type: {{appType}}

Your task: Select ONLY components the user explicitly requested or clearly implied.

Return JSON:
{
  "navigation": "none|simple|full",
  "hero": "none|minimal-cta|centered|gradient|product-showcase",
  "features": "none|icon-grid|cards|timeline",
  "testimonials": "none|simple|carousel",
  "pricing": "none|simple|comparison-table",
  "contact": "none|simple-form|detailed-form",
  "footer": "none|minimal|full",
  "justification": "Explain WHY each non-none component was selected."
}

... [80 more lines of component selection guidelines]
`,
  estimatedTokens: 800,
  enabled: true
},
```

**After:**
```typescript
ux: {
  nodeId: 'ux',
  nodeName: 'UX Designer',
  category: 'product',
  systemPrompt: `You are a UX Designer selecting design system and extracting styling preferences.

Product Plan: {{productPlan}}
User Request: "{{userDescription}}"
App Type: {{appType}}

Your task: Select appropriate design system and extract styling preferences.

Return JSON:
{
  "designSystem": "ant-design",
  "stylingConfig": {
    "colorTheme": {
      "primary": "#1890ff",
      "secondary": "#52c41a",
      "mode": "light|dark|auto"
    },
    "layout": {
      "maxWidth": "1200px",
      "spacing": "normal|compact|comfortable"
    },
    "typography": {
      "fontFamily": "Inter",
      "scale": "normal|small|large"
    },
    "animations": {
      "enabled": true,
      "intensity": "subtle|moderate|heavy"
    }
  },
  "notes": "Any specific styling preferences detected from user request"
}

${PRECISION_RULES}

DESIGN SYSTEM SELECTION:
- ant-design: Default for most applications (comprehensive component library)
- Future: material-ui, chakra-ui when implemented

STYLING EXTRACTION:
- Extract colors if user mentions: "blue", "dark mode", "vibrant", etc.
- Detect layout preferences: "compact", "spacious", "wide", "narrow"
- Animation intensity: dashboard→subtle, portfolio→moderate, landing→heavy
- Default to sensible values if not specified

IMPORTANT:
- Frontend AI will autonomously choose which components to use from the design system
- You are NOT prescribing component layout (navigation, hero, footer, etc.)
- You are ONLY selecting the design system and extracting styling preferences
- Frontend AI has access to full component library (100+ components in Ant Design)
`,
  inputSchema: {
    productPlan: { type: 'object', required: true },
    userDescription: { type: 'string', required: true },
    appType: { type: 'string', required: true }
  },
  outputSchema: {
    designSystem: { type: 'string' },
    stylingConfig: { type: 'object' },
    notes: { type: 'string' }
  },
  estimatedTokens: 300, // Reduced from 800
  enabled: true
},
```

**VERIFY:** `lib/langgraph/nodes/ux-node.ts` implementation

```typescript
// lib/langgraph/nodes/ux-node.ts
// Should parse designSystem and stylingConfig, NOT component selection
// If it parses navigation/hero/footer, remove that logic
```

**Token Savings:** ~500 tokens per generation

---

#### Step 1.3: Remove PM GenerationMode Logic

**MODIFY:** `lib/langgraph/nodes/pm-node.ts` (lines 87-93)

**Before:**
```typescript
    // ✅ HARDCODED TO HTML MODE (Next.js will be explicit UI choice later)
    const mode = 'html'; // Hardcoded to HTML for now
    console.log(`[PM] Generation Mode: html (explicit - Next.js disabled)`);

    // NOTE: generationMode removed - framework is always Next.js + TypeScript + Tailwind
    // Frontend node will handle all generation with AI autonomy
    const contextWithMode = context;
```

**After:**
```typescript
    // Framework is always Next.js + TypeScript + Tailwind
    // Frontend AI decides file structure autonomously (1-100 files)
    // No mode selection needed
    console.log(`[PM] Framework: Next.js (AI autonomy for file structure)`);
```

**Also Update:** `lib/prompts/node-prompts.ts` PM prompt

**Before:**
```typescript
pm: {
  // ...
  systemPrompt: `You are a Product Manager creating a product plan.

// ... plan details ...

Return JSON:
{
  "appType": "landing-page|dashboard|form|marketplace|social|ecommerce|portfolio|blog|saas|tool",
  "designStyle": "minimal|modern|vibrant|professional|playful|elegant|tech|corporate",
  "features": [...],
  "pages": ["home", "about", "contact"],  // Only if user explicitly requests multiple pages
  "userFlows": [...]
}
`,
}
```

**After:**
```typescript
pm: {
  // ...
  systemPrompt: `You are a Product Manager creating a product plan.

// ... plan details ...

Return JSON:
{
  "appType": "landing-page|dashboard|form|marketplace|social|ecommerce|portfolio|blog|saas|tool",
  "designStyle": "minimal|modern|vibrant|professional|playful|elegant|tech|corporate",
  "features": [...],
  "userFlows": [...]
}

${PRECISION_RULES}

IMPORTANT:
- Framework is ALWAYS Next.js + TypeScript + Tailwind
- Frontend AI will autonomously decide file structure (1-100 files)
- Do NOT include "pages" array - Frontend AI decides page/route structure
- Focus on features and user flows only
`,
}
```

**Token Savings:** ~200 tokens per generation

---

#### Step 1.4: Consolidate Precision Rules

**CHECK:** All files using precision rules

```bash
grep -r "Generate only what" lib/ --include="*.ts"
grep -r "When in doubt" lib/ --include="*.ts"
grep -r "PRECISION_RULES" lib/ --include="*.ts"
```

**ENSURE:** All use imported constant, not inline

**Example Fix:**

**Before (inline):**
```typescript
// lib/langgraph/nodes/frontend-node.ts
const prompt = `
Generate only what the user explicitly requested.
When in doubt, generate LESS not more.

... rest of prompt
`;
```

**After (imported):**
```typescript
import { PRECISION_RULES } from '@/lib/prompts/precision-rules';

const prompt = `
${PRECISION_RULES}

... rest of prompt
`;
```

**Files to Check:**
- `lib/prompts/node-prompts.ts` ✅ (already uses `${PRECISION_RULES}`)
- `lib/langgraph/nodes/frontend-node.ts` ❓ (check for inline)
- `lib/langgraph/subgraphs/autogen-debugger.ts` ❓ (check for inline)

---

### Phase 2: Frontend Prompt Refinement (2-3 hours)

#### Step 2.1: Update Frontend File Generation Prompt

**MODIFY:** `lib/langgraph/nodes/frontend-node.ts` (lines 140-180)

**Before:**
```typescript
const prompt = `Generate: ${filePath}
Purpose: ${filePlan.purpose}

Tech Stack:
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- File type: ${filePath.endsWith('.tsx') ? 'React component' : filePath.endsWith('.ts') ? 'TypeScript module' : 'CSS file'}

${previousFilesContext}

${backendInstructions}

${componentLibrary}

Design: ${state.context?.designStyle || 'modern'}

Return ONLY the code for ${filePath}.
Generate complete, production-ready code.
No explanations, no markdown fences, just the code.`;
```

**After:**
```typescript
import { PRECISION_RULES } from '@/lib/prompts/precision-rules';
import { NEXTJS_ROUTING } from '@/lib/prompts/routing-nextjs';

// Helper function for file-specific guidance
function getFileTypeGuidance(filePath: string): string {
  if (filePath.includes('/api/')) {
    return `Next.js API Route
- Export GET, POST, PUT, DELETE functions
- Use Request/Response objects
- Example: export async function GET(request: Request) { return Response.json({data}) }`;
  }

  if (filePath.endsWith('layout.tsx')) {
    return `Layout Component (Server Component)
- Must return <html> and <body> tags
- Wraps all pages in this route segment
- Use for shared navigation, footers, metadata`;
  }

  if (filePath.endsWith('page.tsx')) {
    return `Page Component
- Default export React component
- Server Component by default (add 'use client' only if needed)
- Represents a route in your application`;
  }

  if (filePath.endsWith('.tsx')) {
    return `React Component
- Server Component by default (better performance)
- Add 'use client' ONLY if component needs:
  • React hooks: useState, useEffect, useContext, etc.
  • Event handlers: onClick, onChange, onSubmit, etc.
  • Browser APIs: window, document, localStorage, etc.`;
  }

  if (filePath.endsWith('.ts')) {
    return `TypeScript Module
- Utility functions, types, helpers
- No React components (use .tsx for components)`;
  }

  return 'Next.js file';
}

// Updated prompt
const prompt = `Generate: ${filePath}
Purpose: ${filePlan.purpose}

TECH STACK:
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS (inline classes only)

FILE TYPE:
${getFileTypeGuidance(filePath)}

${previousFilesContext}

${backendInstructions}

COMPONENT LIBRARY:
${componentLibrary}

DESIGN STYLE: ${state.context?.designStyle || 'modern'}

${PRECISION_RULES}

NEXT.JS BEST PRACTICES:
✅ Use Server Components by default (better performance, no JS to client)
✅ Add 'use client' directive ONLY when component needs interactivity:
   - React hooks (useState, useEffect, useContext, etc.)
   - Event handlers (onClick, onChange, onSubmit, etc.)
   - Browser APIs (window, document, localStorage, sessionStorage, etc.)
✅ Use <Link> from 'next/link' for navigation (not <a> tags)
✅ Use Tailwind CSS classes inline (no separate CSS files)
✅ Import from design system library (Ant Design, etc.)
✅ Co-locate related files (components near where they're used)

${NEXTJS_ROUTING}

Return ONLY the complete, production-ready code for ${filePath}.
No explanations. No markdown fences. No comments like "// rest of code".
Generate the FULL, COMPLETE file.`;
```

**Token Savings:** ~1000 per file (removes redundant HTML instructions)

---

#### Step 2.2: Enhance 'use client' Detection

**VERIFY:** `lib/langgraph/nodes/frontend-node.ts` auto-fix logic (lines 165-210)

**Current (should be good):**
```typescript
// Auto-add 'use client' directive if needed
function shouldUseClientDirective(content: string): boolean {
  const clientIndicators = [
    'useState',
    'useEffect',
    'useContext',
    'useReducer',
    'useCallback',
    'useMemo',
    'useRef',
    'onClick',
    'onChange',
    'onSubmit',
    'window.',
    'document.',
    'localStorage',
    'sessionStorage',
  ];

  return clientIndicators.some(indicator => content.includes(indicator));
}

function addUseClientDirective(content: string): string {
  if (content.includes("'use client'") || content.includes('"use client"')) {
    return content; // Already has directive
  }

  return `'use client'\n\n${content}`;
}
```

**Enhance if needed:**
```typescript
function shouldUseClientDirective(content: string): boolean {
  // React Hooks
  const hooks = [
    'useState', 'useEffect', 'useContext', 'useReducer',
    'useCallback', 'useMemo', 'useRef', 'useLayoutEffect',
    'useImperativeHandle', 'useTransition', 'useDeferredValue'
  ];

  // Event Handlers
  const events = [
    'onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur',
    'onKeyDown', 'onKeyUp', 'onMouseEnter', 'onMouseLeave',
    'onScroll', 'onLoad', 'onError'
  ];

  // Browser APIs
  const browserAPIs = [
    'window.', 'document.', 'localStorage', 'sessionStorage',
    'navigator.', 'location.', 'history.', 'addEventListener'
  ];

  // Third-party hooks/libraries that require client
  const clientLibraries = [
    'useRouter', 'useSearchParams', 'usePathname', // Next.js client hooks
    'use client', // Explicit
  ];

  const allIndicators = [...hooks, ...events, ...browserAPIs, ...clientLibraries];

  return allIndicators.some(indicator => content.includes(indicator));
}
```

---

### Phase 3: Node Prompts Registry Cleanup (2-3 hours)

#### Step 3.1: Update Frontend Node Prompt

**MODIFY:** `lib/prompts/node-prompts.ts` frontend definition

**Before:**
```typescript
frontend: {
  nodeId: 'frontend',
  nodeName: 'Frontend Engineer',
  category: 'product',
  systemPrompt: `You are a Frontend Engineer writing HTML/CSS code.

Design System: {{designSystemPrompt}}

Routing Instructions: {{routingInstructions}}

Component Selection: {{componentSelection}}

Backend Config: {{backendConfig}}

Database Integration: {{databaseIntegration}}

Your task: Generate file-based HTML/CSS.

OUTPUT FORMAT (MANDATORY):
[
  {"path": "index.html", "content": "<!DOCTYPE html>..."},
  {"path": "styles.css", "content": "/* CSS */"}
]

${PRECISION_RULES}

CRITICAL RULES:
1. Return ONLY valid JSON array of file objects
2. Each file must have "path" and "content" keys
3. HTML files must be complete (<!DOCTYPE html> to </html>)
4. Use file-based architecture (separate files for multi-page)
5. If database exists, use window.db API (it's already injected)
6. Follow design system specifications exactly
7. Generate ONLY what user requested

DATABASE API (if backend exists):
- await window.db.get(collectionName) → Get all records
- await window.db.add(collectionName, data) → Add record
- await window.db.update(collectionName, id, updates) → Update record
- await window.db.delete(collectionName, id) → Delete record
- window.db.subscribe(collectionName, callback) → Real-time updates

Generate ONLY what the user requested. No extra features.`,
  estimatedTokens: 4000,
  enabled: true
},
```

**After:**
```typescript
frontend: {
  nodeId: 'frontend',
  nodeName: 'Frontend Engineer',
  category: 'product',
  systemPrompt: `You are a Frontend Engineer generating Next.js applications.

FRAMEWORK: Next.js 14+ (App Router) + TypeScript + Tailwind CSS

Your task: Generate Next.js files autonomously based on user requirements.

GENERATION PROCESS:
This prompt is used in 2 phases:

Phase 1: File Structure Planning
- AI plans which files to generate (1-100 files)
- Returns JSON array: [{"path": "app/page.tsx", "purpose": "Home page"}, ...]

Phase 2: File Generation (per-file)
- AI generates each file with full context
- Sees previously generated files
- Returns complete, production-ready code

TECH STACK:
- Framework: Next.js 14+ (App Router)
- Language: TypeScript (.tsx for components, .ts for modules)
- Styling: Tailwind CSS (inline classes only, no separate CSS files)
- Components: {{designSystem}} (Ant Design, etc.)

NEXT.JS FILE TYPES:
- app/layout.tsx: Root layout (required) - must have <html> and <body>
- app/page.tsx: Home page (required) - route entry point
- app/[route]/page.tsx: Other pages - creates routes
- app/api/[...]/route.ts: API endpoints - exports GET/POST/etc
- components/*.tsx: Reusable components
- lib/*.ts: Utility functions, helpers

SERVER VS CLIENT COMPONENTS:
✅ Server Components (default):
   - Better performance (no JS to client)
   - Can directly access databases, APIs
   - Use for: Data display, static content, layouts

✅ Client Components ('use client' directive):
   - Interactive, uses React hooks
   - Use for: Forms, modals, interactive UI
   - Add 'use client' at top if component needs:
     • React hooks: useState, useEffect, etc.
     • Event handlers: onClick, onChange, etc.
     • Browser APIs: window, document, localStorage

ROUTING & NAVIGATION:
- File-based routing: app/about/page.tsx → /about route
- Use <Link href="/about">About</Link> from 'next/link'
- Dynamic routes: app/blog/[id]/page.tsx → /blog/:id

${PRECISION_RULES}

CRITICAL:
- Generate ONLY what user requested
- Return complete, production-ready code
- No placeholders, no "// rest of code" comments
- Server Components by default, 'use client' only when needed
- Tailwind inline (no separate CSS files)

Note: Actual implementation uses this as reference. Real prompts are in frontend-node.ts with context injection.`,
  inputSchema: {
    designSystem: { type: 'string', required: true },
    userDescription: { type: 'string', required: true },
    productPlan: { type: 'object', required: true },
    backendConfig: { type: 'object', optional: true }
  },
  outputSchema: {
    files: { type: 'array' }
  },
  estimatedTokens: 3000, // Reduced from 4000
  enabled: true
},
```

---

#### Step 3.2: Verify Other Nodes

**PM Node:**
```typescript
pm: {
  // Already updated in Phase 1
  // No pages array, no generationMode
  estimatedTokens: 500, // Reduced from 700
}
```

**UX Node:**
```typescript
ux: {
  // Already updated in Phase 1
  // No component selection, just design system + styling
  estimatedTokens: 300, // Reduced from 800
}
```

**Backend Node:**
```typescript
backend: {
  // Should be good as-is (PocketBase schema only)
  // Verify no HTML/frontend references
  estimatedTokens: 500, // No change
}
```

**Founder Node:**
```typescript
founder: {
  // Should be good as-is (framework-agnostic)
  estimatedTokens: 600, // No change
}
```

---

#### Step 3.3: Remove Future Nodes

**MODIFY:** `lib/prompts/node-prompts.ts` (lines 367-402)

**Before:**
```typescript
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FUTURE NODES (Commented for now - ready to enable)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 'marketing-analyzer': {
  //   nodeId: 'marketing-analyzer',
  //   nodeName: 'Marketing Analyzer',
  //   category: 'marketing',
  //   systemPrompt: `Analyze SEO, conversion optimization, and marketing effectiveness...`,
  //   inputSchema: {},
  //   outputSchema: {},
  //   estimatedTokens: 800,
  //   enabled: false
  // },

  // 'seo-optimizer': { ... }
  // 'analytics-tracker': { ... }
```

**After:**
```typescript
  // Future nodes removed - add back when implementing
  // See: docs/future-nodes.md for planned additions
```

---

### Phase 4: Documentation & Archival (1-2 hours)

#### Step 4.1: Create Legacy Folder Structure

```bash
# Create legacy documentation folder
mkdir -p docs/legacy/html-generation/prompts
mkdir -p docs/legacy/html-generation/implementations
mkdir -p docs/legacy/html-generation/docs
```

---

#### Step 4.2: Move HTML-Era Files

```bash
# Move outdated prompt files
mv lib/prompts/routing-instructions.ts docs/legacy/html-generation/prompts/
mv lib/prompts/routing-html-only.ts docs/legacy/html-generation/prompts/ # if exists

# Move HTML-era implementation docs
mv SEPARATED_FILE_STRUCTURE.md docs/legacy/html-generation/docs/
mv IMPLEMENTATION_COMPLETE.md docs/legacy/html-generation/docs/

# Move obsolete node files (if they exist)
# Check first:
ls lib/langgraph/nodes/frontend-router.ts 2>/dev/null && \
  mv lib/langgraph/nodes/frontend-router.ts docs/legacy/html-generation/implementations/

ls lib/langgraph/nodes/frontend-node-nextjs.ts 2>/dev/null && \
  mv lib/langgraph/nodes/frontend-node-nextjs.ts docs/legacy/html-generation/implementations/
```

---

#### Step 4.3: Create Legacy README

**CREATE:** `docs/legacy/html-generation/README.md`

```markdown
# HTML Generation Era - Archived

**Date Archived:** 2025-10-27
**Reason:** Superseded by Next.js AI Autonomy Architecture

---

## What Was This?

This folder contains archived code and documentation from the **HTML Generation Era** of the VB platform (pre-October 2025).

During this era, the system:
- Generated standalone HTML/CSS/JS files
- Used inline styles and scripts OR separated files
- Supported both single-page (hash routing) and multi-page (.html files)
- Required extensive routing instructions (718 lines)
- Had UX node prescribe component layouts

## Why Archived?

The architecture evolved to **Next.js AI Autonomy**:
- Always generates Next.js + TypeScript + Tailwind
- AI decides file structure autonomously (1-100 files)
- 2-phase generation (plan → generate)
- 29% token reduction
- Better code quality

## Files in This Archive

### Prompts
- `prompts/routing-instructions.ts` - 718 lines of HTML/React/Next.js/Expo routing
- `prompts/routing-html-only.ts` - HTML-specific routing

### Implementations
- `implementations/frontend-router.ts` - Routed between HTML and Next.js nodes
- `implementations/frontend-node-nextjs.ts` - Old separate Next.js generator

### Documentation
- `docs/SEPARATED_FILE_STRUCTURE.md` - HTML file separation architecture
- `docs/IMPLEMENTATION_COMPLETE.md` - HTML build process

## Current Architecture

See:
- [NEXTJS_AI_AUTONOMY_ARCHITECTURE.md](../../../NEXTJS_AI_AUTONOMY_ARCHITECTURE.md)
- [lib/langgraph/nodes/frontend-node.ts](../../../lib/langgraph/nodes/frontend-node.ts)
- [lib/prompts/routing-nextjs.ts](../../../lib/prompts/routing-nextjs.ts)

## Restoration

If you need to restore HTML generation for any reason:
```bash
# Restore routing instructions
cp docs/legacy/html-generation/prompts/routing-instructions.ts lib/prompts/

# Restore HTML-specific nodes
cp docs/legacy/html-generation/implementations/* lib/langgraph/nodes/
```

**Not recommended** - Next.js architecture is superior.
```

---

#### Step 4.4: Update Current Documentation

**UPDATE:** `SIMPLIFIED_PROMPTS_GUIDE.md`

Add at top:
```markdown
# SIMPLIFIED PROMPTS - QUICK REFERENCE GUIDE

> **Note:** This guide was created during the HTML generation era (2025-01).
> Philosophy still applies (trust-based approach), but examples updated for Next.js.
> For Next.js-specific guidance, see [NEXTJS_AI_AUTONOMY_ARCHITECTURE.md](NEXTJS_AI_AUTONOMY_ARCHITECTURE.md)

---
```

Update examples section:
```diff
- User: "contact page"
- ✅ Generate: Contact form ONLY (name, email, message, submit)
+ User: "contact page"
+ ✅ Generate: app/page.tsx with contact form component

- User: "landing page for my product"
- ✅ Generate: Hero section with product info, CTA button
+ User: "landing page for my product"
+ ✅ Generate: app/layout.tsx + app/page.tsx with hero section
```

---

**UPDATE:** `README_PROMPT_SIMPLIFICATION.md`

Add context section:
```markdown
## Historical Context

This simplification was done in two phases:

1. **Phase 1 (January 2025):** HTML generation prompt simplification
   - Reduced HTML generation from 8,251 to 1,500 tokens
   - Removed defensive prompting
   - Trust-based approach

2. **Phase 2 (October 2025):** Next.js AI Autonomy cleanup
   - Removed HTML-era prompts entirely
   - Always Next.js + TypeScript + Tailwind
   - AI decides file structure autonomously
   - Further 29% token reduction

See [NEXTJS_AI_AUTONOMY_ARCHITECTURE.md](NEXTJS_AI_AUTONOMY_ARCHITECTURE.md) for current architecture.
```

---

**MARK AS CURRENT:** `NEXTJS_AI_AUTONOMY_ARCHITECTURE.md`

Add at top:
```markdown
# Next.js AI Autonomy Architecture

**Status**: ✅ CURRENT ARCHITECTURE (as of 2025-10-27)
**Supersedes**: HTML generation approach (archived in docs/legacy/)

---
```

---

#### Step 4.5: Delete Obsolete Cleanup Docs

```bash
# These were planning docs for this cleanup - delete after implementation
rm PROMPT_CLEANUP_PLAN.md
rm PROMPT_CLEANUP_CHECKLIST.md
rm PROMPT_CLEANUP_VISUAL_SUMMARY.md

# Keep only this master plan until implementation is done
# After implementation, create PROMPT_CLEANUP_SUMMARY.md with actual results
```

---

### Phase 5: Testing & Validation (2-3 hours)

#### Step 5.1: Build Verification

```bash
# Clean build
rm -rf .next
npm run build

# Expected: No errors, no warnings about missing imports
```

**Fix any errors:**
- Missing imports: Update import paths
- Type errors: Adjust types if node schemas changed
- Unused variables: Remove or comment out

---

#### Step 5.2: Generation Tests

**Test 1: Simple App**
```
User request: "todo app"

Expected files:
- app/layout.tsx (root layout)
- app/page.tsx (home with todo list)
- app/globals.css (Tailwind imports)

Verify:
✓ Uses Server Components (no unnecessary 'use client')
✓ Proper Next.js structure
✓ Tailwind classes inline
✓ No HTML references

Measure:
- Token usage: Target ~5400, actual: _____
- Generation time: _____
- Errors: _____
```

**Test 2: Medium App**
```
User request: "blog with posts and comments"

Expected files:
- app/layout.tsx
- app/page.tsx (post feed)
- app/posts/[id]/page.tsx (single post)
- components/PostCard.tsx (if AI decides)
- app/api/posts/route.ts (if backend enabled)

Verify:
✓ Multi-file generation works
✓ Dynamic routes correct
✓ API routes if backend
✓ Proper Server/Client split

Measure:
- Token usage: Target ~11000, actual: _____
- Generation time: _____
- Errors: _____
```

**Test 3: Complex App**
```
User request: "SaaS dashboard with user management and analytics"

Expected files:
- app/layout.tsx (with auth provider)
- app/page.tsx (landing)
- app/dashboard/page.tsx (main dashboard)
- app/dashboard/users/page.tsx
- app/dashboard/analytics/page.tsx
- components/Sidebar.tsx
- components/AnalyticsChart.tsx (with 'use client')
- app/api/users/route.ts

Verify:
✓ Many files generated correctly
✓ Proper 'use client' on interactive components
✓ Server Components for data display
✓ Memory MCP context working

Measure:
- Token usage: Target ~21000, actual: _____
- Generation time: _____
- Errors: _____
```

---

#### Step 5.3: Token Usage Comparison

**Record Results:**
```
┌──────────────────────────────┬──────────┬──────────┬──────────┐
│ Test Case                    │  Before  │  After   │  Actual  │
├──────────────────────────────┼──────────┼──────────┼──────────┤
│ Simple (todo app)            │   7600   │   5400   │  ______  │
│ Medium (blog)                │  15000   │  11000   │  ______  │
│ Complex (SaaS dashboard)     │  30000   │  21000   │  ______  │
├──────────────────────────────┼──────────┼──────────┼──────────┤
│ Average Reduction            │    —     │    29%   │  ______% │
└──────────────────────────────┴──────────┴──────────┴──────────┘
```

**If actual is worse than target:** Investigate which prompts still have bloat

---

#### Step 5.4: Code Quality Validation

**Check 1: Server Component Defaults**
```bash
# Count 'use client' directives
grep -r "'use client'" .next/server/ | wc -l

# Should be minimal (only interactive components)
```

**Check 2: Next.js Conventions**
```bash
# Verify layout.tsx has <html> and <body>
grep -A 5 "export default function.*Layout" app/layout.tsx

# Verify page.tsx is default export
grep "export default" app/page.tsx
```

**Check 3: No Missing Imports**
```bash
# Build should catch this, but double-check
npm run build 2>&1 | grep "Module not found"
```

**Check 4: Proper Tailwind Usage**
```bash
# Should NOT have separate CSS files (except globals.css)
find app -name "*.css" -not -name "globals.css"

# Expected: Empty result
```

---

## 📊 SUCCESS METRICS

### Quantitative Targets

```
✓ Token usage reduced by ≥25% per generation
✓ Build passes without errors
✓ All test cases generate successfully
✓ No TypeScript errors
✓ No missing imports
```

### Qualitative Targets

```
✓ Prompts read clearly and focus on Next.js
✓ No HTML-specific language remains
✓ Single source of truth for all rules
✓ AI generates proper Server/Client Components
✓ Correct 'use client' directive usage
✓ Documentation is clear and up-to-date
```

---

## 🚨 ROLLBACK PLAN

If critical issues are found during testing:

### Quick Rollback via Git

```bash
# Check what changed
git status
git diff

# Revert all changes
git checkout main -- lib/prompts/
git checkout main -- lib/langgraph/nodes/

# Or revert specific files
git checkout main -- lib/prompts/routing-instructions.ts
git checkout main -- lib/prompts/node-prompts.ts
```

### Restore from Legacy

```bash
# If already committed, restore from legacy folder
cp docs/legacy/html-generation/prompts/routing-instructions.ts lib/prompts/
cp docs/legacy/html-generation/implementations/* lib/langgraph/nodes/

# Rebuild
npm run build
```

### Document Issues

Create `PROMPT_CLEANUP_ROLLBACK_REPORT.md`:
```markdown
# Rollback Report

**Date:** [DATE]
**Reason:** [Why we rolled back]

## Issues Found
1. [Issue 1]
2. [Issue 2]

## Root Cause
[Analysis of what went wrong]

## Next Steps
[How to fix before retrying]
```

---

## 📝 POST-IMPLEMENTATION CHECKLIST

After completing all phases:

### Create Summary Document

**FILE:** `PROMPT_CLEANUP_SUMMARY.md`

```markdown
# Prompt Cleanup - Implementation Summary

**Date Completed:** [DATE]
**Implementation Time:** [HOURS]
**Status:** ✅ COMPLETE

## Results

### Token Reduction Achieved
- Simple app: [BEFORE] → [AFTER] ([PERCENT]% reduction)
- Medium app: [BEFORE] → [AFTER] ([PERCENT]% reduction)
- Complex app: [BEFORE] → [AFTER] ([PERCENT]% reduction)

### Files Modified
- [COUNT] files modified
- [COUNT] files deleted/archived
- [COUNT] files created

### Code Quality
- Server Component usage: [PERCENTAGE]%
- Proper 'use client' usage: [YES/NO]
- Next.js conventions followed: [YES/NO]

## Lessons Learned
[What went well, what was challenging]

## Remaining Issues
[Any technical debt or follow-up tasks]

## Recommendations
[Suggestions for future maintenance]
```

---

### Update Architecture Docs

Mark as implemented:
```markdown
# NEXTJS_AI_AUTONOMY_ARCHITECTURE.md

**Status**: ✅ FULLY IMPLEMENTED & PROMPT CLEANUP COMPLETE
**Date**: 2025-10-27
**Cleanup Date**: [COMPLETION DATE]
```

---

### Clean Up Planning Docs

```bash
# After implementation summary is created, delete this file
rm "#notDone_PROMPT_CLEANUP_MASTER_PLAN.md"

# Move summary to docs
mv PROMPT_CLEANUP_SUMMARY.md docs/implementation/
```

---

## 🎯 FINAL DELIVERABLES

After successful implementation:

1. ✅ Token usage reduced by 25-30%
2. ✅ All HTML-era prompts removed or archived
3. ✅ UX node simplified (no component selection)
4. ✅ PM node simplified (no generationMode)
5. ✅ Frontend prompts modernized for Next.js
6. ✅ Precision rules consolidated
7. ✅ Routing instructions focused on Next.js only
8. ✅ Documentation updated and organized
9. ✅ Legacy files properly archived with context
10. ✅ All tests passing
11. ✅ Build succeeds without errors
12. ✅ Summary document created

---

## 📚 REFERENCE LINKS

- [NEXTJS_AI_AUTONOMY_ARCHITECTURE.md](NEXTJS_AI_AUTONOMY_ARCHITECTURE.md) - Target architecture
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - HTML prompt simplification (Phase 1)
- [SIMPLIFIED_PROMPTS_GUIDE.md](SIMPLIFIED_PROMPTS_GUIDE.md) - Trust-based approach philosophy

**Current Files:**
- [lib/prompts/node-prompts.ts](lib/prompts/node-prompts.ts) - Node prompt registry
- [lib/prompts/precision-rules.ts](lib/prompts/precision-rules.ts) - Core precision rules
- [lib/langgraph/nodes/frontend-node.ts](lib/langgraph/nodes/frontend-node.ts) - Unified frontend node
- [lib/langgraph/nodes/pm-node.ts](lib/langgraph/nodes/pm-node.ts) - Product manager node
- [lib/langgraph/nodes/ux-node.ts](lib/langgraph/nodes/ux-node.ts) - UX designer node

---

**Created:** 2025-10-27
**Updated:** 2025-10-27 (Added 8 critical inconsistencies from deep review)
**Status:** 📋 READY FOR IMPLEMENTATION
**Next Action:** Start with Phase 1 (Quick Wins)

---

## 🆕 ADDITIONAL INCONSISTENCIES (Deep Review - 2025-10-27)

After thoroughly reviewing all node implementations and prompts, I discovered **8 CRITICAL inconsistencies** that were missed in the initial analysis. These conflicts directly violate Next.js AI Autonomy principles.

### Updated Impact

**Original Token Savings:** 2,200 tokens per generation (29% reduction)
**Additional Savings:** 800 tokens per generation (10% additional)
**New Total Savings:** **3,000 tokens per generation (39% reduction)**

**Updated Annual Impact:** $440 → **$585** (for 10K generations)

---

### 🚨 INCONSISTENCY #1: PM Node Contradictory HTML Mode

**File:** `lib/langgraph/nodes/pm-node.ts` **Lines 87-93**

**Current Code:**
```typescript
// ✅ HARDCODED TO HTML MODE (Next.js will be explicit UI choice later)
const mode = 'html'; // Hardcoded to HTML for now
console.log(`[PM] Generation Mode: html (explicit - Next.js disabled)`);

// NOTE: generationMode removed - framework is always Next.js + TypeScript + Tailwind
// Frontend node will handle all generation with AI autonomy
const contextWithMode = context;
```

**Issue:**
- Code declares `mode = 'html'` and logs "Next.js disabled"
- Comment says "generationMode removed - framework is always Next.js"
- **COMPLETELY CONTRADICTORY!** Which is it: HTML or Next.js?

**Impact on AI:**
- Confuses AI about which framework to use
- Wastes tokens checking mode that doesn't affect anything
- Creates maintainability nightmare

**Fix:**
```typescript
// Framework is always Next.js + TypeScript + Tailwind
// Frontend AI decides file structure autonomously (1-100 files)
console.log(`[PM] Framework: Next.js (AI autonomy for file structure)`);
```

**Token Savings:** ~50 tokens per generation

---

### 🚨 INCONSISTENCY #2: PM Node Prompt - "pages" Array

**File:** `lib/prompts/node-prompts.ts` **Line 112**

**Current Code:**
```typescript
Return JSON:
{
  "appType": "landing-page|dashboard|form|...",
  "designStyle": "minimal|modern|vibrant|...",
  "features": [...],
  "pages": ["home", "about", "contact"],  // Only if user explicitly requests multiple pages
  "userFlows": [...]
}
```

**Issue:**
- PM node decides which "pages" to create
- Frontend AI should decide file structure (app/page.tsx, app/about/page.tsx)
- **Conflicts with Next.js AI Autonomy:** AI should plan routes autonomously, not follow preset array

**Impact on AI:**
- Limits Frontend AI to predefined pages
- Prevents autonomy (e.g., AI can't decide to add app/features/page.tsx)
- Next.js uses file-based routing, not page arrays

**Fix:**
```typescript
Return JSON:
{
  "appType": "landing-page|dashboard|form|...",
  "designStyle": "minimal|modern|vibrant|...",
  "features": [...],
  "userFlows": [...]
}

IMPORTANT:
- Framework is ALWAYS Next.js + TypeScript + Tailwind
- Frontend AI will autonomously decide file structure (1-100 files)
- Do NOT include "pages" array - Frontend AI decides page/route structure
- Focus on features and user flows only
```

**Token Savings:** ~100 tokens per generation

---

### 🚨 INCONSISTENCY #3: Backend Node - Pages Array Logic

**File:** `lib/langgraph/nodes/backend-node.ts` **Lines 18, 39-50, 97, 125, 173**

**Current Code:**
```typescript
// Line 18:
plan: 'I will design a database schema with 1-3 collections based on app complexity. Simple apps get 1 collection, moderate apps get 2, complex apps get 3. I will also determine if the app needs multiple pages based on explicit user requests (e.g., about, contact, pricing pages).'

// Lines 39-50:
Return JSON:
{
  "collections": [...],
  "pages": [
    {"name": "Home", "route": "/"}
  ]
}

RULES:
- Detect if multi-page needed ONLY if user explicitly requests pages like about, contact, pricing
- Simple tools/calculators → single page (pages: [])
- User explicitly mentions multiple pages → multi-page
```

**Issue:**
- Backend node deciding page structure (pages array)
- **Backend should only define PocketBase collections, not routes!**
- Next.js routing = file-based (app/about/page.tsx), not page arrays
- Violates separation of concerns (backend ≠ routing)

**Impact on AI:**
- Backend concerns mixed with frontend routing
- Duplicate logic (both PM and Backend deciding pages)
- Conflicts with Frontend AI autonomy

**Fix:**
```typescript
// Line 18:
plan: 'I will design a database schema with 1-3 collections based on app complexity. Simple apps get 1 collection, moderate apps get 2, complex apps get 3. I focus ONLY on data structure, not page routing.'

// Lines 39-50:
Return JSON:
{
  "collections": [{
    "name": "main_entity",
    "fields": [
      {"name": "field1", "type": "string"},
      {"name": "field2", "type": "text"}
    ]
  }]
}

RULES:
- Generate 1-3 collections based on app complexity (simple = 1, moderate = 2, complex = 3)
- 3-5 fields maximum per collection
- Collections should represent main entities (e.g., users/products, posts/comments, orders/items)
- Do NOT include "pages" array - Frontend AI handles routing

⚠️ OUTPUT FORMAT:
- Return ONLY pure JSON (no markdown, no explanations)
- Do NOT include "Based on..." or any narrative text
- Start with { and end with }
```

**Token Savings:** ~150 tokens per generation

---

### 🚨 INCONSISTENCY #4: UX Node Still Has Component Selection

**File:** `lib/prompts/node-prompts.ts` **Lines 160-218**

**Current Code:**
```typescript
systemPrompt: `You are a UX Designer selecting components based on user intent.

Product Plan: {{productPlan}}
User Request: "{{userDescription}}"
App Type: {{appType}}

Your task: Select ONLY components the user explicitly requested or clearly implied.

Return JSON:
{
  "navigation": "none|simple|full",
  "hero": "none|minimal-cta|centered|gradient|product-showcase",
  "features": "none|icon-grid|cards|timeline",
  "testimonials": "none|simple|carousel",
  "pricing": "none|simple|comparison-table",
  "contact": "none|simple-form|detailed-form",
  "footer": "none|minimal|full",
  "justification": "Explain WHY each non-none component was selected."
}

COMPONENT SELECTION GUIDE:

navigation:
- "none": Default for single pages, forms, landing pages without nav
- "simple": User mentions "navigation" or multiple pages/sections
- "full": User requests "full website" or "complete navigation"

hero:
- "none": Forms, dashboards, tools (no hero needed)
- "minimal-cta": Simple landing with just headline + CTA
- "centered": Standard landing page
- "gradient": User mentions "modern" or "vibrant"
- "product-showcase": User showcasing specific product/service

footer:
- "none": Default for tools, forms, single-purpose pages
- "minimal": User mentions "footer" or "copyright"
- "full": User requests "full website" or mentions footer links

... [more component guidelines]
`
```

**Issue:**
- UX node prescribing 7 specific component types (navigation, hero, features, testimonials, pricing, contact, footer)
- **This is HTML-era thinking!** When we built pages from predefined sections
- Frontend AI should autonomously choose from full Ant Design library (100+ components: Button, Card, Table, Form, Modal, Drawer, Tabs, Menu, etc.)

**Impact on AI:**
- Limits Frontend AI to 7 preset component types
- Prevents use of better components (e.g., Tabs instead of navigation, Drawer instead of hero)
- Reduces creativity and autonomy

**Fix:** *(Already documented in main plan, Phase 1 Step 1.2, but worth emphasizing)*

UX node should ONLY output:
- `designSystem`: "ant-design"
- `stylingConfig`: {colors, typography, animations, etc.}
- `notes`: "Any specific styling preferences"

Frontend AI gets full component library and decides autonomously.

**Token Savings:** ~500 tokens per generation *(already counted, but critical to emphasize)*

---

### 🚨 INCONSISTENCY #5: Frontend Node Prompt - HTML/CSS References

**File:** `lib/prompts/node-prompts.ts` **Lines 310-365**

**Current Code:**
```typescript
frontend: {
  nodeId: 'frontend',
  nodeName: 'Frontend Engineer',
  category: 'product',
  systemPrompt: `You are a Frontend Engineer writing HTML/CSS code.

Design System: {{designSystemPrompt}}

Routing Instructions: {{routingInstructions}}

Component Selection: {{componentSelection}}

Backend Config: {{backendConfig}}

Database Integration: {{databaseIntegration}}

Your task: Generate file-based HTML/CSS.

OUTPUT FORMAT (MANDATORY):
[
  {"path": "index.html", "content": "<!DOCTYPE html>..."},
  {"path": "styles.css", "content": "/* CSS */"}
]

${PRECISION_RULES}

CRITICAL RULES:
1. Return ONLY valid JSON array of file objects
2. Each file must have "path" and "content" keys
3. HTML files must be complete (<!DOCTYPE html> to </html>)
4. Use file-based architecture (separate files for multi-page)
5. If database exists, use window.db API (it's already injected)
6. Follow design system specifications exactly
7. Generate ONLY what user requested

DATABASE API (if backend exists):
- await window.db.get(collectionName) → Get all records
- await window.db.add(collectionName, data) → Add record
- await window.db.update(collectionName, id, updates) → Update record
- await window.db.delete(collectionName, id) → Delete record
- window.db.subscribe(collectionName, callback) → Real-time updates

Generate ONLY what the user requested. No extra features.`,
  estimatedTokens: 4000,
  enabled: true
},
```

**Issue:**
- Says "writing HTML/CSS code" but actual implementation (frontend-node.ts) generates Next.js/TypeScript
- Output format shows `index.html` and `styles.css` (not app/page.tsx, app/layout.tsx)
- Mentions `window.db` API (browser-only, conflicts with Server Components)
- **COMPLETELY MISALIGNED with actual implementation!**

**Impact on AI:**
- AI reads prompt saying "HTML/CSS" but implementation expects Next.js
- Confusing window.db vs fetch('/api/...') for data access
- Misleads AI about output format

**Fix:** *(Already documented in main plan, Phase 3 Step 3.1, but worth detailed emphasis)*

```typescript
frontend: {
  nodeId: 'frontend',
  nodeName: 'Frontend Engineer',
  category: 'product',
  systemPrompt: `You are a Frontend Engineer generating Next.js applications.

FRAMEWORK: Next.js 14+ (App Router) + TypeScript + Tailwind CSS

Your task: Generate Next.js files autonomously based on user requirements.

GENERATION PROCESS:
This prompt is used in 2 phases:

Phase 1: File Structure Planning
- AI plans which files to generate (1-100 files)
- Returns JSON array: [{"path": "app/page.tsx", "purpose": "Home page"}, ...]

Phase 2: File Generation (per-file)
- AI generates each file with full context
- Sees previously generated files
- Returns complete, production-ready code

TECH STACK:
- Framework: Next.js 14+ (App Router)
- Language: TypeScript (.tsx for components, .ts for modules)
- Styling: Tailwind CSS (inline classes only, no separate CSS files)
- Components: {{designSystem}} (Ant Design, etc.)

DATABASE ACCESS:
- Server Components: Use fetch('/api/[collection]') for database operations
- Client Components: Use 'use client' + fetch() or window.db if needed
- API routes in app/api/ handle PocketBase integration

${PRECISION_RULES}

Generate ONLY what user requested. Return complete, production-ready Next.js code.`,
  estimatedTokens: 3000, // Reduced from 4000
  enabled: true
},
```

**Token Savings:** ~1000 tokens per generation

---

### 🚨 INCONSISTENCY #6: Frontend Node - window.db in Prompt

**File:** `lib/prompts/node-prompts.ts` **Lines 345-350**

**Current Code:**
```typescript
DATABASE API (if backend exists):
- await window.db.get(collectionName) → Get all records
- await window.db.add(collectionName, data) → Add record
- await window.db.update(collectionName, id, updates) → Update record
- await window.db.delete(collectionName, id) → Delete record
- window.db.subscribe(collectionName, callback) → Real-time updates
```

**Issue:**
- `window.db` is browser-only API (requires `window` object)
- Next.js **Server Components can't use `window`** (server-side, no browser)
- Conflicts with Server Component best practices

**Impact on AI:**
- AI tries to use `window.db` in Server Components → build error
- Forces AI to add 'use client' unnecessarily
- Reduces performance (client-side data fetching instead of server-side)

**Correct Approach:**
1. **Server Components:** Use `fetch('/api/[collection]')` to call API routes
2. **Client Components:** Can use `window.db` IF needed for real-time subscriptions
3. **API Routes:** app/api/[collection]/route.ts handles PocketBase integration

**Fix:**
```typescript
DATABASE ACCESS (if backend exists):

Server Components (default, better performance):
- Use fetch('/api/[collection]') to call API routes
- Example: const users = await fetch('/api/users').then(r => r.json())

Client Components (for real-time updates):
- Add 'use client' directive
- Use window.db API for subscriptions:
  • await window.db.get(collectionName) → Get all records
  • await window.db.add(collectionName, data) → Add record
  • await window.db.update(collectionName, id, updates) → Update record
  • await window.db.delete(collectionName, id) → Delete record
  • window.db.subscribe(collectionName, callback) → Real-time updates

API Routes:
- Create app/api/[collection]/route.ts for database operations
- Export GET, POST, PUT, DELETE functions
- Integration with PocketBase injected automatically
```

**Token Savings:** ~100 tokens per generation

---

### 🚨 INCONSISTENCY #7: Editor Node - HTML File Defaults

**File:** `lib/langgraph/nodes/editor-node.ts` **Lines 63, 161-230, 333-342**

**Current Code:**
```typescript
// Line 63:
filename += '.html'; // Default to HTML

// Line 161-230:
function detectFileType(
  code: string,
  userRequest: string,
  defaultFilename: string = 'index.html'
): { filename: string; type: 'html' | 'css' | 'js' | 'json' | 'unknown' } {
  // ... extensive HTML detection logic

  // HTML detection (or default)
  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.includes('<html') ||
    trimmed.includes('<body') ||
    trimmed.includes('<div')
  ) {
    return { filename: defaultFilename, type: 'html' };
  }

  // Default to HTML if ambiguous
  return { filename: defaultFilename, type: 'html' };
}

// Line 333-342:
const { filename, type } = detectFileType(code, userRequest, 'index.html');

if (type === 'html') {
  if (!code.startsWith('<!DOCTYPE') && !code.startsWith('<html')) {
    finalContent = '<!DOCTYPE html>\n' + code;
    console.log('[Editor] Added HTML doctype');
  }
}
```

**Issue:**
- Editor node assumes HTML files as default (`index.html`, `.html` extension)
- Detection logic optimized for HTML (checks for `<!DOCTYPE>`, `<html>`, `<body>`)
- **Should assume Next.js .tsx files!**

**Impact on AI:**
- When editing Next.js apps, defaults to wrong file type
- AI must explicitly specify .tsx to avoid HTML detection
- Adds unnecessary HTML doctype to React components

**Fix:**
```typescript
// Line 63:
filename += '.tsx'; // Default to Next.js component

// Updated function:
function detectFileType(
  code: string,
  userRequest: string,
  defaultFilename: string = 'page.tsx'
): { filename: string; type: 'tsx' | 'ts' | 'css' | 'json' | 'unknown' } {
  const trimmed = code.trim();

  // Next.js detection (priority)
  if (
    trimmed.includes('export default') ||
    trimmed.includes('import') && trimmed.includes('from') ||
    trimmed.includes('interface') ||
    trimmed.includes('type ') ||
    trimmed.includes("'use client'")
  ) {
    // Check if it's a page, layout, or component
    if (userRequest.includes('page')) return { filename: 'page.tsx', type: 'tsx' };
    if (userRequest.includes('layout')) return { filename: 'layout.tsx', type: 'tsx' };
    if (userRequest.includes('component')) return { filename: 'Component.tsx', type: 'tsx' };
    return { filename: defaultFilename, type: 'tsx' };
  }

  // TypeScript module detection
  if (trimmed.includes('export') || trimmed.includes('function') || trimmed.includes('const')) {
    return { filename: defaultFilename.replace('.tsx', '.ts'), type: 'ts' };
  }

  // CSS detection
  if (trimmed.includes('@tailwind') || trimmed.startsWith('.') || trimmed.startsWith('#')) {
    return { filename: 'globals.css', type: 'css' };
  }

  // Default to TSX (Next.js component)
  return { filename: defaultFilename, type: 'tsx' };
}
```

**Token Savings:** ~50 tokens per generation

---

### 🚨 INCONSISTENCY #8: Context Analyzer - HTML File Detection

**File:** `lib/langgraph/nodes/context-analyzer-node.ts` **Lines 65, 299, 366-369**

**Current Code:**
```typescript
// Line 65:
const filenameMatch = request.match(/([a-z0-9-_]+\.(html|css|js))/);

// Line 299:
hasMultiPage: f.content.includes('href="') && f.content.includes('.html"')

// Lines 366-369:
"filesToModify": ["file1.html", "file2.html"],
"strategy": {
  {"file": "index.html", "sections": ["window.db code", "navigation links"]},
  {"file": "about.html", "sections": ["contact form handler"]}
}
```

**Issue:**
- Context analyzer looking for `.html`, `.css`, `.js` files
- Checking for multi-page by detecting `.html"` in links
- Example shows `index.html`, `about.html` (not app/page.tsx, app/about/page.tsx)
- **System generates .tsx files, not .html files!**

**Impact on AI:**
- Context analyzer can't properly analyze Next.js apps
- Misses files because it's looking for wrong extensions
- Provides wrong examples to AI

**Fix:**
```typescript
// Line 65:
const filenameMatch = request.match(/([a-z0-9-_/]+\.(tsx|ts|css|json))/);

// Line 299:
hasMultiPage: files.some(f => f.path.startsWith('app/') && f.path.includes('/page.tsx'))

// Lines 366-369:
"filesToModify": ["app/page.tsx", "app/about/page.tsx", "components/Header.tsx"],
"strategy": {
  {"file": "app/page.tsx", "sections": ["fetch('/api/users') call", "navigation menu"]},
  {"file": "app/about/page.tsx", "sections": ["contact form component"]},
  {"file": "components/Header.tsx", "sections": ["add new navigation link"]}
}
```

**Token Savings:** ~50 tokens per generation

---

## 📊 UPDATED TOKEN SAVINGS CALCULATION

### Before Cleanup:
```
Founder Node:     600 tokens
PM Node:          700 tokens (with generationMode + pages array)
UX Node:          800 tokens (with component selection)
Backend Node:     500 tokens (with pages array)
Frontend Planning: 1500 tokens (with HTML routing)
Frontend Per-File: 4000 tokens (with HTML instructions + window.db)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~8600 tokens per generation (simple app with 2 files)
```

### After Cleanup:
```
Founder Node:     600 tokens (no change)
PM Node:          450 tokens (-250: removed generationMode + pages)
UX Node:          300 tokens (-500: removed component selection)
Backend Node:     350 tokens (-150: removed pages array)
Frontend Planning: 1000 tokens (-500: removed HTML routing)
Frontend Per-File: 2900 tokens (-1100: removed HTML + fixed window.db)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~5600 tokens per generation (simple app with 2 files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAVINGS: ~3000 tokens per generation (35% reduction)
```

### Updated Annual Impact:
```
Before: 8600 tokens × 10K gens × $0.01/1K = $860/year
After:  5600 tokens × 10K gens × $0.01/1K = $560/year
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANNUAL SAVINGS: $300/year

+ Improved code quality (proper Server Components)
+ Better AI decision-making (full autonomy)
+ Fewer build errors (correct 'use client' usage)
+ Maintainability (single source of truth)
```

---

## 🎯 UPDATED IMPLEMENTATION PHASES

### Phase 1.5: Fix Critical Inconsistencies (NEW - 1 hour)

Add this phase BEFORE Phase 2 in the original plan:

#### Step 1.5.1: Fix PM Node Contradictory Logic
```typescript
// lib/langgraph/nodes/pm-node.ts:87-93
// DELETE lines 87-93 entirely, replace with:
console.log(`[PM] Framework: Next.js (AI autonomy for file structure)`);
```

#### Step 1.5.2: Remove "pages" from PM Node Output
```typescript
// lib/prompts/node-prompts.ts:112
// Remove "pages" key from JSON schema
// Add note: "Frontend AI decides file structure autonomously"
```

#### Step 1.5.3: Remove "pages" from Backend Node
```typescript
// lib/langgraph/nodes/backend-node.ts
// Lines 18, 39-50, 97, 125, 173
// Remove all references to "pages" array
// Update prompt: "Backend focuses ONLY on PocketBase collections"
```

#### Step 1.5.4: Fix Frontend Prompt HTML References
```typescript
// lib/prompts/node-prompts.ts:310-365
// Update systemPrompt: "HTML/CSS code" → "Next.js applications"
// Update output format: index.html → app/page.tsx
// Fix window.db instructions (server vs client)
```

#### Step 1.5.5: Fix Editor Node Defaults
```typescript
// lib/langgraph/nodes/editor-node.ts
// Change default: 'index.html' → 'page.tsx'
// Update detectFileType() to prioritize .tsx detection
```

#### Step 1.5.6: Fix Context Analyzer Detection
```typescript
// lib/langgraph/nodes/context-analyzer-node.ts
// Update file extension regex: .html|.css|.js → .tsx|.ts|.css
// Fix multi-page detection: .html" → /page.tsx
// Update examples to use Next.js file paths
```

**Token Savings from Phase 1.5:** ~800 tokens per generation

---

## 📋 UPDATED FINAL DELIVERABLES

After successful implementation:

1. ✅ Token usage reduced by **35%** (was 29%)
2. ✅ Annual cost savings: **$300** (was $220)
3. ✅ All HTML-era prompts removed or archived
4. ✅ PM node: No generationMode, no pages array
5. ✅ UX node: No component selection (AI autonomy)
6. ✅ Backend node: No pages array (focus on data only)
7. ✅ Frontend prompt: Pure Next.js (no HTML references)
8. ✅ window.db: Server vs Client guidance fixed
9. ✅ Editor defaults: .tsx instead of .html
10. ✅ Context analyzer: Next.js file detection
11. ✅ All 8 critical inconsistencies resolved
12. ✅ Documentation updated with findings
13. ✅ Legacy files properly archived with context
14. ✅ All tests passing
15. ✅ Build succeeds without errors
16. ✅ Summary document created

---

## 🔗 UPDATED REFERENCE LINKS

**New Inconsistencies Found:**
- PM Node (contradictory): lib/langgraph/nodes/pm-node.ts:87-93
- PM Prompt (pages array): lib/prompts/node-prompts.ts:112
- Backend (pages array): lib/langgraph/nodes/backend-node.ts:18,39-50,97,125,173
- UX Prompt (component selection): lib/prompts/node-prompts.ts:160-218
- Frontend Prompt (HTML refs): lib/prompts/node-prompts.ts:310-365
- Frontend (window.db): lib/prompts/node-prompts.ts:345-350
- Editor (HTML defaults): lib/langgraph/nodes/editor-node.ts:63,161-230,333-342
- Context Analyzer (HTML detection): lib/langgraph/nodes/context-analyzer-node.ts:65,299,366-369

**Updated Status:**
- Expected Savings: 29% → **35% token reduction**
- Annual Savings: $220 → **$300**
- Implementation Time: 8-12 hours → **9-13 hours** (added Phase 1.5)

---

**Updated:** 2025-10-27 (Deep review complete)
**Status:** 📋 READY FOR IMPLEMENTATION
**Next Action:** Start with Phase 1 (Quick Wins) → Phase 1.5 (Critical Inconsistencies) → Continue phases

