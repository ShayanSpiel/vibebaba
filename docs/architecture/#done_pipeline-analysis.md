# Complete App Generation Pipeline Analysis

## Executive Summary

The VB app generation system is a sophisticated 7-stage orchestration pipeline built on LangGraph that coordinates multiple AI agents to generate, validate, and deploy web applications. The entire workflow is controlled by a 10-minute timeout applied at the top level, covering all stages from initial analysis through deployment.

---

## Complete Pipeline Architecture

### Overall Flow with Timing

```
Total Budget: 10 minutes (600,000ms)
Entry Point: /api/langgraph/execute (POST)
              ↓
         [0-600s across all stages]
              ↓
    ┌─────────────────────────────────┐
    │  SEQUENTIAL PIPELINE             │
    └─────────────────────────────────┘
         Stage 1      Stage 2    Stage 3
           ↓            ↓          ↓
        FOUNDER  →    PM    →    UX
           ↓            ↓          ↓
        [Analysis] [Planning]  [Design]
              ↓
        ┌──────┴──────┐
        ↓             ↓
     FRONTEND    BACKEND      (PARALLEL)
        ↓             ↓
     [Gen Code]  [Schema]
        ↓             ↓
        └──────┬──────┘
               ↓
              QA           (Validation + AutoGen Debug)
               ↓
           DEVOPS         (Deployment)
               ↓
              END
```

---

## Stage 1: Founder Node (Requirements Analysis)

**Location:** `/lib/langgraph/nodes/founder-node.ts`
**API Execution:** Called via `/api/langgraph/execute`

### What it Does
- Analyzes user description to extract business requirements
- Identifies target audience
- Defines primary goal and success metrics
- Assesses complexity level (simple/moderate/complex)

### AI Agent Involved
- **Founder CEO Agent** - Uses `generateWithFallback(prompt)` to analyze requirements

### Actions Performed
1. Check memory service for previous context (if project already exists)
2. Build analysis prompt with user description
3. Call AI model to extract business context
4. Parse JSON response for:
   - `refinedRequirements` - Clarified user request
   - `businessContext` - Target audience, goals, success metrics
   - `complexity` - Assessed difficulty level

### Current Logging
```typescript
// Thinking process (emitted)
emitNodeStart('founder', state, {
  userInput: state.userDescription,
  interpretation: 'Analyzing the user request...',
  plan: 'I will extract key requirements...'
});

// Completion with details (emitted)
emitNodeComplete('founder', state, duration, {
  taskDescription: 'Analyzed user requirements and defined business context',
  success: true,
  output: {
    refinedRequirements: parsed.refinedRequirements,
    targetAudience: parsed.businessContext?.targetAudience,
    complexity: parsed.complexity
  },
  summary: `Successfully refined requirements...`
});

// Error handling (emitted)
emitNodeError('founder', error, state);
```

### AI Conversation Tracking
- ✅ Prompt sent to AI is logged in code
- ❌ No explicit conversation history stored
- ❌ No token usage tracking
- ❌ No model name recorded

### Error Handling
- Wrapped with `withErrorRecovery()` in workflow
- Falls back to default values if AI fails
- Errors collected in `state.errors` array

### State Output
```typescript
{
  refinedRequirements: string;
  businessContext?: {
    targetAudience: string;
    primaryGoal: string;
    successMetrics: string[];
  };
  stage: 'planning';
  completedNodes: [...state.completedNodes, 'founder'];
}
```

---

## Stage 2: Product Manager Node (Planning & Context)

**Location:** `/lib/langgraph/nodes/pm-node.ts`

### What it Does
- Analyzes app type (landing-page, dashboard, SaaS, ecommerce, etc.)
- Determines design style, visual tone, animation level
- Creates comprehensive product plan with features
- **Detects generation mode** (HTML vs Next.js)

### AI Agents Involved
1. **PM Analysis Agent** - Classifies app type and design preferences
2. **PM Planning Agent** - Creates product plan
3. **Mode Detection Logic** - Determines HTML vs Next.js generation

### Actions Performed
1. Call AI to analyze app classification
2. Parse app type, complexity, design style
3. **Call `detectGenerationMode()` or check for explicit mode request**
   - Analyzes description for indicators: "nextjs", "react", "typescript", database complexity
   - Returns mode: 'html' | 'nextjs' with confidence
4. Call AI to generate detailed product plan
5. Merge mode detection with context

### Current Logging
```typescript
// Thinking process
emitNodeStart('pm', state, {
  userInput: state.refinedRequirements || state.userDescription,
  interpretation: 'Analyzing requirements to determine app type...',
  plan: 'I will first classify the app type...'
});

// Mode detection logged
console.log(`[PM] Generation Mode: ${modeDetection.mode} (${modeDetection.confidence} confidence)`);
console.log(`[PM] Reasons: ${modeDetection.reasons.join(', ')}`);

// Completion
emitNodeComplete('pm', state, duration, {
  taskDescription: 'Created comprehensive product plan...',
  output: {
    appType: context.appType,
    complexity: context.complexity,
    designStyle: context.designStyle,
    featureCount
  },
  summary: `Created ${context.complexity} ${context.appType} plan...`
});
```

### State Output
```typescript
{
  plan: string;
  context?: {
    appType: string;
    complexity: string;
    designStyle: string;
    visualTone: string;
    animationLevel: string;
    targetAudience: string;
    generationMode?: 'html' | 'nextjs';  // ✅ ADDED
    generationConfidence?: 'high' | 'medium' | 'low';  // ✅ ADDED
  };
  stage: 'designing';
  completedNodes: [...state.completedNodes, 'pm'];
}
```

---

## Stage 3: UX Designer Node (Component Selection & Design System)

**Location:** `/lib/langgraph/nodes/ux-node.ts`

### What it Does
- Selects UI components based on explicit user requests
- Extracts styling preferences (colors, fonts, animations)
- Gathers background context via MCP (if enabled, with 2s timeout)
- Generates enhanced design system prompt

### AI Agents Involved
1. **UX Component Analyst** - Selects components
2. **Styling Extractor** - Parses styling preferences
3. **MCP Research Agent** - Gathers competitive context (OPTIONAL)

### Actions Performed

#### Step 1: Component Selection
- Call AI with explicit instruction: only select components user EXPLICITLY mentioned
- Default to "none" for navigation and footer unless mentioned
- Parse JSON response with selected components

#### Step 2: Styling Configuration
- Extract color theme, layout direction (LTR/RTL), typography, animations
- Check memory service for user's past preferences
- Merge with contextual defaults based on app type
- Support dark mode, color preferences, RTL languages

#### Step 3: MCP Research (Optional)
- Call `gatherBackgroundContext()` with 2-second timeout
- Race against timeout promise
- Enhanced with research about similar apps

#### Step 4: Design System Generation
- Call `getEnhancedDesignSystemPrompt()` with styling config
- Creates instructions for frontend generator

### Current Logging
```typescript
// Component selection
console.log('[UX] Extracting styling preferences...');

// Styling config
console.log('[UX] Styling config extracted:', JSON.stringify(stylingConfig, null, 2));

// MCP
console.log('[UX] MCP context gathered successfully');
console.log('[UX] MCP timed out, continuing without background context');

// Memory storage
console.log('[UX Node] Stored styling preferences in memory');
console.log('[UX Node] Stored component selection in memory');

// Completion
emitNodeComplete('ux', state, duration, {
  taskDescription: 'Selected UI components and created design system',
  output: {
    selectedComponents: selectedComponents,
    designStyle: state.context?.designStyle,
    hasMCPContext: !!backgroundContext
  },
  summary: `Selected ${selectedComponents.length} components...`
});
```

### State Output
```typescript
{
  componentNeeds?: {
    navigation: string;
    hero: string;
    features: string;
    emailCapture: string;
    pricing: string;
    cta: string;
    footer: string;
    buttons: string;
    justification: string;
  };
  stylingConfig?: StylingConfig;  // ✅ NEW
  designSystemPrompt?: string;
  backgroundContext?: any;
  stage: 'building';
  completedNodes: [...state.completedNodes, 'ux'];
}
```

---

## Stage 4A: Frontend Node (Code Generation) - PARALLEL with Backend

**Routing Location:** `/lib/langgraph/nodes/frontend-router.ts`
**HTML Implementation:** `/lib/langgraph/nodes/frontend-node.ts`
**Next.js Implementation:** `/lib/langgraph/nodes/frontend-node-nextjs.ts`

### Frontend Router
Routes to appropriate generator based on `state.context.generationMode`:
- `'html'` → `frontendNode()` (static HTML)
- `'nextjs'` → `frontendNodeNextJS()` (React/TypeScript app)

### Frontend Node (HTML Generator)

#### What it Does
- Generates complete HTML/CSS code
- Selects appropriate components from library
- Builds database integration scripts
- Handles single-page and multi-page apps
- Injects database API scripts

#### AI Agents Involved
- **Frontend HTML Engineer** - Generates complete HTML/CSS code

#### Actions Performed
1. Build component library section from selected components
2. Build database instructions (if backend config exists)
3. Determine output format (single/multi-page)
4. Build comprehensive code generation prompt with:
   - User requirements section
   - Design system prompt
   - Component library
   - Database instructions
   - Routing instructions
   - Output format specification
5. Call AI to generate code (with metadata)
6. Parse generated files (single or multi-file format)
7. **Inject database script** if backend collections exist
8. Store metadata in artifacts

#### Current Logging
```typescript
// Thinking process
emitNodeStart('frontend', state, {
  userInput: `${state.userDescription}\n\nComponents: ${JSON.stringify(state.componentNeeds)}`,
  interpretation: `Analyzing requirements to generate ${isMultiPage ? 'multi-page' : 'single-page'} HTML/CSS code...`,
  plan: `I will generate complete HTML/CSS code using the selected design system...`
});

// Code generation
console.log('[Frontend] Multi-file response: ${files.length} files');
console.log('[Frontend] Single file response');
console.log('[Frontend] Injecting database API script...');
console.log(`[Frontend] Database script injected into ${file.path}`);

// Completion
emitNodeComplete('frontend', state, duration, {
  taskDescription: 'Generated complete HTML/CSS code with components',
  output: {
    filesGenerated: files.length,
    fileNames: files.map(f => f.path),
    isMultiPage: isMultiPageOutput,
    databaseInjected: !!(state.backendConfig?.collections),
    model: aiResult.model,
    provider: aiResult.provider
  },
  summary: `Generated ${files.length} file(s): ${filesList}...`
});
```

### Frontend Node NextJS (Next.js Generator)

#### What it Does
- Generates complete Next.js 14+ application
- Uses TypeScript and React Server Components
- Tailwind CSS styling
- Ant Design components
- Proper file structure (app/ directory)

#### Actions Performed
1. Build component library section
2. Build database instructions for Next.js
3. Determine pages from backend config
4. Build user requirements for Next.js
5. Get Next.js-specific generation prompt
6. Call AI to generate all files
7. Parse generated files
8. Ensure required files exist (layout.ts, page.ts, etc.)

#### Logging
Similar to HTML generator, with Next.js-specific details

### State Output (Both Generators)
```typescript
{
  files?: Array<{ path: string; content: string }>;
  isMultiPage?: boolean;
  completedNodes: [...state.completedNodes, 'frontend'];
  artifacts: Map<string, any>;  // Contains codeGenMetadata
}
```

---

## Stage 4B: Backend Node (Schema Generation) - PARALLEL with Frontend

**Location:** `/lib/langgraph/nodes/backend-node.ts`

### What it Does
- Designs database schema
- Creates collection definitions (ONE main collection)
- Determines if multi-page is needed based on explicit user requests
- Handles field definitions

### AI Agent Involved
- **Backend Engineer Agent** - Designs database schema

### Actions Performed
1. Call AI with product plan and description
2. Instruct AI to create ONLY ONE collection (main entity)
3. Limit to 3-5 fields maximum
4. Detect multi-page needs (ONLY if explicitly requested)
5. Parse JSON response for collections and pages
6. Validate: ensure only one collection
7. Remove unnecessary fields from response

### Current Logging
```typescript
// Thinking process
emitNodeStart('backend', state, {
  userInput: state.plan || state.userDescription,
  interpretation: 'Analyzing the user requirements to determine if a database is needed...',
  plan: 'I will design a simple database schema with ONE main collection...'
});

// Parse validation
console.warn('[Backend] AI generated multiple collections, keeping only first');

// Completion
const collectionName = backendConfig.collections[0]?.name || 'items';
const fieldCount = backendConfig.collections[0]?.fields?.length || 0;
const pageCount = backendConfig.pages?.length || 0;

emitNodeComplete('backend', state, duration, {
  taskDescription: 'Designed database schema and page structure',
  output: {
    collectionName,
    fieldCount,
    fields: backendConfig.collections[0]?.fields?.map(...),
    isMultiPage: pageCount > 0,
    pageCount
  },
  summary: `Created database schema with collection "${collectionName}" (${fieldCount} fields)...`
});
```

### State Output
```typescript
{
  backendConfig?: {
    collections: Array<{
      name: string;
      fields: Array<{ name: string; type: string }>;
    }>;
    pages: Array<{ name: string; route: string }>;
  };
  completedNodes: [...state.completedNodes, 'backend'];
}
```

---

## Stage 5: QA Manager Node (Validation & AutoGen Debugging)

**Location:** `/lib/langgraph/nodes/qa-node.ts`
**AutoGen Debugger:** `/lib/langgraph/subgraphs/autogen-debugger.ts`

### What it Does
- Validates generated code (HTML syntax, accessibility, structure)
- **Triggers AutoGen debugging subgraph if errors found**
- Implements iterative fix-and-retry cycle
- Reports final validation status

### Validation Layer

#### Called Function
`validateCode(state.files, { autoFix: true, strict: false, isMultiPage })`

#### Validation Checks Include
- HTML structure validation
- Tag pairing and nesting
- Accessibility attributes
- CSS validity
- JavaScript syntax
- Multi-page structure (if applicable)
- Database integration checks

### AutoGen Debugging Subgraph

When validation errors are detected, QA node calls:
```typescript
const debugResult = await autoGenDebugWorkflow({
  files: state.files,
  validationResult,
  projectContext: { /* context info */ }
});
```

#### What AutoGen Debugger Does
Multi-agent debugging workflow with up to 2 attempts (reduced from 3 to prevent timeout):

**Attempt Loop Structure:**
```
For attempt = 1 to MAX_ATTEMPTS (2):
  ├─ Step 1: Code Analyst Agent
  │   ├─ Analyzes validation errors (limited to top 5)
  │   ├─ Identifies root causes
  │   └─ Proposes fix strategy
  │
  ├─ Step 2: Code Fixer Agent
  │   ├─ Generates complete fixed code
  │   ├─ Addresses all identified issues
  │   └─ Respects design system and project context
  │
  ├─ Step 2.5: File Operations Agent
  │   ├─ Proposes file operations (create, delete, rename, move)
  │   ├─ Validates operations for safety
  │   ├─ Executes safe operations
  │   └─ Logs all file manipulations
  │
  ├─ Step 3: Reviewer Agent
  │   ├─ Reviews generated fixes
  │   └─ Provides feedback
  │
  └─ Step 4: Re-Validate
      ├─ Run validation on fixed code
      ├─ Check if errors reduced
      └─ If errors = 0: SUCCESS, return result
```

#### Agent Collaboration Details

**Code Analyst Agent**
- Analyzes error list (limited to first 5 errors)
- Categorizes root causes
- Provides fix strategy

**Code Fixer Agent**
- Receives analyst report
- Regenerates complete files
- Respects design system prompt
- Considers backend configuration
- For multi-file: uses `---FILE:filename.html---` format
- For single-file: generates complete HTML

**File Operations Agent**
- Receives current files and fixed files
- Determines needed operations
- Returns JSON array: `[{type, path, newPath, content, reason}]`
- Proposes: create, delete, rename, move operations

**Reviewer Agent**
- Reviews both original analysis and fixes
- Provides brief feedback (1-2 sentences)
- Validates approach

#### File Operations Execution

Validated operations execute on files in memory:
- **Create**: Add new file if doesn't exist
- **Delete**: Remove file from list
- **Rename/Move**: Change file path
- **Safety checks**: Prevent duplicate creations, operations on non-existent files

Logged operations tracked in `allFileOperations` array.

#### Current Logging
```typescript
// Thinking process
emitNodeStart('qa', state, {
  userInput: `Validating ${state.files?.length || 0} file(s)`,
  interpretation: 'Analyzing generated code for errors...',
  plan: `I will run comprehensive validation checks...`
});

// Validation
console.log(`[QA] Validation: ${validationResult.report.errors.length} errors, ${validationResult.report.warnings.length} warnings`);

// AutoGen debug start
console.log('[QA] Errors detected, triggering AutoGen AI debugging engine...');

// Attempt progress
console.log(`[AutoGen Debugger] Attempt ${attempt}/${MAX_ATTEMPTS}`);
console.log(`[AutoGen Debugger] Attempt ${attempt} validation: ${newValidation.report.errors.length} errors`);

// File operations
console.log(`[AutoGen Debugger] ⚠️ Rejected ${rejected.length} unsafe file operations`);
console.log(`[AutoGen Debugger] ✅ Executing ${allowed.length} file operations`);
console.log(`[AutoGen Debugger] ✅ Created: ${op.path}`);
console.log(`[AutoGen Debugger] 🗑️ Deleted: ${op.path}`);
console.log(`[AutoGen Debugger] ✏️ Renamed: ${op.path} → ${op.newPath}`);

// Result
console.log(`[AutoGen Debugger] ✅ SUCCESS after ${attempt} attempts`);
console.log(`[AutoGen Debugger] ❌ FAILED after ${MAX_ATTEMPTS} attempts`);

// Collaboration
collaborationLog.push(`[Attempt ${attempt}] Analyst: ${analysis.substring(0, 200)}...`);
collaborationLog.push(`[Attempt ${attempt}] Fixer: Generated ${fixedFiles.length} fixed files`);
collaborationLog.push(`[Attempt ${attempt}] FileOps: Executed ${allowed.length} operations (${rejected.length} rejected)`);
collaborationLog.push(`[Attempt ${attempt}] Reviewer: ${review.substring(0, 200)}...`);

// QA Completion
emitNodeComplete('qa', state, duration, {
  taskDescription: 'Validated and debugged code using AutoGen AI system',
  success: debugResult.success,
  output: {
    initialErrors: validationResult.report.errors.length,
    finalErrors: debugResult.validationResult.report.errors.length,
    debugAttempts: debugResult.attempts,
    fixed: debugResult.validationResult.report.errors.length < validationResult.report.errors.length
  },
  summary: `Found ${validationResult.report.errors.length} error(s). AutoGen debugging ${debugResult.success ? 'succeeded' : 'failed'} after ${debugResult.attempts} attempt(s)...`
});
```

### State Output
```typescript
{
  files: debugResult.files,  // Fixed files
  validationResult: debugResult.validationResult,
  debugAttempts: debugResult.attempts,
  completedNodes: [...state.completedNodes, 'qa'],
  artifacts: {
    ...state.artifacts,
    debugMetadata: {
      attempts: debugResult.attempts,
      success: debugResult.success,
      finalErrors: debugResult.validationResult.report.errors.length,
      agentCollaboration: debugResult.collaborationLog,
      fileOperations: debugResult.fileOperations
    }
  },
  errors: debugResult.success
    ? state.errors
    : [...state.errors, { node: 'qa', message: `AutoGen debugging failed after ${debugResult.attempts} attempts` }]
}
```

---

## Stage 6: DevOps Engineer Node (Deployment)

**Location:** `/lib/langgraph/nodes/devops-node.ts`

### What it Does
- Updates/creates project record in PocketBase database
- Stores all generated files and configuration
- Generates preview URL
- Handles fallback creation if update fails

### Actions Performed
1. Attempt to update existing project in PocketBase
   - Uses mapping from localStorage or projectId directly
   - Updates with: stage, files, backendConfig, context, validationResult, debugAttempts
2. If update fails, attempt to create new project
3. Generate preview URL: `/project/{projectId}`
4. Return deployment information

### Current Logging
```typescript
// Thinking process
emitNodeStart('devops', state, {
  userInput: `Deploying ${state.files?.length || 0} file(s) for project ${state.projectId}`,
  interpretation: 'Preparing to store the generated application files...',
  plan: 'I will update the project record in PocketBase...'
});

// Database operations
console.log('[DevOps] ✅ Project updated in PocketBase with', state.files.length, 'files');
console.error('[DevOps] Failed to update project, attempting to create:', updateError.message);
console.log('[DevOps] ✅ Project created in PocketBase');
console.error('[DevOps] Failed to create project:', createError);

// Completion
emitNodeComplete('devops', state, duration, {
  taskDescription: 'Deployed application and generated preview',
  success: true,
  output: {
    filesDeployed: state.files?.length || 0,
    previewUrl,
    hasDatabase: !!(state.backendConfig?.collections),
    validationStatus: state.validationResult?.valid ? 'valid' : 'has-errors'
  },
  summary: `✅ Deployment successful! ${state.files?.length || 0} file(s) deployed...`
});
```

### State Output
```typescript
{
  deployUrl: previewUrl,  // '/project/{projectId}'
  stage: 'complete',
  completedNodes: [...state.completedNodes, 'devops']
}
```

---

## Entry Point: /api/langgraph/execute

**Location:** `/app/api/langgraph/execute/route.ts`

### Request Processing
```typescript
POST /api/langgraph/execute
Body: { description: string, projectId?: string }
Returns: Full workflow result with all artifacts
```

### Execution Flow
1. **Authentication**: Verify user via `getAuthenticatedUser()`
2. **Request validation**: Extract and validate description
3. **Token management**:
   - Estimate tokens: `Math.ceil(description.length * 4)`
   - Check daily token reset
   - Verify sufficient credits available
4. **Project setup**: Generate projectId or use provided one
5. **Initial state creation** with stage: 'initial'
6. **Workflow execution**:
   ```typescript
   const workflow = createAppGenWorkflow();
   const result = workflow.invoke(initialState, { recursionLimit: 30 });
   ```
7. **Timeout handling**: 
   - Wraps workflow in Promise.race with 10-minute timeout
   - Timeout error message: "Workflow timeout after 10 minutes"
8. **Token consumption**: `consumeTokens(user.id, estimatedTokens)`
9. **Response construction**: Returns complete results or partial results on error

### Logging at Execute Level
```typescript
console.log('[LangGraph] Starting FULL pipeline execution...');
console.log(`[LangGraph] Project ID: ${projectId}`);
emitWorkflowStart(projectId, description);

// ... workflow execution ...

console.log('[LangGraph] ✅ Pipeline COMPLETE!');
console.log(`[LangGraph] Flow: ${result.completedNodes.join(' → ')}`);
console.log(`[LangGraph] Files: ${result.files?.length || 0}`);
console.log(`[LangGraph] Debug attempts: ${result.debugAttempts || 0}`);
console.log(`[LangGraph] Deploy URL: ${result.deployUrl}`);

emitWorkflowComplete(result, totalDuration);
```

---

## Real-Time Event Streaming

**Location:** `/app/api/langgraph/stream/route.ts`

### Server-Sent Events (SSE) Endpoint
```
GET /api/langgraph/stream?projectId={projectId}
```

### Event Types Streamed
1. **connected** - Initial connection confirmation
2. **node:start** - Node begins (with thinkingProcess)
3. **node:complete** - Node finishes (with taskDetails and duration)
4. **node:error** - Node encounters error
5. **workflow:complete** - Entire workflow finishes

### Events Include
- `nodeName`: Which node is executing
- `projectId`: Project ID
- `stage`: Current stage
- `duration`: Execution time (milliseconds)
- `timestamp`: ISO timestamp
- `thinkingProcess`: User input, interpretation, plan (for start events)
- `taskDetails`: Task description, success flag, output, summary (for complete events)
- `message`: Human-readable message

---

## AI Conversation & Model Tracking

### Current AI Integration
**Primary Location:** `/lib/ai.ts`

#### Available Model Tiers
1. **Gemini Models** (Primary, Google AI):
   - Tier 1: gemini-2.5-flash, gemini-2.5-pro
   - Tier 2: gemini-2.0-flash
   - Tier 3: gemini-1.5-flash, gemini-1.5-pro
   - Tier 4: gemini-1.0-pro

2. **OpenRouter FREE Models** (52+ models, fallback):
   - DeepSeek V3.1, Qwen 3, Llama 3.3, etc.

#### Function Signature
```typescript
generateWithFallback(prompt: string): Promise<string>;
generateWithFallback(prompt: string, returnMetadata: true): Promise<AIGenerationResult>;

interface AIGenerationResult {
  text: string;
  model: string;
  provider: "claude" | "gemini" | "openrouter";
  attemptsLog: string[];  // All attempts made
}
```

#### Fallback Strategy
- Tries all Gemini models in priority order
- Falls back to OpenRouter free models if all Gemini fail
- Returns attempts log showing which models were tried
- Logs each attempt to console

#### Conversation Tracking Issues
- ❌ No persistent conversation history per project
- ❌ No per-node AI interaction log
- ❌ Model selection not fully logged in events
- ❌ Token usage not tracked
- ✅ Model metadata returned in AIGenerationResult
- ✅ Attempts log shows fallback sequence

### Memory Service for Context

**Location:** `/lib/services/memory-service.ts`

#### What's Tracked
1. **User Preferences**:
   - designStyle
   - colorScheme
   - prefersDarkMode
   - favoriteComponents
   - learningNotes

2. **Project Context**:
   - projectId, description
   - plan, designDecisions
   - componentChoices, technicalStack
   - timestamp

3. **Conversation Messages** (interface defined but not heavily used):
   - role, content, timestamp, metadata

#### Storage Mechanism
- Uses MCP Memory Server (Model Context Protocol)
- Creates entities: `user_{userId}`, `project_{projectId}`
- Stores observations as string key-value pairs

#### Current Memory Usage in Pipeline
1. **Founder Node**: Check previous context via `getProjectContext()`
2. **UX Node**: Retrieve user preferences, store styling choices
3. Stored back to memory at end of UX node execution

---

## 10-Minute Timeout Coverage

### Timeout Application
**Location:** `/app/api/langgraph/execute/route.ts:78-92`

```typescript
const WORKFLOW_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const workflowPromise = workflow.invoke(initialState as any, {
  recursionLimit: 30
}) as unknown as Promise<AppGenState>;

const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('Workflow timeout after 10 minutes')), WORKFLOW_TIMEOUT)
);

result = await Promise.race([workflowPromise, timeoutPromise]);
```

### What's Covered
- ✅ **Stage 1 (Founder)**: Requirement analysis
- ✅ **Stage 2 (PM)**: Planning and mode detection
- ✅ **Stage 3 (UX)**: Component selection and design system (including 2s MCP timeout)
- ✅ **Stage 4A (Frontend)**: HTML or Next.js code generation
- ✅ **Stage 4B (Backend)**: Schema generation (parallel)
- ✅ **Stage 5 (QA)**: Validation and AutoGen debugging (up to 2 attempts)
- ✅ **Stage 6 (DevOps)**: Deployment and database update

### Timeout Behavior
- **If exceeded**: Workflow terminates, error returned to client
- **Error message**: "Workflow timeout after 10 minutes"
- **Partial results**: Attempts to return what was completed before timeout
- **No resumption**: Full restart required (no checkpoint recovery on timeout)

### Critical Timeout Bottlenecks
1. **AutoGen Debugging** (Stage 5):
   - Max 2 attempts (reduced from 3 to save time)
   - Each attempt includes: analysis (AI), fixing (AI), file ops, review (AI), validation
   - Each AI call can take 10-30 seconds depending on code size and model
   - With 2 attempts: ~40-60s for worst case

2. **Frontend Code Generation** (Stage 4A):
   - Can be 20-40s depending on complexity and model
   - Multi-page apps take longer
   - Design system integration adds overhead

3. **MCP Research** (Stage 3, UX):
   - Explicitly timeouts at 2 seconds to not block other stages
   - Fallback continues without context if timeout

---

## State Management Across Stages

### AppGenState Interface
**Location:** `/lib/langgraph/types.ts`

```typescript
interface AppGenState {
  // User Input (Stage 1)
  userDescription: string;
  userId: string;
  projectId: string;

  // Founder Output (Stage 1)
  refinedRequirements?: string;
  businessContext?: {
    targetAudience: string;
    primaryGoal: string;
    successMetrics: string[];
  };

  // PM Output (Stage 2)
  plan?: string;
  context?: {
    appType: string;
    complexity: string;
    designStyle: string;
    visualTone: string;
    animationLevel: string;
    targetAudience: string;
    generationMode?: 'html' | 'nextjs';
    generationConfidence?: 'high' | 'medium' | 'low';
  };

  // UX Output (Stage 3)
  componentNeeds?: { /* component selections */ };
  stylingConfig?: StylingConfig;
  designSystemPrompt?: string;
  backgroundContext?: any;
  examples?: any[];

  // Backend Output (Stage 4B, parallel)
  backendConfig?: {
    collections: Array<{ name: string; fields: Array<{ name: string; type: string }> }>;
    pages: Array<{ name: string; route: string }>;
  };

  // Frontend Output (Stage 4A, parallel)
  files?: Array<{ path: string; content: string }>;
  isMultiPage?: boolean;

  // QA Output (Stage 5)
  validationResult?: {
    valid: boolean;
    errors: any[];
    warnings: any[];
    fixed: string[];
    report: { errors: any[]; warnings: any[] };
    files: Array<{ path: string; content: string }>;
  };
  debugAttempts?: number;

  // DevOps Output (Stage 6)
  deployUrl?: string;

  // Workflow Metadata
  stage: string;
  completedNodes: string[];
  errors: any[];
  artifacts: Map<string, any>;
}
```

### State Flow Between Stages
```
Founder Output → PM Input
PM Output → UX Input
UX Output → Frontend & Backend Inputs (parallel)
Frontend & Backend Outputs → QA Input
QA Output → DevOps Input
DevOps Output → Final Result
```

### Channel Management (LangGraph)
Each field has a merge strategy:
- **Replace strategy**: Right value overrides left (most fields)
- **Append strategy**: Arrays accumulate (errors, completedNodes)
- **Map strategy**: Maps merge (artifacts)

---

## Error Handling & Recovery

### Node-Level Error Handling

**Wrapper Function:**
```typescript
function withErrorRecovery<T extends AppGenState>(
  nodeName: string,
  nodeFunc: (state: T) => Promise<Partial<T>>
) {
  return async (state: T): Promise<Partial<T>> => {
    try {
      return await nodeFunc(state);
    } catch (error: any) {
      console.error(`[Workflow] Error in ${nodeName} node:`, error);
      
      return {
        errors: [
          ...(state.errors || []),
          {
            node: nodeName,
            message: error.message || 'Unknown error',
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        ],
        completedNodes: [...(state.completedNodes || []), nodeName]
      } as Partial<T>;
    }
  };
}
```

### Recovery Strategies by Stage

1. **Founder**: Falls back to basic analysis
2. **PM**: Falls back to default plan and context
3. **UX**: Falls back to minimal components and default styling
4. **Frontend**: Falls back to basic HTML structure
5. **Backend**: Falls back to single generic collection
6. **QA**: If AutoGen fails after 2 attempts, returns code as-is with errors noted
7. **DevOps**: If PocketBase update fails, attempts create operation

---

## Progress Reporting to User

### Via Real-Time Events (SSE)

The `/api/langgraph/stream?projectId=X` endpoint provides:
1. Node start events with thinking process
2. Node completion events with task details and duration
3. Error events with stack traces
4. Workflow completion with final metrics

**Client Integration Example:**
```typescript
const eventSource = new EventSource(`/api/langgraph/stream?projectId=${projectId}`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'node:start') {
    console.log(`Starting ${data.nodeName}...`);
    console.log(`Thinking: ${data.thinkingProcess.interpretation}`);
  }
  
  if (data.type === 'node:complete') {
    console.log(`Completed ${data.nodeName} in ${data.duration}ms`);
    console.log(`Summary: ${data.taskDetails.summary}`);
  }
};
```

### Current Reporting Gaps
- ❌ No progress percentage
- ❌ No ETA calculation
- ❌ No stage-by-stage detailed logs stored persistently
- ❌ No token usage breakdown per stage
- ✅ Real-time event streaming
- ✅ Task-level summaries
- ✅ Completion summaries with file counts and debug attempts

---

## Complete Execution Sequence

```
1. POST /api/langgraph/execute
   │
   ├─ Authenticate user
   ├─ Validate credits
   ├─ Create initial state with projectId
   └─ Start 10-minute timeout countdown

2. FOUNDER NODE (Requirement Analysis)
   ├─ Emit node:start with thinking process
   ├─ Check memory for previous context
   ├─ Call AI: analyzeRequirements(description)
   ├─ Parse: refinedRequirements, businessContext
   ├─ Store in memory
   ├─ Emit node:complete with output and summary
   └─ Update state.stage = 'planning'

3. PM NODE (Planning & Mode Detection)
   ├─ Emit node:start
   ├─ Call AI: classifyApp(requirements)
   ├─ Call detectGenerationMode() for HTML vs Next.js
   ├─ Call AI: generatePlan(requirements)
   ├─ Emit node:complete
   └─ Update state.stage = 'designing'

4. UX NODE (Component Selection & Design System)
   ├─ Emit node:start
   ├─ Call AI: selectComponents(requirements, appType)
   ├─ Call AI: extractStyling(description, context)
   ├─ Retrieve user preferences from memory
   ├─ Race MCP research against 2-second timeout
   ├─ Generate design system prompt
   ├─ Store preferences in memory
   ├─ Emit node:complete
   └─ Update state.stage = 'building'

5. FRONTEND NODE (Code Generation) [PARALLEL]
   ├─ Route based on generationMode:
   │  ├─ If 'html': frontendNode(state)
   │  │  ├─ Emit node:start
   │  │  ├─ Build component library
   │  │  ├─ Call AI: generateHTML(requirements, components, designSystem)
   │  │  ├─ Parse files (single or multi-file format)
   │  │  ├─ Inject database scripts
   │  │  ├─ Emit node:complete
   │  │  └─ Return files
   │  │
   │  └─ If 'nextjs': frontendNodeNextJS(state)
   │     ├─ Emit node:start
   │     ├─ Call AI: generateNextJS(requirements, pages, designSystem)
   │     ├─ Parse Next.js file structure
   │     ├─ Ensure required files exist
   │     ├─ Emit node:complete
   │     └─ Return files
   │
   └─ Store codeGenMetadata in artifacts

6. BACKEND NODE (Schema Generation) [PARALLEL]
   ├─ Emit node:start
   ├─ Call AI: designSchema(plan, description)
   ├─ Parse: collections (enforced: max 1), pages
   ├─ Validate single collection
   ├─ Emit node:complete
   └─ Return backendConfig

7. QA NODE (Validation & Debugging)
   ├─ Emit node:start
   ├─ Call validateCode(files, options)
   │
   ├─ IF errors > 0:
   │  └─ Call autoGenDebugWorkflow():
   │     │
   │     └─ FOR attempt = 1 to 2:
   │        ├─ Emit: Code Analyst analyzes errors
   │        ├─ Emit: Code Fixer generates corrected code
   │        ├─ Emit: File Operations Agent proposes operations
   │        ├─ Execute validated file operations
   │        ├─ Emit: Reviewer reviews fixes
   │        ├─ Re-validate fixed code
   │        │
   │        └─ IF errors = 0:
   │           └─ Return success, files, attempts
   │
   ├─ Emit node:complete with validation summary
   ├─ Store debugMetadata in artifacts
   └─ Return validationResult, debugAttempts

8. DEVOPS NODE (Deployment)
   ├─ Emit node:start
   ├─ Update or create project in PocketBase
   │  └─ Store: files, backendConfig, validationResult, debugAttempts
   ├─ Generate preview URL: /project/{projectId}
   ├─ Emit node:complete
   └─ Return deployUrl

9. Response to Client
   └─ Return complete result:
      {
        success: boolean,
        projectId: string,
        deployUrl: string,
        files: Array<{path, content}>,
        plan: string,
        context: object,
        backendConfig: object,
        validationResult: object,
        debugAttempts: number,
        completedNodes: string[],
        metadata: {
          stage: string,
          artifacts: object,
          errors: array,
          duration: milliseconds
        }
      }

10. Emit workflow:complete event
    └─ SSE stream closes after 1 second delay
```

---

## Key Metrics & Performance Data

### What's Currently Tracked
- ✅ Node execution duration (ms)
- ✅ Files generated count
- ✅ Debug attempts count
- ✅ Validation error count
- ✅ Model used for each generation
- ✅ Code generation provider (Gemini, OpenRouter)
- ✅ Model fallback attempts log

### What's Missing
- ❌ Token usage per stage
- ❌ Token usage per API call
- ❌ AI model switching history
- ❌ Per-node error categories
- ❌ Component selection analytics
- ❌ Backend schema complexity scoring
- ❌ Timeout avoidance metrics
- ❌ User wait time per stage (from client perspective)
- ❌ Cost analysis per generation

---

## Summary: Complete Logging Points

### Stage 1: Founder Node
- `emitNodeStart()` - Thinking process
- `generateWithFallback()` - AI call with attempts log
- `emitNodeComplete()` - Task details, output, summary
- `getMemoryService()` - Context retrieval
- `addObservation()` - Memory storage
- `emitNodeError()` - Error handling

### Stage 2: PM Node
- `emitNodeStart()` - Thinking process
- `generateWithFallback()` - AI analysis and planning calls (2 AI calls)
- `console.log()` - Mode detection details
- `detectGenerationMode()` - Mode and confidence
- `emitNodeComplete()` - Task details, feature count, mode info
- `emitNodeError()` - Error handling

### Stage 3: UX Node
- `emitNodeStart()` - Thinking process
- `generateWithFallback()` - Component selection AI call
- `console.log()` - Styling extraction
- `generateWithFallback()` - Styling extraction AI call
- `getMemoryService()` - User preferences retrieval
- `gatherBackgroundContext()` - Optional MCP research with 2s timeout
- `getEnhancedDesignSystemPrompt()` - Design system generation
- `storeUserPreference()` - Styling preferences storage
- `addObservation()` - Component selection storage
- `emitNodeComplete()` - Task details, component list, MCP context flag
- `emitNodeError()` - Error handling

### Stage 4A: Frontend Node (HTML or Next.js)
- `emitNodeStart()` - Thinking process
- `buildComponentLibraryFromNeeds()` - Component library construction
- `generateWithFallback()` - Code generation AI call (with metadata)
- `console.log()` - File parsing details (single vs multi)
- `injectDatabaseScript()` - Database integration
- `emitNodeComplete()` - Task details, file count, database injection flag, model/provider
- `emitNodeError()` - Error handling
- Artifacts storage: `codeGenMetadata`

### Stage 4B: Backend Node (parallel)
- `emitNodeStart()` - Thinking process
- `generateWithFallback()` - Schema design AI call
- `console.warn()` - Validation warnings (multiple collections)
- `console.error()` - JSON parse errors
- `emitNodeComplete()` - Task details, collection name, field count, pages
- `emitNodeError()` - Error handling

### Stage 5: QA Node
- `emitNodeStart()` - Thinking process
- `validateCode()` - Validation execution with error/warning counts
- `console.log()` - Validation result
- **If errors detected:**
  - `autoGenDebugWorkflow()` initialization
  - Per attempt:
    - `generateWithFallback()` - Code analyst AI call
    - `generateWithFallback()` - Code fixer AI call
    - `generateWithFallback()` - File operations agent AI call
    - `filterOperations()` - File operation validation
    - `console.log()` - File operation execution (create, delete, rename)
    - `logFileOperation()` - File operation logging
    - `generateWithFallback()` - Reviewer agent AI call
    - `validateCode()` - Re-validation
  - `collaborationLog` accumulation
- `emitNodeComplete()` - Task details, error reduction, attempt count
- `emitNodeError()` - Error handling
- Artifacts storage: `debugMetadata` with collaboration log and file operations

### Stage 6: DevOps Node
- `emitNodeStart()` - Thinking process
- `pb.collection('projects').update()` - PocketBase update
- `console.log()` - Update success
- `pb.collection('projects').create()` - Fallback create
- `console.log()` - Create success
- `console.error()` - Database errors
- `emitNodeComplete()` - Task details, file count, preview URL, validation status
- `emitNodeError()` - Error handling

### Execute Route
- `emitWorkflowStart()` - Workflow initialization
- `workflow.invoke()` - Full pipeline execution
- `console.log()` - Flow summary, file count, debug attempts, deploy URL
- `emitWorkflowComplete()` - Final workflow event with metrics
- `consumeTokens()` - Credit tracking

### Real-Time Streaming
- SSE endpoint streams all events
- Includes thinking process, task details, errors
- Human-readable messages for each event type

---

## Recommendations for Comprehensive Logging

To achieve complete observability across all stages, implement:

1. **Structured Logging Service**
   - Create unified logger accepting: stage, node, eventType, metadata
   - Store in JSON lines format for easy parsing
   - Include timestamps, durations, resource usage

2. **AI Conversation Tracking**
   - Store full prompt + response pairs per stage
   - Track token usage from API responses
   - Log model selection reasoning

3. **Performance Metrics Service**
   - Track stage-by-stage timing
   - Calculate projected completion time
   - Monitor timeout remaining

4. **Error Analytics**
   - Categorize errors by type
   - Track error resolution patterns
   - Store failed attempts for analysis

5. **File Operation Audit Trail**
   - Log all file creates, deletes, modifications
   - Store before/after content diffs for debugging
   - Track file operations across AutoGen attempts

6. **User Feedback Loop**
   - Progress indicators (X of 7 stages complete)
   - Estimated time remaining (based on stage timing)
   - Detailed error explanations to user

