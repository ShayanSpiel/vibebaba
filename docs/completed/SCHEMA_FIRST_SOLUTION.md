# Schema-First Solution: TypeScript Contract Enforcement #done

**Date:** 2025-10-28
**Status:** ✅ IMPLEMENTED
**Philosophy:** Enable AI with FACTS (type contracts), not RULES

---

## The Problem We're Solving

### Current Flow (Broken)
```
Backend Node → Frontend Node
   ↓              ↓
Collections    Generate files independently
   ↓              ↓
Schema info    File 1: lib/types.ts
               File 2: components/TaskList.tsx
               File 3: app/api/tasks/route.ts

❌ Each file guesses independently
❌ Mismatched property names (completedAt vs completed)
❌ Mismatched imports (default vs named)
```

### New Flow (Schema-First)
```
Backend Node → Frontend Node
   ↓              ↓
Collections    PHASE 1: Generate lib/types.ts FIRST
   ↓              ↓
Schema info    Extract type definitions
               ↓
            PHASE 2: Generate all other files
               ↓
            Inject type definitions in context
               ↓
            ✅ All files use same property names
            ✅ All files see actual exports
```

---

## Architecture Overview

### Node Orchestration (No Changes)

The overall LangGraph flow remains the same:
```
Founder → PM → UX → Backend → Frontend → QA → DevOps
```

**What changes:** Only the INTERNAL workflow of the Frontend Node

### Frontend Node: Before vs After

#### **Before (Current)**
```typescript
// frontend-node.ts
async function frontendNode(state) {
  // Plan file structure
  const fileStructure = await planFileStructure(state);

  // Generate each file independently
  for (const filePlan of fileStructure) {
    const content = await generateFile(state, filePlan, previousFiles);
    files.push({ path: filePlan.path, content });
    previousFiles.push({ path, content, purpose });
  }

  return { files };
}
```

**Problem:** Each file generated with minimal context

#### **After (Schema-First)**
```typescript
// frontend-node.ts
async function frontendNode(state) {
  // Plan file structure
  const fileStructure = await planFileStructure(state);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 1: Generate types file FIRST
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const typesFilePlan = fileStructure.find(f => f.path === 'lib/types.ts');
  const typesContent = await generateFile(state, typesFilePlan, []);

  // Extract type definitions
  const typeDefinitions = extractTypeDefinitions(typesContent);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2: Generate other files with types
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const otherFiles = fileStructure.filter(f => f.path !== 'lib/types.ts');

  for (const filePlan of otherFiles) {
    const content = await generateFile(
      state,
      filePlan,
      previousFiles,
      typeDefinitions  // ← NEW: Inject type contract
    );
    files.push({ path: filePlan.path, content });
    previousFiles.push({ path, content, purpose });
  }

  return { files };
}
```

**Benefit:** All files see the same type contract

---

## Implementation Details

### 1. Type Extraction Utility

**File:** `lib/langgraph/utils/type-extractor.ts` (NEW)

**Purpose:** Extract TypeScript type/interface definitions from generated code

**Function Signature:**
```typescript
interface TypeDefinition {
  name: string;           // e.g., "Task"
  kind: 'interface' | 'type';
  properties: Array<{
    name: string;        // e.g., "completedAt"
    type: string;        // e.g., "string"
    optional: boolean;   // e.g., false
  }>;
  raw: string;          // Full definition for context
}

function extractTypeDefinitions(code: string): TypeDefinition[]
```

**Implementation:**
```typescript
export function extractTypeDefinitions(code: string): TypeDefinition[] {
  const definitions: TypeDefinition[] = [];

  // Regex patterns
  const interfacePattern = /export interface (\w+)\s*{([^}]+)}/g;
  const typePattern = /export type (\w+)\s*=\s*{([^}]+)}/g;

  // Extract interfaces
  let match;
  while ((match = interfacePattern.exec(code)) !== null) {
    const [raw, name, body] = match;
    const properties = parseProperties(body);
    definitions.push({ name, kind: 'interface', properties, raw });
  }

  // Extract types
  while ((match = typePattern.exec(code)) !== null) {
    const [raw, name, body] = match;
    const properties = parseProperties(body);
    definitions.push({ name, kind: 'type', properties, raw });
  }

  return definitions;
}

function parseProperties(body: string): Array<{name: string, type: string, optional: boolean}> {
  const properties = [];
  const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));

  for (const line of lines) {
    // Match: propertyName?: type
    const match = line.match(/(\w+)(\??):\s*([^;]+)/);
    if (match) {
      const [, name, optional, type] = match;
      properties.push({
        name,
        type: type.trim(),
        optional: optional === '?'
      });
    }
  }

  return properties;
}
```

**Example:**
```typescript
// Input
const code = `
export interface Task {
  id: string;
  title: string;
  completedAt: string;
  checklistId: string;
}

export interface Checklist {
  id: string;
  name: string;
  createdAt: string;
}
`;

// Output
extractTypeDefinitions(code);
// [
//   {
//     name: 'Task',
//     kind: 'interface',
//     properties: [
//       { name: 'id', type: 'string', optional: false },
//       { name: 'title', type: 'string', optional: false },
//       { name: 'completedAt', type: 'string', optional: false },
//       { name: 'checklistId', type: 'string', optional: false }
//     ],
//     raw: 'export interface Task { id: string; title: string; ... }'
//   },
//   { ... }
// ]
```

---

### 2. Export Extraction Utility

**File:** `lib/langgraph/utils/export-extractor.ts` (NEW)

**Purpose:** Extract export signatures from generated code

**Function Signature:**
```typescript
interface ExportInfo {
  path: string;
  exports: Array<{
    name: string;
    kind: 'default' | 'named';
    type?: string;  // For named exports
  }>;
  summary: string;  // Human-readable summary
}

function extractExports(path: string, code: string): ExportInfo
```

**Implementation:**
```typescript
export function extractExports(path: string, code: string): ExportInfo {
  const exports: Array<{ name: string; kind: 'default' | 'named'; type?: string }> = [];

  // Extract default export
  const defaultMatch = code.match(/export default (\w+)/);
  if (defaultMatch) {
    exports.push({ name: defaultMatch[1], kind: 'default' });
  }

  // Extract named exports
  const namedPattern = /export (?:const|function|interface|type|class) (\w+)/g;
  let match;
  while ((match = namedPattern.exec(code)) !== null) {
    exports.push({ name: match[1], kind: 'named' });
  }

  // Generate summary
  const defaultExp = exports.find(e => e.kind === 'default');
  const namedExps = exports.filter(e => e.kind === 'named');

  let summary = '';
  if (defaultExp) {
    summary = `default: ${defaultExp.name}`;
  }
  if (namedExps.length > 0) {
    const named = namedExps.map(e => e.name).join(', ');
    summary += summary ? `, named: { ${named} }` : `named: { ${named} }`;
  }

  return { path, exports, summary };
}
```

**Example:**
```typescript
// Input
const code = `
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://localhost:8090');
export default pb;
`;

// Output
extractExports('lib/db.ts', code);
// {
//   path: 'lib/db.ts',
//   exports: [{ name: 'pb', kind: 'default' }],
//   summary: 'default: pb'
// }
```

---

### 3. Enhanced Context Builder

**File:** `lib/langgraph/nodes/frontend-node.ts` (MODIFIED)

**Function:** `buildEnhancedContext()`

**Purpose:** Build rich context including type definitions and export signatures

```typescript
function buildEnhancedContext(
  previousFiles: Array<{ path: string; content: string; purpose: string }>,
  typeDefinitions: TypeDefinition[]
): string {
  let context = '';

  // TYPE DEFINITIONS SECTION (Most important - comes first)
  if (typeDefinitions.length > 0) {
    context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    context += '📋 AVAILABLE TYPES (Use these exact definitions)\n';
    context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    for (const type of typeDefinitions) {
      context += `${type.name} {\n`;
      for (const prop of type.properties) {
        context += `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}\n`;
      }
      context += `}\n\n`;

      // Add usage hint
      context += `Usage: import { ${type.name} } from '@/lib/types'\n`;
      context += `Example: const task: ${type.name} = { ... }\n\n`;
    }
  }

  // EXPORT SIGNATURES SECTION
  context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  context += '📦 PREVIOUSLY GENERATED FILES\n';
  context += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  for (const file of previousFiles) {
    const exportInfo = extractExports(file.path, file.content);

    context += `${file.path}\n`;
    context += `  Purpose: ${file.purpose}\n`;

    if (exportInfo.summary) {
      context += `  Exports: ${exportInfo.summary}\n`;

      // Add import examples
      const defaultExp = exportInfo.exports.find(e => e.kind === 'default');
      const namedExps = exportInfo.exports.filter(e => e.kind === 'named');

      if (defaultExp) {
        context += `  Import: import ${defaultExp.name} from '@/${file.path.replace(/\.tsx?$/, '')}'\n`;
      }
      if (namedExps.length > 0) {
        const names = namedExps.map(e => e.name).join(', ');
        context += `  Import: import { ${names} } from '@/${file.path.replace(/\.tsx?$/, '')}'\n`;
      }
    }
    context += '\n';
  }

  return context;
}
```

**Example Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 AVAILABLE TYPES (Use these exact definitions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task {
  id: string
  title: string
  completedAt: string
  checklistId: string
}

Usage: import { Task } from '@/lib/types'
Example: const task: Task = { ... }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 PREVIOUSLY GENERATED FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

lib/db.ts
  Purpose: PocketBase database client
  Exports: default: pb
  Import: import pb from '@/lib/db'

lib/types.ts
  Purpose: TypeScript type definitions
  Exports: named: { Task, Checklist }
  Import: import { Task, Checklist } from '@/lib/types'
```

---

### 4. Updated Frontend Node Workflow

**File:** `lib/langgraph/nodes/frontend-node.ts` (MODIFIED)

**Changes to `frontendNode()` function:**

```typescript
export async function frontendNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    console.log('[Frontend] 🚀 Starting unified frontend node (Next.js AI Autonomy)');
    console.log('[Frontend] 📊 Framework: Next.js + TypeScript + Tailwind (always)');
    console.log(`[Frontend] 📊 Complexity: ${state.context?.complexity || 'auto'}`);
    console.log(`[Frontend] 🗄️ Backend: ${state.backendConfig ? 'YES' : 'NO'}`);

    // ... existing setup code ...

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 1: AI PLANS FILE STRUCTURE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    emitProgress('frontend', state.projectId, 'Planning file structure...');
    const fileStructure = await planFileStructure(state);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 1.5: GENERATE TYPES FILE FIRST (NEW!)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('[Frontend] 📋 Phase 1.5: Generating types file first (Schema-First)...');

    const typesFilePlan = fileStructure.find(f => f.path === 'lib/types.ts');
    let typeDefinitions: TypeDefinition[] = [];
    const files: Array<{ path: string; content: string }> = [];
    const previousFiles: Array<{ path: string; content: string; purpose: string }> = [];

    if (typesFilePlan) {
      emitProgress('frontend', state.projectId, 'Generating types contract...');

      // Generate types file FIRST
      const typesContent = await generateFile(
        state,
        typesFilePlan,
        [],  // No previous files yet
        componentCatalog,
        pagePatterns
      );

      // Store types file
      files.push({ path: typesFilePlan.path, content: typesContent });
      previousFiles.push({
        path: typesFilePlan.path,
        content: typesContent,
        purpose: typesFilePlan.purpose
      });

      // Extract type definitions for other files to use
      typeDefinitions = extractTypeDefinitions(typesContent);

      console.log(`[Frontend] ✅ Types file generated: ${typeDefinitions.length} types extracted`);
      console.log(`[Frontend] 📋 Types: ${typeDefinitions.map(t => t.name).join(', ')}`);

      // Store in memory
      await storeFileInMemory(state.projectId, typesFilePlan.path, typesContent, typesFilePlan.purpose);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: GENERATE OTHER FILES WITH TYPE CONTRACT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('[Frontend] 🔄 Phase 2: Generating other files with type contract...');

    const otherFiles = fileStructure.filter(f => f.path !== 'lib/types.ts');

    for (let i = 0; i < otherFiles.length; i++) {
      const filePlan = otherFiles[i];
      const progress = Math.round(((i + 1) / fileStructure.length) * 100);

      emitProgress('frontend', state.projectId, `Generating ${filePlan.path} (${i + 2}/${fileStructure.length})...`);

      // Generate with enhanced context (includes type definitions)
      const content = await generateFileWithTypes(
        state,
        filePlan,
        previousFiles,
        typeDefinitions,  // ← NEW: Type contract injected
        componentCatalog,
        pagePatterns
      );

      // Add to files array
      files.push({ path: filePlan.path, content });

      // Add to context for next iteration
      previousFiles.push({ path: filePlan.path, content, purpose: filePlan.purpose });

      // Store in memory
      await storeFileInMemory(state.projectId, filePlan.path, content, filePlan.purpose);

      console.log(`[Frontend] ✅ Generated ${filePlan.path} (${content.length} chars) [${progress}%]`);
    }

    // ... rest of function unchanged ...
  } catch (error) {
    // ... error handling unchanged ...
  }
}
```

---

### 5. New Helper Function: `generateFileWithTypes()`

**File:** `lib/langgraph/nodes/frontend-node.ts` (NEW FUNCTION)

**Purpose:** Generate a file with type definitions injected into context

```typescript
async function generateFileWithTypes(
  state: AppGenState,
  filePlan: { path: string; purpose: string; dependencies?: string[] },
  previousFiles: Array<{ path: string; content: string; purpose: string }>,
  typeDefinitions: TypeDefinition[],
  componentCatalog: string,
  pagePatterns: string
): Promise<string> {
  console.log(`[Frontend] 📝 Generating: ${filePlan.path}`);

  const hasBackend = !!(state.backendConfig?.collections && state.backendConfig.collections.length > 0);
  const collections = hasBackend ? state.backendConfig!.collections! : [];

  // Build enhanced context with type definitions
  const enhancedContext = buildEnhancedContext(previousFiles, typeDefinitions);

  // ... rest of prompt building (same as before) ...

  const prompt = `Generate: ${filePlan.path}
Purpose: ${filePlan.purpose}

🚨 CRITICAL EXPORT RULE (Read First):
${filePlan.path.endsWith('.tsx') ? `
This is a React component - MUST use DEFAULT export:
export default function ComponentName() { ... }
` : filePlan.path === 'lib/db.ts' ? `
This is the database client - MUST use DEFAULT export:
export default pb
` : `
Use named exports for utilities/functions.
`}

Tech Stack:
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS

${enhancedContext}

${state.designSystemPrompt || 'Use clean, modern design with Tailwind CSS'}

${componentCatalog}

${filePlan.path.endsWith('.tsx') ? pagePatterns : ''}

Requirements:
- ${filePlan.path}: ${filePlan.purpose}
- Write COMPLETE code - no placeholders
- Use TypeScript with proper types
- Follow Next.js App Router conventions
- Use the exact property names from the type definitions above
- IMPORTANT: You can use external npm packages if needed

CRITICAL - Next.js App Router Rules:
- If uses React hooks → Add 'use client' as FIRST line
- If uses browser APIs → Add 'use client' as FIRST line
- If uses event handlers → Add 'use client' as FIRST line

IMPORTANT OUTPUT FORMAT:
- Return ONLY the RAW CODE for ${filePlan.path}
- DO NOT wrap in markdown code fences
- DO NOT include explanations`;

  const estimatedTokens = estimateTokens(prompt);

  const resultText = await generateWithLogging({
    prompt,
    projectId: state.projectId,
    nodeName: 'frontend',
    callType: 'generation',
    estimatedTokens,
    attempt: 1
  });

  // Clean up response
  let cleanedContent = resultText.trim();
  if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/\n?```$/,'');
  }

  // Auto-fix: Add 'use client' if needed
  if (filePlan.path.endsWith('.tsx') || filePlan.path.endsWith('.jsx')) {
    const needsUseClient =
      /import\s+{[^}]*(?:useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useLayoutEffect)[^}]*}\s+from\s+['"]react['"]/.test(cleanedContent) ||
      /(?:onClick|onChange|onSubmit|onInput|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave)\s*=/.test(cleanedContent) ||
      /(?:window\.|document\.|localStorage\.|sessionStorage\.)/.test(cleanedContent);

    const hasUseClient = /^['"]use client['"]/.test(cleanedContent);

    if (needsUseClient && !hasUseClient) {
      console.log(`[Frontend] Auto-adding 'use client' to ${filePlan.path}`);
      cleanedContent = `'use client'\n\n${cleanedContent}`;
    }
  }

  return cleanedContent;
}
```

---

## Philosophy Alignment

### ✅ Stays True to Your Philosophy

**ENABLING, not restricting:**
```
❌ OLD: "DON'T use task.completed, use task.completedAt"
✅ NEW: "Task type has these properties: id, title, completedAt, checklistId"
```

**SHORT prompts with FACTS:**
```
❌ OLD: 500-word essay on export rules
✅ NEW: "lib/db.ts exports: default pb → import pb from '@/lib/db'"
```

**POSITIVE guidance:**
```
❌ OLD: "NO mismatched imports!"
✅ NEW: "Available types: Task { ... }. Use these exact definitions."
```

### ⚖️ Balances Freedom with Necessity

**Where we add structure (NECESSARY):**
- ✅ Generate types FIRST (sequential, not parallel)
- ✅ Inject type definitions in context (facts, not rules)
- ✅ Extract export signatures (so AI sees them)

**Where AI keeps freedom:**
- ✅ How to implement components (styling, structure, logic)
- ✅ What npm packages to use
- ✅ How to organize code within files
- ✅ Design decisions (colors, spacing, layout)

---

## Token Usage Analysis

### Current Approach (Broken)
```
File 1: 1000 tokens (no context)
File 2: 1000 tokens (no context)
File 3: 1000 tokens (no context)
...
Build fails
AutoGen: 10,000 tokens (3 agents × multiple calls)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~20,000 tokens (with fixes)
```

### Schema-First Approach
```
Types file: 1000 tokens
File 1: 1200 tokens (+200 for type context)
File 2: 1200 tokens (+200 for type context)
File 3: 1200 tokens (+200 for type context)
...
Build succeeds ✅
AutoGen: 0 tokens (not needed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: ~12,000 tokens (no fixes needed)
```

**Net savings: 40% fewer tokens + guaranteed correctness**

---

## Implementation Checklist

### New Files to Create
- [ ] `lib/langgraph/utils/type-extractor.ts`
- [ ] `lib/langgraph/utils/export-extractor.ts`

### Files to Modify
- [ ] `lib/langgraph/nodes/frontend-node.ts`
  - Add `extractTypeDefinitions()` import
  - Add `extractExports()` import
  - Add `buildEnhancedContext()` function
  - Add `generateFileWithTypes()` function
  - Modify `frontendNode()` to use 2-phase approach

### Testing Plan
- [ ] Generate new project with backend
- [ ] Verify `lib/types.ts` generated first
- [ ] Verify other files use correct property names
- [ ] Verify imports match exports
- [ ] Build succeeds without TypeScript errors
- [ ] Deploy succeeds

---

## Expected Results

### Before (Current)
```
[Frontend] Generating lib/types.ts...
[Frontend] Generating app/api/tasks/route.ts...
❌ Error: 'pb' is not exported from '@/lib/db'

[Frontend] Generating components/TaskList.tsx...
❌ Error: Property 'completed' does not exist on type 'Task'
```

### After (Schema-First)
```
[Frontend] Phase 1.5: Generating types file first...
[Frontend] ✅ Types file generated: 2 types extracted
[Frontend] 📋 Types: Task, Checklist

[Frontend] Phase 2: Generating other files with type contract...
[Frontend] Generating app/api/tasks/route.ts...
  Context includes: lib/db.ts exports default pb
  Context includes: Task { id, title, completedAt, checklistId }
[Frontend] ✅ Generated (uses correct imports)

[Frontend] Generating components/TaskList.tsx...
  Context includes: Task { id, title, completedAt, checklistId }
[Frontend] ✅ Generated (uses task.completedAt, not task.completed)

✅ Build succeeds on first try
```

---

## Consistency with Other Nodes

### No Changes Required for:
- ✅ Founder Node (generates business context)
- ✅ PM Node (generates plan)
- ✅ UX Node (selects design system)
- ✅ Backend Node (generates schema + pages)
- ✅ QA Node (validates files)
- ✅ DevOps Node (deploys)

### Why?
Frontend Node is **self-contained** - it takes backend schema as input and generates files as output. The internal 2-phase approach doesn't affect the node's interface.

**Contract with other nodes (unchanged):**
- **Input:** `state.backendConfig` (collections, pages)
- **Output:** `{ files: Array<{path, content}> }`

---

## Risk Mitigation

### Risk 1: Types file generation fails
**Mitigation:** Fallback to simple types if extraction fails
```typescript
if (!typeDefinitions || typeDefinitions.length === 0) {
  console.warn('[Frontend] No types extracted, using basic context');
  // Continue with old approach for this file
}
```

### Risk 2: Type extraction misses some types
**Mitigation:** Graceful degradation - show what we found
```typescript
console.log(`[Frontend] Extracted ${typeDefinitions.length} types`);
// AI still gets partial context (better than none)
```

### Risk 3: Higher token usage per file
**Mitigation:** Overall savings from not needing AutoGen
- Cost: +200 tokens per file × 10 files = +2,000 tokens
- Savings: -10,000 tokens (no AutoGen debugging)
- **Net: -8,000 tokens (40% reduction)**

---

## Philosophy Statement

**This is not a compromise - this is alignment.**

We're not adding restrictive rules. We're giving the AI the **facts it needs** to make good decisions:

- ❌ "Don't use task.completed" ← Restrictive rule
- ✅ "Task has: id, title, completedAt" ← Enabling fact

We're not constraining creativity. We're defining the **contract** within which creativity happens:

- ✅ AI decides: How to style the component
- ✅ AI decides: What npm packages to use
- ✅ AI decides: How to structure the logic
- ❌ AI doesn't guess: What properties a type has

**SHORT prompts with COMPLETE context = Enabled AI**

---

**Status:** ✅ READY FOR IMPLEMENTATION
**Next Step:** Create utility files and update frontend-node.ts
