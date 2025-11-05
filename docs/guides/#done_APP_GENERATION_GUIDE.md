# App Generation Architecture Overview

## Executive Summary

This codebase implements a sophisticated AI-powered app generation system using LangGraph for orchestration. The architecture follows a multi-agent workflow pattern where specialized AI agents collaborate sequentially and in parallel to generate, validate, and deploy web applications.

---

## Architecture Layers

### 1. Orchestration Layer (LangGraph)
**Location:** `/lib/langgraph/`

The entire app generation pipeline is built on **LangGraph**, a state-graph framework that manages complex multi-agent workflows.

#### Core Files:
- **`workflow.ts`** - Main workflow composition
  - Creates StateGraph with AppGenState channels
  - Defines 7-node workflow: Founder → PM → UX → (FE + BE parallel) → QA → DevOps → END
  - Handles state merging and channel definitions
  - Supports recursion limit of 30 for full pipeline

- **`types.ts`** - Workflow state definition
  - AppGenState interface with 20+ fields tracking:
    - User input (userDescription, userId, projectId)
    - Output from each agent node (refinedRequirements, plan, files, etc.)
    - Metadata (stage, completedNodes, errors, artifacts)

#### Node Architecture (7 Specialized Agents):

**1. Founder Node** (`founder-node.ts`)
- Analyzes user requirements
- Extracts business context
- Outputs: refinedRequirements, businessContext
- Uses AI to understand target audience, goals, success metrics

**2. PM (Product Manager) Node** (`pm-node.ts`)
- Creates product plan
- Performs app type analysis (landing-page, dashboard, SaaS, etc.)
- Sets design context (style, tone, animation level)
- Outputs: plan, context

**3. UX Designer Node** (`ux-node.ts`)
- Component selection (navigation, hero, features, pricing, footer, etc.)
- Gathers background context via MCP (optional)
- Generates enhanced design system prompt
- Outputs: componentNeeds, designSystemPrompt, backgroundContext

**4. Frontend Engineer Node** (`frontend-node.ts`) [Parallel with Backend]
- Generates HTML/CSS/JS code
- Builds component library section
- Handles database integration instructions
- Supports both single-page and multi-page apps
- Outputs: files (HTML documents)

**5. Backend Engineer Node** (`backend-node.ts`) [Parallel with Frontend]
- Generates database schema
- Creates collection definitions
- Detects multi-page requirements
- Outputs: backendConfig (collections, pages)

**6. QA Manager Node** (`qa-node.ts`)
- Validates generated code
- Triggers AutoGen debugging subgraph if errors detected
- Retries up to 3 times automatically
- Outputs: validationResult, debugAttempts

**7. DevOps Engineer Node** (`devops-node.ts`)
- Stores project in PocketBase
- Generates preview URL
- Returns deployment information
- Outputs: deployUrl

#### AutoGen Debugger Subgraph (`subgraphs/autogen-debugger.ts`)
Multi-agent debugging workflow triggered when validation errors occur:
1. **Code Analyst** - Analyzes validation errors
2. **Code Fixer** - Generates corrected code
3. **Reviewer** - Reviews fixes
4. Validates and repeats (max 3 attempts)

#### Event System (`events.ts`)
- Emits workflow lifecycle events
- Tracked events:
  - `node:start` - Node begins execution
  - `node:complete` - Node finishes (with duration)
  - `node:error` - Node encounters error
  - `workflow:start` - Workflow begins
  - `workflow:complete` - Workflow completes (with metrics)

---

### 2. API Layer
**Location:** `/app/api/`

#### Primary Entry Points:

**`/api/langgraph/execute` (POST)**
- Main entry point for LangGraph workflow
- Triggers full 7-node pipeline
- Accepts: `{ description: string }`
- Returns: `{ success, projectId, deployUrl, files, completedNodes, metadata }`
- Handles token consumption and credit validation
- Logs workflow start/completion

**`/api/ai/prototype` (POST)**
- Legacy prototype generation endpoint
- Has feature flag to route to LangGraph (`USE_LANGGRAPH` env var)
- Generates HTML with enhanced design system
- Handles component selection and intent validation
- Implements AI debugging engine with up to 3 retry attempts
- Supports both single-page and multi-page apps
- Injects database helper code

**`/api/langgraph/status` (GET)**
- Checks workflow status
- Query: `?projectId=xxx`
- Returns: status, checkpoints, completedNodes
- Determines: not_started, in_progress, completed, failed

**`/api/langgraph/resume` (POST)**
- Resumes paused/failed workflows
- Supports resuming from last checkpoint

#### Other API Routes:
- `/api/ai/plan` - Generate project plan
- `/api/ai/chat` - Chat with AI for refinements
- `/api/ai/backend` - Generate backend config
- `/api/ai/execute` - Execute individual actions
- `/api/examples/generate` - Generate example projects
- `/api/examples/gaps` - Detect missing features
- `/api/db/[projectId]/[collection]` - Database CRUD operations

---

### 3. Validation Layer
**Location:** `/lib/validation/`

#### Multi-Layer Validation System:

**Layer 1: Structure Validation** (`structure-validator.ts`)
- Checks file structure and multi-page correctness
- Validates page count for multi-page apps
- Checks for hash-based routing errors

**Layer 2: HTML Validation** (`html-validator.ts`)
- DOCTYPE declarations
- Tag pairing
- Semantic HTML
- Accessibility attributes

**Layer 3: CSS Validation** (`css-validator.ts`)
- Hex color validation (must be 3 or 6 digits)
- Invalid CSS values
- Syntax errors

**Layer 4: JavaScript Validation** (`js-validator.ts`)
- Script syntax
- Event handler validation
- Function declarations

**Layer 5: Placeholder Detection** (`placeholder-detector.ts`)
- Detects incomplete code
- Identifies "Add your content here" patterns
- Ensures production-ready output

**Main Orchestrator** (`index.ts` - validateCode)
- Coordinates all validation layers
- Auto-fixes errors (if enabled)
- Returns comprehensive report
- Classes errors as "error" or "warning"

#### Auto-Fixer (`auto-fixer.ts`)
- Automatically repairs common issues
- Fixes hex colors (#FFF)
- Fixes tag pairing
- Handles whitespace normalization

---

### 4. AI Debugging Engine
**Location:** `/lib/services/ai-debugger.ts`

Sophisticated error recovery system:
- **Max Attempts:** 3
- **Process:**
  1. Build detailed error feedback with context
  2. Send to AI with project requirements
  3. Regenerate code with error fixes
  4. Validate regenerated code
  5. Repeat if errors remain

**Features:**
- Tracks error reduction over attempts
- Logs AI model/provider metadata
- Prevents infinite loops (checks for error improvements)
- Handles multi-page app specific errors
- Provides detailed error feedback to AI with:
  - File-by-file error grouping
  - Line numbers and context
  - Specific fix suggestions
  - Multi-page app routing requirements
  - Validation rule explanations

---

### 5. Logging Infrastructure
**Location:** `/lib/services/validation-error-logger.ts`

#### Comprehensive Logging System:

**ValidationErrorLog**
- Tracks individual validation errors
- Fields: rule, file, line, severity, message, suggestion, autoFixable
- Tracks attempt number (1-3 for debugging)
- Records AI model/provider used
- Stores in-memory cache (max 1000 errors)
- Optional PocketBase persistence

**ValidationSessionLog**
- Summarizes entire validation session
- Tracks: totalErrors, totalWarnings, totalFixed
- Records success/failure
- Groups errors by type
- Session types: 'generation' or 'debug_attempt'
- Stores in-memory cache (max 100 sessions)

#### Logging Functions:
- `logValidationError()` - Log single error
- `logValidationErrors()` - Batch log errors
- `logValidationSession()` - Log session summary
- `getAllValidationErrors()` - Retrieve errors
- `getProjectValidationStats()` - Analytics
- `getValidationErrors()` - Paginated retrieval with filters

---

### 6. Design System Integration
**Location:** `/lib/enhanced-design-prompt.ts`, `/lib/design-components.ts`, `/lib/v0-components.ts`

#### Enhanced 2025 Design System:
- Smart dark mode detection (AI/chat apps)
- Pixel-perfect color system
- Component library with variants:
  - Navigation (simple, full, glassmorphism)
  - Hero (minimal, centered, gradient, product showcase)
  - Features (3-items, 6-items, grid)
  - Forms (waitlist, newsletter, contact, login)
  - Pricing (2-tier, 3-tier)
  - CTA sections (simple, gradient)
  - Footers (minimal, full)
  - Buttons (standard, gradient, glass)

#### Component Library:
- Accessible components (ARIA, semantic HTML)
- Mobile-first responsive design
- Modern UI patterns (glassmorphism, gradients)
- Smooth transitions (0.2-0.3s)
- Screen reader support (.sr-only)

---

### 7. Data Persistence
**Location:** Various (PocketBase integration)

#### Key Collections:
- **projects** - Generated projects
  - Fields: userId, name, description, stage, plan, files, backendConfig
  - Stores validation results, debug attempts, artifacts

- **validation_errors** - Validation error tracking (optional)
- **validation_sessions** - Session summaries (optional)
- **users** - User accounts with credit tracking

#### Database API (Injected into Generated Apps)
- `window.db.get(collection)` - Read all records
- `window.db.add(collection, record)` - Create record
- `window.db.update(collection, id, updates)` - Update record
- `window.db.delete(collection, id)` - Delete record
- `window.db.find/findOne()` - Search records

---

## Workflow Execution Flow

### Single-Page App Generation:
```
User Input
    ↓
Founder Node (analyze requirements)
    ↓
PM Node (create plan, set context)
    ↓
UX Node (select components, design system)
    ↓
Frontend Node → Backend Node (parallel)
    ↓
QA Node (validate, debug if needed)
    ↓
DevOps Node (store, generate preview)
    ↓
Return Results (HTML files, preview URL)
```

### Multi-Page App Generation:
Same flow but:
- Backend Node detects multiple pages in requirements
- QA Node validates file count matches expected pages
- Frontend Node generates separate HTML files using FILE: delimiters
- Validation checks for proper multi-page structure

### Error Handling Flow:
```
Code Generation
    ↓
Validation
    ↓
Errors Found?
    ├─ YES → AI Debugging Engine (3 attempts max)
    │         Analyze → Fix → Validate → Repeat
    │         Success? → Continue to DevOps
    │         Failure? → Return errors
    └─ NO → Continue to DevOps
```

---

## Key Features & Capabilities

### 1. Multi-Agent Orchestration
- 7 specialized AI agents (Founder, PM, UX, FE, BE, QA, DevOps)
- Parallel execution (Frontend + Backend run simultaneously)
- State management across agents
- Error context propagation

### 2. Intelligent Component Selection
- Intent-based component selection
- Validation of component choices against user requirements
- Granular form selection (waitlist-only vs full contact form)
- Prevents unnecessary features

### 3. Automatic Error Recovery
- 3-attempt debugging engine
- AI-powered error fixing with context
- Validation re-checks after fixes
- Detailed error feedback to AI

### 4. Multi-Page Application Support
- Automatic page detection
- File delimiter parsing (---FILE:filename.html---)
- Validation of page count
- Hash-routing error detection

### 5. Database Integration
- Automatic database API injection
- Collection schema generation
- Async/await database operations
- Real data loading on page load

### 6. Comprehensive Logging
- Per-error logging with context
- Session-level tracking
- Error aggregation and analytics
- Attempt tracking (generation vs debugging)

### 7. Token-Based Credit System
- Token consumption per API call
- Daily token resets
- Insufficient token detection
- Token cost estimates

---

## State Management

### AppGenState Structure:
```typescript
{
  // User Input
  userDescription: string
  userId: string
  projectId: string

  // Founder Output
  refinedRequirements?: string
  businessContext?: { targetAudience, primaryGoal, successMetrics }

  // PM Output
  plan?: string
  context?: { appType, complexity, designStyle, visualTone }

  // UX Output
  componentNeeds?: { navigation, hero, features, emailCapture, ... }
  designSystemPrompt?: string
  backgroundContext?: any
  examples?: any[]

  // Backend Output
  backendConfig?: { collections, pages }

  // Frontend Output
  files?: Array<{ path, content }>
  isMultiPage?: boolean

  // QA Output
  validationResult?: { valid, errors, warnings, fixed }
  debugAttempts?: number

  // DevOps Output
  deployUrl?: string

  // Metadata
  stage: string
  completedNodes: string[]
  errors: any[]
  artifacts: Map<string, any>
}
```

---

## Error Handling Mechanisms

### 1. Node-Level Error Handling
- Try-catch in each node
- Fallback outputs if generation fails
- Error logging via emitNodeError()
- Error accumulation in state.errors

### 2. Validation Error Handling
- 5-layer validation system
- Auto-fix for common issues
- Error categorization (structure, html, css, js, placeholder)
- Multi-page specific validation

### 3. AI Debugging Engine
- Up to 3 regeneration attempts
- Error feedback includes:
  - File-specific errors
  - Line numbers and context
  - Fix suggestions
  - Critical validation rules
  - Multi-page app requirements

### 4. Circuit Breaker Pattern
- Global error deduplicator
- Circuit breaker for AI service
- Timeout handling (90 seconds for generation)
- Retry with backoff (2 attempts max)

### 5. Logging & Analytics
- Console logging with [LangGraph], [Validation], [QA] prefixes
- Event emission for monitoring
- In-memory error store
- Session tracking

---

## Configuration & Feature Flags

### Environment Variables:
- `USE_LANGGRAPH` - Route /api/ai/prototype to LangGraph (default: true)
- `NEXT_PUBLIC_POCKETBASE_URL` - Database URL
- `MCP_ENABLED` - Enable background context research

### Feature Flags in Code:
```typescript
// Route selection
const USE_LANGGRAPH = process.env.USE_LANGGRAPH !== 'false';

// Dark mode detection
const isDarkMode = description.includes('dark') || 
                   description.includes('ai') ||
                   appType.includes('ai');
```

---

## Performance Characteristics

### Timing Estimates:
- Founder Node: ~2-5s (single AI call)
- PM Node: ~3-7s (2 AI calls + analysis)
- UX Node: ~4-8s (component selection + design system)
- Frontend Node: ~10-20s (complex code generation)
- Backend Node: ~2-4s (schema generation)
- QA Node: ~5-15s (validation + potential debugging)
  - With debugging: +15-30s per attempt
- DevOps Node: ~1-2s (database update)

**Total Typical Time:**
- Simple single-page: 30-45 seconds
- Complex multi-page with debugging: 60-90 seconds

### Token Usage:
- Estimated: ~4x the character count of description + plan
- Example: 1000 char description = ~4000 tokens

---

## Integration Points

### External Services:
1. **OpenRouter** - Primary AI provider (Claude)
2. **PocketBase** - Database and project storage
3. **MCP** (Model Context Protocol) - Background research
4. **Unsplash** - Image resources (disabled in current version)

### Frontend Integration:
- API endpoints: `/api/langgraph/execute`, `/api/ai/prototype`
- Database API: `/api/db/[projectId]/[collection]`
- Preview: `/project/[projectId]`

---

## Security Considerations

1. **Authentication:** All endpoints require authenticated user via PocketBase middleware
2. **Authorization:** User-based project access
3. **Token Validation:** Credit checking before generation
4. **Input Validation:** Description length, plan content
5. **Output Sanitization:**
   - Image tags removed from generated HTML
   - Database API uses secure fetch with error handling
   - No exposed credentials in generated code

---

## Future Enhancements

Based on code comments:

1. **State Persistence:** Full checkpoint system for resuming workflows
2. **Database Schema Persistence:** Store validation errors in PocketBase
3. **Caching:** Memoize design systems and component selections
4. **Analytics:** Dashboard for tracking error rates, generation success
5. **Model Optimization:** A/B test different AI models per node
6. **Parallel Debugging:** Run multiple debug attempts in parallel
7. **Custom Components:** User-defined component libraries

---

## File Structure Summary

```
/lib/langgraph/
  ├── workflow.ts (main orchestration)
  ├── types.ts (state definitions)
  ├── events.ts (event emission)
  ├── utils.ts (helpers)
  ├── checkpointer.ts (state persistence)
  ├── nodes/
  │   ├── founder-node.ts
  │   ├── pm-node.ts
  │   ├── ux-node.ts
  │   ├── frontend-node.ts
  │   ├── backend-node.ts
  │   ├── qa-node.ts
  │   └── devops-node.ts
  └── subgraphs/
      └── autogen-debugger.ts

/lib/validation/
  ├── index.ts (orchestrator)
  ├── html-validator.ts
  ├── css-validator.ts
  ├── js-validator.ts
  ├── structure-validator.ts
  ├── placeholder-detector.ts
  ├── auto-fixer.ts
  └── types.ts

/lib/services/
  ├── ai-debugger.ts (error recovery)
  └── validation-error-logger.ts (logging)

/app/api/
  ├── langgraph/
  │   ├── execute/route.ts (main entry)
  │   ├── status/route.ts
  │   └── resume/route.ts
  └── ai/
      ├── prototype/route.ts (legacy/fallback)
      └── prototype/route-langgraph.ts
```

---

## How to Use This Architecture

### For Frontend Integration:
```typescript
// Trigger full pipeline
const response = await fetch('/api/langgraph/execute', {
  method: 'POST',
  body: JSON.stringify({ description: 'My app idea' })
});

const result = await response.json();
// result.projectId, result.files, result.deployUrl
```

### For Custom Agent Creation:
1. Create new node file in `/lib/langgraph/nodes/`
2. Implement async function: `(state: AppGenState) => Promise<Partial<AppGenState>>`
3. Add to workflow in `workflow.ts`
4. Handle emissions and errors

### For Adding Validation Rules:
1. Create rule in appropriate validator
2. Return ValidationError with all required fields
3. Add auto-fix if rule is autoFixable
4. Update error categorization in logger

---

## Conclusion

This architecture represents a production-grade AI application generation system with:
- Sophisticated multi-agent orchestration
- Comprehensive error handling and recovery
- Professional code validation
- Detailed logging and analytics
- Token-based resource management
- Support for complex multi-page applications

The LangGraph-based workflow provides a scalable foundation for expanding the system with additional agents, validation rules, and deployment targets.
