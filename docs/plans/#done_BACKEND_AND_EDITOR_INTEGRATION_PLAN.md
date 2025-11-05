# Backend Integration & Editor Workflow Plan #notDone

**Status:** Planning Complete - Ready for Execution
**Updated:** October 31, 2025 (Incorporates Fixes 46-50 + Current State)
**Implementation Start:** Next Chat Session

---

## CRITICAL: RULES AND CONSTRAINTS

These rules MUST be followed throughout implementation:

### RULE 1: Database-First Approach
- **NO prototyping with static apps first**
- Apps with data persistence requirements get backend FROM THE START
- Detection is AUTOMATIC (no asking user)
- PM node announces backend decision in plan

### RULE 2: TypeScript Quality Standards
- ALL event handlers MUST have proper types
- Use `React.ChangeEvent<HTMLInputElement>` for change events
- Use `React.MouseEvent<HTMLButtonElement>` for click events
- Use `React.FormEvent<HTMLFormElement>` for submit events
- ALWAYS include 'use client' directive for client components
- TypeScript validation catches these BEFORE deployment

### RULE 3: File Deduplication is Mandatory
- User files ALWAYS take precedence over scaffold templates
- Deduplication happens at THREE layers:
  1. DevOps node (merge scaffold + user files)
  2. Deployment server (safety net before writing)
  3. Frontend generation (API client integration)

### RULE 4: Explicit File Targeting
- Editor node ONLY returns files listed in "FILES TO MODIFY"
- Context Analyzer determines which files need changes
- AI is WARNED not to return config files unless explicitly listed
- All unmodified files are preserved automatically

### RULE 5: Comprehensive Logging Required
- ALL nodes log their actions with emoji prefixes
- Raw AI responses logged for debugging
- File operations logged (created, modified, preserved)
- Validation results logged with error details
- Deployment steps logged with timing

### RULE 6: Validation Before Deployment
- HTML validation for .html files
- TypeScript validation for .ts/.tsx files
- CSS validation (semantic tokens respected)
- NO deployment until QA passes (or AutoGen fixes errors)

---

## OVERVIEW

This document outlines the complete plan for integrating:
1. **Real Backend APIs** - Express servers per project for data persistence
2. **Editor Workflow** - Seamless iterative changes to existing apps
3. **Conversational Features** - Human-like interaction with users (Phase 2)

**Current State (Post Fixes 46-50):**
- ✅ Editing workflow is FULLY functional
- ✅ TypeScript validation catches errors before deployment
- ✅ File marker parsing supports nested paths (src/app/page.tsx)
- ✅ Comprehensive logging in all nodes
- ✅ File deduplication prevents deployment corruption
- ✅ AI correctly targets files based on context analysis

**What's Missing:**
- ❌ Backend integration (Express API servers)
- ❌ Editor workflow connected to main workflow
- ❌ Conversational features (user input requests, clarifications, rollback UI)
- ❌ Checkpoint system activation for rollback

---

## PHASE 1: BACKEND INTEGRATION (Weeks 1-4)

### Chosen Approach: **Option A - Static Frontend + Express API Server**

**Architecture:**
```
Deployment Server (Port 4000)
├─► Serves static Next.js apps: /apps/project-*/
├─► Manages Express API servers per project
├─► Port allocation: 5000-6000 (dynamic, 1000 projects max)
└─► Process management via child_process

Frontend: http://localhost:4000/apps/project-abc/
Backend: http://localhost:5001/api (separate Node.js process)
```

**Why This Approach?**
- ✅ Keep existing static Next.js workflow (no breaking changes)
- ✅ Simple Express servers (lightweight, well-understood)
- ✅ Full API flexibility (any npm package, custom logic)
- ✅ Can migrate to Docker/serverless later
- ✅ Low memory overhead vs full Next.js servers
- ✅ Aligns with RULE 1: Database-first approach

---

## UX FLOW: **Database-First (Auto-Detection)**

### UPDATED: Auto-Detection Logic (RULE 1)

**Flow:**
```
User: "Build a task manager app"
  ↓
PM Node: AI detects "tasks need to be saved" → needsBackend = true
  ↓
PM Node: Announces "I'll build this with a backend API for data persistence"
  ↓
Backend Node: Generates Express API endpoints
  ↓
Frontend Node: Generates UI with API calls
  ↓
Deploy: Static frontend + Express API server (both ready)
  ↓
User: Opens app → fully functional with persistence! ✨
```

**Detection Keywords (RULE 1):**
```typescript
function needsBackend(userRequest: string, pmPlan: PMPlan): boolean {
  // RULE 1: Database-first approach - automatically detect backend needs
  const backendKeywords = [
    'save', 'store', 'persist', 'database', 'data',
    'user accounts', 'login', 'signup', 'authentication', 'auth',
    'admin panel', 'dashboard', 'admin',
    'CRUD', 'create', 'update', 'delete', 'manage',
    'manage users', 'manage posts', 'manage items', 'manage products',
    'real-time', 'websocket', 'chat',
    'search', 'filter', 'query',
    'api', 'endpoint', 'backend',
    'form submission', 'contact form', 'newsletter'
  ];

  const staticKeywords = [
    'landing page', 'portfolio', 'marketing site',
    'documentation', 'docs', 'blog' // static blog (unless "cms" mentioned)
  ];

  const request = userRequest.toLowerCase();
  const plan = pmPlan.overview.toLowerCase();

  // If explicitly static, return false
  if (staticKeywords.some(kw => request.includes(kw) && !request.includes('cms'))) {
    return false;
  }

  // If backend keywords found, return true
  return backendKeywords.some(kw => request.includes(kw) || plan.includes(kw));
}
```

**Static OK Keywords:**
- landing page, portfolio, blog (static content only)
- marketing site, documentation
- read-only content
- NO data persistence needed

### Example Scenarios

**Scenario 1: Task Manager (Auto Backend)**
```
User: "Build a task manager with user accounts"
  ↓
PM: "I'll build this with a backend API for data persistence"
  ↓
[Generates static + API from start]
  ↓
User: Tasks persist, users can login ✅
```

**Scenario 2: Landing Page (Static Only)**
```
User: "Build a landing page for my product"
  ↓
PM: "I'll build this as a static site"
  ↓
[Generates static only - fast deployment]
  ↓
User: Beautiful landing page, no backend needed ✅
```

**Scenario 3: Upgrade Static → Backend**
```
User: "Build a portfolio site"
  ↓
[Static site generated]
  ↓
User: "Add a contact form that saves to database"
  ↓
Editor Workflow: Detects backend need, adds Express API, redeploys
  ↓
User: Form now saves to database ✅
```

---

## IMPLEMENTATION DETAILS

### 1. Backend Node (backend-node.ts)

**Current State:** Completely disabled, returns `null`

**File:** [lib/langgraph/nodes/backend-node.ts](../../lib/langgraph/nodes/backend-node.ts)

**Changes Needed:**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { AppGenState } from '../types';

/**
 * BACKEND NODE
 *
 * Generates Express API server code for projects requiring data persistence.
 * Uses Claude AI to generate contextual API endpoints based on PM plan.
 *
 * RULE 1: Only generates if needsBackend = true (database-first approach)
 * RULE 5: Comprehensive logging with emoji prefixes
 */
export async function backendNode(state: AppGenState): Promise<Partial<AppGenState>> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 BACKEND NODE - Generating Express API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // RULE 1: Check if backend is needed
  if (!state.context?.pmPlan?.needsBackend) {
    console.log('[Backend] 📦 Backend not needed - skipping backend generation');
    console.log('[Backend] ✅ Returning null config\n');
    return { backendConfig: null };
  }

  console.log('[Backend] ✅ Backend required - generating Express API endpoints');
  console.log(`[Backend] 📋 Project: ${state.projectId}`);
  console.log(`[Backend] 📝 User Request: ${state.userDescription}\n`);

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build prompt for AI to generate API structure
  const prompt = buildBackendPrompt(state);

  console.log('[Backend] 🤖 Calling Claude AI for API endpoint generation...');

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const response = message.content[0].type === 'text' ? message.content[0].text : '';

  // RULE 5: Log raw AI response (first 500 chars for debugging)
  console.log('[Backend] 📝 RAW AI RESPONSE (first 500 chars):');
  console.log(response.substring(0, 500));
  console.log('...\n');

  // Parse AI response to extract backend config
  const backendConfig = parseBackendResponse(response, state.projectId);

  console.log('[Backend] ✅ Backend config generated:');
  console.log(`[Backend]   📊 Collections: ${backendConfig.collections.join(', ')}`);
  console.log(`[Backend]   🔗 API Endpoints: ${backendConfig.apiEndpoints.length}`);
  backendConfig.apiEndpoints.forEach(ep => {
    console.log(`[Backend]     • ${ep.method} ${ep.path} → ${ep.handler}`);
  });
  console.log();

  return { backendConfig };
}

function buildBackendPrompt(state: AppGenState): string {
  const pmPlan = state.context?.pmPlan;

  return `You are an Expert Backend API Architect. Generate a complete Express.js API structure for this project.

PROJECT OVERVIEW
${pmPlan?.overview || 'No overview provided'}

USER REQUEST
"${state.userDescription}"

FEATURES
${pmPlan?.features?.join('\n') || 'No features provided'}

TECH STACK
${pmPlan?.techStack?.join(', ') || 'Express.js, PocketBase'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR TASK

Generate a backend API structure with:

1. **Collections** - Database tables needed (e.g., users, tasks, posts)
2. **API Endpoints** - RESTful routes with CRUD operations
3. **Relationships** - How collections relate (if needed)

RULES:
- Use RESTful conventions (GET /api/users, POST /api/users, etc.)
- Each collection gets standard CRUD endpoints
- Use PocketBase for database (already integrated)
- Keep it simple - only add what's needed
- No authentication in Phase 1 (add later if needed)

OUTPUT FORMAT (JSON):
\`\`\`json
{
  "collections": ["users", "tasks", "projects"],
  "apiEndpoints": [
    {
      "method": "GET",
      "path": "/api/users",
      "handler": "getUsers",
      "collection": "users",
      "description": "Fetch all users"
    },
    {
      "method": "POST",
      "path": "/api/users",
      "handler": "createUser",
      "collection": "users",
      "description": "Create a new user"
    },
    {
      "method": "GET",
      "path": "/api/users/:id",
      "handler": "getUserById",
      "collection": "users",
      "description": "Fetch a single user by ID"
    },
    {
      "method": "PUT",
      "path": "/api/users/:id",
      "handler": "updateUser",
      "collection": "users",
      "description": "Update a user"
    },
    {
      "method": "DELETE",
      "path": "/api/users/:id",
      "handler": "deleteUser",
      "collection": "users",
      "description": "Delete a user"
    }
  ],
  "relationships": [
    {
      "from": "tasks",
      "to": "users",
      "type": "many-to-one",
      "foreignKey": "userId"
    }
  ]
}
\`\`\`

Return ONLY the JSON, no markdown, no explanation.`;
}

function parseBackendResponse(response: string, projectId: string): BackendConfig {
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse backend config from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    projectId,
    collections: parsed.collections || [],
    apiEndpoints: parsed.apiEndpoints || [],
    relationships: parsed.relationships || [],
    port: null // Assigned during deployment
  };
}

// Type definition
interface BackendConfig {
  projectId: string;
  collections: string[];
  apiEndpoints: Array<{
    method: string;
    path: string;
    handler: string;
    collection: string;
    description: string;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    foreignKey: string;
  }>;
  port: number | null;
}
```

**Files Generated by Backend Node:**

Backend node generates the **structure** (JSON config), but actual Express code is generated by **Next.js scaffold** (see Section 6).

---

### 2. Deployment Server (server.js)

**File:** [deployment-server/server.js](../../deployment-server/server.js)

**Changes Needed:**

**Add API Server Manager:**
```javascript
const { spawn } = require('child_process');

// API Server Management
const apiServers = new Map(); // projectId → { process, port, startTime, restartCount }
const usedPorts = new Set();
const PORT_RANGE = { min: 5000, max: 6000 };
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_DELAY_MS = 2000;

/**
 * RULE 5: Comprehensive logging for API server lifecycle
 */

function allocatePort(projectId) {
  console.log(`[API Manager] 🔍 Allocating port for ${projectId}...`);

  for (let port = PORT_RANGE.min; port <= PORT_RANGE.max; port++) {
    if (!usedPorts.has(port)) {
      usedPorts.add(port);
      console.log(`[API Manager] ✅ Allocated port ${port} to ${projectId}`);
      return port;
    }
  }

  console.error(`[API Manager] ❌ Port exhaustion - all ports ${PORT_RANGE.min}-${PORT_RANGE.max} in use`);
  throw new Error('Port exhaustion - all ports 5000-6000 in use');
}

function releasePort(port) {
  if (usedPorts.has(port)) {
    usedPorts.delete(port);
    console.log(`[API Manager] ♻️ Released port ${port}`);
  }
}

function startApiServer(projectId, buildPath) {
  console.log(`\n[API Manager] 🚀 Starting API server for ${projectId}...`);
  console.log(`[API Manager] 📂 Build path: ${buildPath}`);

  const port = allocatePort(projectId);

  const apiProcess = spawn('node', ['api/server.js'], {
    cwd: buildPath,
    env: {
      ...process.env,
      PORT: port,
      PROJECT_ID: projectId,
      NODE_ENV: 'production'
    },
    detached: false
  });

  apiProcess.stdout.on('data', (data) => {
    console.log(`[API ${projectId}:${port}] ${data.toString().trim()}`);
  });

  apiProcess.stderr.on('data', (data) => {
    console.error(`[API ${projectId}:${port}] ❌ ERROR: ${data.toString().trim()}`);
  });

  apiProcess.on('exit', (code, signal) => {
    console.log(`[API ${projectId}:${port}] ⚠️ Process exited with code ${code}, signal ${signal}`);

    const server = apiServers.get(projectId);
    if (server && server.restartCount < MAX_RESTART_ATTEMPTS) {
      console.log(`[API ${projectId}:${port}] 🔄 Auto-restarting (attempt ${server.restartCount + 1}/${MAX_RESTART_ATTEMPTS})...`);

      setTimeout(() => {
        try {
          startApiServer(projectId, buildPath);
        } catch (error) {
          console.error(`[API ${projectId}:${port}] ❌ Restart failed: ${error.message}`);
        }
      }, RESTART_DELAY_MS);

      server.restartCount += 1;
    } else if (server) {
      console.error(`[API ${projectId}:${port}] ❌ Max restart attempts reached - giving up`);
      releasePort(port);
      apiServers.delete(projectId);
    }
  });

  apiServers.set(projectId, {
    process: apiProcess,
    port,
    startTime: Date.now(),
    restartCount: 0
  });

  console.log(`[API Manager] ✅ API server started for ${projectId} on port ${port}\n`);

  return port;
}

function stopApiServer(projectId) {
  console.log(`[API Manager] 🛑 Stopping API server for ${projectId}...`);

  const server = apiServers.get(projectId);
  if (server) {
    server.process.kill('SIGTERM');
    releasePort(server.port);
    apiServers.delete(projectId);
    console.log(`[API Manager] ✅ API server stopped for ${projectId}`);
  } else {
    console.log(`[API Manager] ⚠️ No API server found for ${projectId}`);
  }
}

async function healthCheck(projectId) {
  const server = apiServers.get(projectId);
  if (!server) return false;

  try {
    const res = await fetch(`http://localhost:${server.port}/health`, {
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Endpoint: Get all running API servers
app.get('/api-servers', (req, res) => {
  const servers = Array.from(apiServers.entries()).map(([projectId, server]) => ({
    projectId,
    port: server.port,
    uptime: Date.now() - server.startTime,
    restartCount: server.restartCount
  }));

  res.json({ servers, totalPorts: usedPorts.size });
});

// Endpoint: Health check for specific project
app.get('/api-servers/:projectId/health', async (req, res) => {
  const { projectId } = req.params;
  const healthy = await healthCheck(projectId);

  res.json({ projectId, healthy });
});
```

**Add to Deployment Endpoint:**
```javascript
app.post('/deploy/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { files, backendConfig } = req.body;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 DEPLOYMENT REQUEST: ${projectId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // ... existing static deployment code (unchanged)

  // RULE 5: Log backend config if present
  if (backendConfig) {
    console.log('[Deployment] 🔧 Backend config detected:');
    console.log(`[Deployment]   Collections: ${backendConfig.collections.join(', ')}`);
    console.log(`[Deployment]   Endpoints: ${backendConfig.apiEndpoints.length}`);
    console.log('[Deployment] 🚀 Starting API server...\n');

    try {
      // Stop existing API server if running
      if (apiServers.has(projectId)) {
        console.log('[Deployment] ♻️ Stopping existing API server...');
        stopApiServer(projectId);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cleanup
      }

      // Start new API server
      const apiPort = startApiServer(projectId, buildPath);

      // Update project in PocketBase with API port
      await pb.collection('projects').update(projectId, {
        apiPort,
        apiUrl: `http://localhost:${apiPort}`,
        backendConfig
      });

      console.log('[Deployment] ✅ API server started and registered\n');
    } catch (error) {
      console.error('[Deployment] ❌ Failed to start API server:', error.message);
      // Continue with deployment even if API server fails
    }
  } else {
    console.log('[Deployment] 📦 No backend config - static deployment only\n');
  }

  // ... rest of deployment logic
});
```

---

### 3. PM Node (pm-node.ts)

**File:** [lib/langgraph/nodes/pm-node.ts](../../lib/langgraph/nodes/pm-node.ts)

**Changes Needed:**

Add backend detection after generating plan:

```typescript
// After generating plan (around line 150)
console.log('[PM] 🔍 Analyzing backend requirements...');

const needsBackend = detectBackendNeed(state.userDescription, overview);

console.log(`[PM] ${needsBackend ? '✅ Backend required' : '📦 Static site only'}`);

// Add to plan announcement
const backendAnnouncement = needsBackend
  ? '\n\n🔧 **Backend:** I will build this with an Express API for data persistence and PocketBase for database storage.'
  : '\n\n📦 **Deployment:** I will build this as a static site (no backend needed).';

plan.overview = `${overview}${backendAnnouncement}`;

return {
  ...state,
  context: {
    ...state.context,
    pmPlan: {
      ...plan,
      needsBackend // NEW: Add flag to plan
    }
  }
};

// Helper function (add at end of file)
function detectBackendNeed(userRequest: string, pmPlan: string): boolean {
  // RULE 1: Database-first approach - automatically detect backend needs
  const backendKeywords = [
    'save', 'store', 'persist', 'database', 'data',
    'user accounts', 'login', 'signup', 'authentication', 'auth',
    'admin panel', 'dashboard', 'admin',
    'crud', 'create', 'update', 'delete', 'manage',
    'real-time', 'websocket', 'chat',
    'search', 'filter', 'query',
    'api', 'endpoint', 'backend',
    'form submission', 'contact form', 'newsletter'
  ];

  const staticKeywords = [
    'landing page', 'portfolio', 'marketing site',
    'documentation', 'docs'
  ];

  const request = userRequest.toLowerCase();
  const plan = pmPlan.toLowerCase();

  // If explicitly static, return false
  if (staticKeywords.some(kw => request.includes(kw) && !request.includes('cms'))) {
    console.log('[PM] 📦 Static keywords detected - no backend needed');
    return false;
  }

  // If backend keywords found, return true
  const hasBackendKeywords = backendKeywords.some(kw => request.includes(kw) || plan.includes(kw));

  if (hasBackendKeywords) {
    console.log('[PM] 🔧 Backend keywords detected - API required');
  }

  return hasBackendKeywords;
}
```

---

### 4. Frontend Node (frontend-node-nextjs.ts)

**File:** [lib/langgraph/nodes/frontend-node-nextjs.ts](../../lib/langgraph/nodes/frontend-node-nextjs.ts)

**Changes Needed:**

Add API client generation after generating component files:

```typescript
// After generating all component files (around line 300)

// RULE 3: Check for backend config and generate API client
if (state.backendConfig?.apiEndpoints) {
  console.log('[Frontend] 🔗 Backend detected - generating API client...');
  console.log(`[Frontend] 📊 Endpoints: ${state.backendConfig.apiEndpoints.length}`);

  const apiClientCode = generateApiClient(state.backendConfig.apiEndpoints);

  files.push({
    path: 'src/lib/api.ts',
    content: apiClientCode
  });

  console.log('[Frontend] ✅ API client generated: src/lib/api.ts');

  // Also generate .env.local for API URL configuration
  const envContent = generateEnvFile(state.projectId);
  files.push({
    path: '.env.local',
    content: envContent
  });

  console.log('[Frontend] ✅ Environment file generated: .env.local');
}

// Helper function (add at end of file)
function generateApiClient(endpoints: any[]): string {
  // RULE 2: TypeScript quality standards - proper types for API client
  return `/**
 * AUTO-GENERATED API CLIENT
 *
 * This file is generated by the Frontend Node based on backend configuration.
 * Uses fetch API with proper TypeScript types.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, error.message || \`HTTP \${res.status}\`);
  }
  return res.json();
}

${endpoints.map(ep => {
  const hasParams = ep.path.includes(':id');
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method);

  // Generate function signature
  let params = [];
  if (hasParams) params.push('id: string');
  if (hasBody) params.push('data: any');

  return `/**
 * ${ep.description}
 * ${ep.method} ${ep.path}
 */
export async function ${ep.handler}(${params.join(', ')}): Promise<any> {
  const url = \`\${API_BASE}${ep.path.replace(':id', '\${id}')}\`;

  const res = await fetch(url, {
    method: '${ep.method}',
    ${hasBody ? `headers: { 'Content-Type': 'application/json' },` : ''}
    ${hasBody ? 'body: JSON.stringify(data),' : ''}
    credentials: 'include'
  });

  return handleResponse(res);
}`;
}).join('\n\n')}

// Health check
export async function healthCheck(): Promise<{ status: string; timestamp: number }> {
  const res = await fetch(\`\${API_BASE}/health\`);
  return handleResponse(res);
}
`;
}

function generateEnvFile(projectId: string): string {
  return `# Auto-generated environment variables
# These are injected at build time

NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_PROJECT_ID=${projectId}
`;
}
```

---

### 5. DevOps Node (devops-node.ts)

**File:** [lib/langgraph/nodes/devops-node.ts](../../lib/langgraph/nodes/devops-node.ts)

**Current State:** Already includes Fix 47 (file deduplication)

**Changes Needed:**

Add backend config to deployment trigger:

```typescript
// After saving files to PocketBase (around line 80)

// RULE 5: Log backend deployment trigger
if (state.backendConfig) {
  console.log('[DevOps] 🔧 Backend config detected - will trigger API deployment');
  console.log(`[DevOps]   Collections: ${state.backendConfig.collections.join(', ')}`);
  console.log(`[DevOps]   Endpoints: ${state.backendConfig.apiEndpoints.length}`);
}

console.log('[DevOps] 🚀 Triggering deployment server...');

const deploymentResponse = await fetch(`http://localhost:4000/deploy/${state.projectId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: state.projectId,
    files: allFiles, // Already includes deduplication from Fix 47
    backendConfig: state.backendConfig // NEW: Include backend config
  })
});

// ... existing deployment handling code
```

---

### 6. Next.js Scaffold (nextjs-scaffold.js)

**File:** [deployment-server/nextjs-scaffold.js](../../deployment-server/nextjs-scaffold.js)

**Changes Needed:**

Add Express server templates when backend config is present:

```javascript
function generateScaffold(projectId, backendConfig = null) {
  const files = [
    // ... existing scaffold files (package.json, next.config.js, etc.)
  ];

  // RULE 3: Add backend files if config provided
  if (backendConfig) {
    console.log(`[Scaffold] 🔧 Generating backend files for ${projectId}...`);
    console.log(`[Scaffold]   Collections: ${backendConfig.collections.join(', ')}`);
    console.log(`[Scaffold]   Endpoints: ${backendConfig.apiEndpoints.length}`);

    // Add Express server
    files.push({
      path: 'api/server.js',
      content: generateExpressServer(projectId, backendConfig)
    });

    // Add database client
    files.push({
      path: 'api/db.js',
      content: generateDbClient(projectId, backendConfig)
    });

    // Add route files (grouped by collection)
    const routesByCollection = groupEndpointsByCollection(backendConfig.apiEndpoints);

    for (const [collection, endpoints] of Object.entries(routesByCollection)) {
      files.push({
        path: `api/routes/${collection}.js`,
        content: generateRouteFile(collection, endpoints)
      });
    }

    // Add package.json for API server
    files.push({
      path: 'api/package.json',
      content: generateApiPackageJson(projectId)
    });

    console.log(`[Scaffold] ✅ Generated ${files.filter(f => f.path.startsWith('api/')).length} backend files`);
  }

  return files;
}

function generateExpressServer(projectId, backendConfig) {
  const collections = backendConfig.collections;

  return `const express = require('express');
const cors = require('cors');
${collections.map(c => `const ${c}Router = require('./routes/${c}');`).join('\n')}

const app = express();
const PORT = process.env.PORT || 5001;
const PROJECT_ID = process.env.PROJECT_ID || '${projectId}';

console.log(\`🚀 Starting API server for project: \${PROJECT_ID}\`);
console.log(\`📊 Collections: ${collections.join(', ')}\`);

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4000',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    projectId: PROJECT_ID,
    port: PORT
  });
});

// API routes
${collections.map(c => `app.use('/api/${c}', ${c}Router);`).join('\n')}

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ API Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(\`✅ API server running on http://localhost:\${PORT}\`);
  console.log(\`🔗 Health check: http://localhost:\${PORT}/health\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
`;
}

function generateDbClient(projectId, backendConfig) {
  const collections = backendConfig.collections;

  return `const PocketBase = require('pocketbase/cjs');

const pb = new PocketBase('http://localhost:8090');
const PROJECT_ID = process.env.PROJECT_ID || '${projectId}';

console.log('🔗 Connecting to PocketBase...');
console.log(\`📦 Project ID: \${PROJECT_ID}\`);

// Helper: Get collection name with project prefix
function getCollectionName(name) {
  return \`\${PROJECT_ID}_\${name}\`;
}

${collections.map(collection => `
// ${collection.toUpperCase()} CRUD Operations

async function get${capitalize(collection)}() {
  try {
    const records = await pb.collection(getCollectionName('${collection}')).getFullList({
      sort: '-created'
    });
    return records;
  } catch (error) {
    console.error('Error fetching ${collection}:', error);
    throw error;
  }
}

async function get${capitalize(collection)}ById(id) {
  try {
    const record = await pb.collection(getCollectionName('${collection}')).getOne(id);
    return record;
  } catch (error) {
    console.error('Error fetching ${collection} by ID:', error);
    throw error;
  }
}

async function create${capitalize(collection)}(data) {
  try {
    const record = await pb.collection(getCollectionName('${collection}')).create(data);
    return record;
  } catch (error) {
    console.error('Error creating ${collection}:', error);
    throw error;
  }
}

async function update${capitalize(collection)}(id, data) {
  try {
    const record = await pb.collection(getCollectionName('${collection}')).update(id, data);
    return record;
  } catch (error) {
    console.error('Error updating ${collection}:', error);
    throw error;
  }
}

async function delete${capitalize(collection)}(id) {
  try {
    await pb.collection(getCollectionName('${collection}')).delete(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting ${collection}:', error);
    throw error;
  }
}
`).join('\n')}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  ${collections.map(c => `
  get${capitalize(c)},
  get${capitalize(c)}ById,
  create${capitalize(c)},
  update${capitalize(c)},
  delete${capitalize(c)}`).join(',\n  ')}
};
`;
}

function generateRouteFile(collection, endpoints) {
  const capitalized = capitalize(collection);

  return `const express = require('express');
const {
  get${capitalized},
  get${capitalized}ById,
  create${capitalized},
  update${capitalized},
  delete${capitalized}
} = require('../db');

const router = express.Router();

// GET /api/${collection} - Fetch all
router.get('/', async (req, res, next) => {
  try {
    const items = await get${capitalized}();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// GET /api/${collection}/:id - Fetch one
router.get('/:id', async (req, res, next) => {
  try {
    const item = await get${capitalized}ById(req.params.id);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/${collection} - Create
router.post('/', async (req, res, next) => {
  try {
    const item = await create${capitalized}(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// PUT /api/${collection}/:id - Update
router.put('/:id', async (req, res, next) => {
  try {
    const item = await update${capitalized}(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/${collection}/:id - Delete
router.delete('/:id', async (req, res, next) => {
  try {
    await delete${capitalized}(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
`;
}

function generateApiPackageJson(projectId) {
  return JSON.stringify({
    name: `${projectId}-api`,
    version: '1.0.0',
    description: 'Express API server',
    main: 'server.js',
    scripts: {
      start: 'node server.js',
      dev: 'nodemon server.js'
    },
    dependencies: {
      express: '^4.18.2',
      cors: '^2.8.5',
      pocketbase: '^0.21.3'
    },
    devDependencies: {
      nodemon: '^3.0.1'
    }
  }, null, 2);
}

function groupEndpointsByCollection(endpoints) {
  const groups = {};

  endpoints.forEach(ep => {
    if (!groups[ep.collection]) {
      groups[ep.collection] = [];
    }
    groups[ep.collection].push(ep);
  });

  return groups;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

---

## PHASE 2: EDITOR WORKFLOW INTEGRATION (Week 4)

### Current State (Post Fixes 46-50)

**Editor Node:** ✅ Fully functional
- Location: [lib/langgraph/nodes/editor-node.ts](../../lib/langgraph/nodes/editor-node.ts)
- Features:
  - ✅ Smart file targeting (Fix 48)
  - ✅ File marker parsing with slashes (Fix 49)
  - ✅ TypeScript requirements in prompt (Fix 50)
  - ✅ Comprehensive logging (Fix 46)
  - ✅ Multi-file support
  - ✅ File creation/deletion/rename
  - ✅ Reference updates across files
  - ✅ Database code preservation

**Context Analyzer:** ✅ Fully functional
- Location: [lib/langgraph/nodes/context-analyzer-node.ts](../../lib/langgraph/nodes/context-analyzer-node.ts)
- Determines change scope (minor, moderate, major)
- Identifies files to modify
- Selects editing strategy (targeted-diff, component-level, architecture-level)

**QA Node:** ✅ Enhanced with TypeScript validation
- Location: [lib/langgraph/nodes/qa-node.ts](../../lib/langgraph/nodes/qa-node.ts)
- HTML validation for .html files
- TypeScript validation for .ts/.tsx files (Fix 50)
- Triggers AutoGen debugging if errors found
- Comprehensive error logging

**Editing Workflow:** ✅ Complete but separate
- Location: [lib/langgraph/workflows/editing-workflow.ts](../../lib/langgraph/workflows/editing-workflow.ts)
- Flow: Context Analyzer → Editor → QA → VFS Persistence
- **NOT integrated** into main workflow yet

### Integration Plan

**Add Conditional Edge to Main Workflow:**

**File:** [lib/langgraph/workflow.ts](../../lib/langgraph/workflow.ts)

```typescript
// Import editor nodes
import { contextAnalyzerNode } from './nodes/context-analyzer-node';
import { editorNode } from './nodes/editor-node';

// ... existing imports

export function createAppGenWorkflow() {
  const workflow = new StateGraph<AppGenState>({
    channels: {
      // ... existing channels
    }
  });

  // Add all existing nodes (founder, pm, ux, backend, frontend, qa, devops)
  // ... existing node additions

  // NEW: Add editor nodes
  workflow.addNode('context-analyzer', contextAnalyzerNode);
  workflow.addNode('editor', editorNode);

  // CRITICAL: Add conditional edge at START
  workflow.addConditionalEdges('__start__', (state) => {
    // Check if editing existing project
    if (state.editingSession && state.files && state.files.length > 0) {
      console.log('🔀 [Workflow] Routing to EDITOR workflow (existing project)');
      console.log(`🔀 [Workflow]   Files loaded: ${state.files.length}`);
      console.log(`🔀 [Workflow]   Edit request: "${state.editingSession.userRequest}"`);
      return 'context-analyzer';
    }

    // Otherwise, full generation
    console.log('🔀 [Workflow] Routing to GENERATION workflow (new project)');
    return 'founder';
  });

  // Connect editor path
  workflow.addEdge('context-analyzer', 'editor');
  workflow.addEdge('editor', 'qa'); // Reuse existing QA node
  workflow.addEdge('qa', 'devops'); // Reuse existing DevOps node

  // ... existing edges remain unchanged

  return workflow.compile({
    checkpointer: new MemorySaver()
  });
}
```

**Complete Flow Diagram:**
```
START
  ↓
Edit Mode Check
  ├─► [NEW PROJECT] → Founder → PM → UX → Backend → Frontend → QA → DevOps → END
  └─► [EDIT MODE] → Context Analyzer → Editor → QA → DevOps → END
```

### Trigger Edit Mode from UI

**File:** [app/project/[id]/page.tsx](../../app/project/[id]/page.tsx) (or chat interface)

```typescript
// When user sends edit request
async function handleEditRequest(userMessage: string) {
  // Load existing files from PocketBase
  const project = await pb.collection('projects').getOne(projectId);
  const existingFiles = await pb.collection('project_files')
    .getFullList({ filter: `projectId = "${projectId}"` });

  // Trigger editing workflow
  const response = await fetch('/api/langgraph/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      userDescription: userMessage, // User's edit request
      files: existingFiles.map(f => ({ path: f.path, content: f.content })),
      editingSession: {
        userRequest: userMessage,
        originalFiles: existingFiles.map(f => ({ path: f.path, content: f.content })),
        conversationHistory: messages,
        changeScope: 'unknown', // Context Analyzer determines this
        timestamp: Date.now()
      }
    })
  });

  const result = await response.json();

  // Handle response (show updated project)
  console.log('✅ Edit completed:', result);
}
```

---

## PHASE 3: CONVERSATIONAL FEATURES (Weeks 5-8)

**NEW: This phase adds human-like interaction capabilities to the editor.**

### Overview

Make editing truly conversational by:
1. **Detecting when user input is needed** (API keys, code snippets, clarifications)
2. **Asking clarification questions** when requests are ambiguous
3. **Providing rollback UI** for each edit checkpoint
4. **Storing conversation context** in PocketBase for persistence

### Architecture

**New Subnode: Input Detector**

**File:** [lib/langgraph/nodes/input-detector-node.ts](../../lib/langgraph/nodes/input-detector-node.ts) (NEW)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { AppGenState } from '../types';

/**
 * INPUT DETECTOR NODE
 *
 * Analyzes user requests to detect if external input is needed:
 * - API keys (Stripe, OpenAI, etc.)
 * - Code snippets (existing components to integrate)
 * - Environment variables
 * - Clarifications (ambiguous requirements)
 *
 * If input needed, returns a question to ask the user.
 * If no input needed, continues to Context Analyzer.
 */
export async function inputDetectorNode(state: AppGenState): Promise<Partial<AppGenState>> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 INPUT DETECTOR - Analyzing user request');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const userRequest = state.editingSession?.userRequest || state.userDescription;

  console.log(`[Input Detector] 📝 User Request: "${userRequest}"`);

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are an Expert Requirements Analyzer. Analyze this user request and determine if ANY external input is needed before proceeding.

USER REQUEST:
"${userRequest}"

EXISTING PROJECT FILES:
${state.files?.map(f => f.path).join('\n') || 'No files loaded'}

CONVERSATION HISTORY:
${state.editingSession?.conversationHistory?.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n') || 'No history'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETECT IF ANY OF THESE ARE NEEDED:

1. **API Keys/Tokens** - External service credentials
   - Examples: Stripe API key, OpenAI API key, Google Maps API key
   - Patterns: "integrate Stripe", "add OpenAI chat", "use Google Maps"

2. **Code Snippets** - Existing code user wants to integrate
   - Examples: Legacy component, custom function, third-party widget
   - Patterns: "integrate my existing component", "use this code", "add this function"

3. **Environment Variables** - Configuration values
   - Examples: Database URL, app name, feature flags
   - Patterns: "connect to my database", "use my domain"

4. **Clarifications** - Ambiguous or conflicting requirements
   - Examples: "What color scheme?", "Which page should this go on?", "Replace or add?"
   - Patterns: Vague requests, multiple possible interpretations

5. **Design Specifications** - Missing visual details
   - Examples: Exact pixel sizes, specific color codes, layout preferences
   - Patterns: "make it bigger", "change the style" (without specifics)

OUTPUT FORMAT (JSON):
\`\`\`json
{
  "needsInput": true/false,
  "inputType": "api_key" | "code_snippet" | "env_var" | "clarification" | "design_spec" | null,
  "question": "Exact question to ask user (if needsInput = true)",
  "reasoning": "Why this input is needed",
  "canProceedWithout": true/false // Can we make reasonable assumptions?
}
\`\`\`

EXAMPLES:

User: "Integrate Stripe payments"
→ { "needsInput": true, "inputType": "api_key", "question": "I'll integrate Stripe payments. Please provide your Stripe API key (starts with sk_test_ or sk_live_).", "reasoning": "Stripe requires API key for initialization", "canProceedWithout": false }

User: "Change the button color"
→ { "needsInput": true, "inputType": "design_spec", "question": "What color would you like for the button? (e.g., 'blue', '#3B82F6', or 'rgb(59, 130, 246)')", "reasoning": "No specific color mentioned", "canProceedWithout": true }

User: "Add a contact form"
→ { "needsInput": false, "inputType": null, "question": null, "reasoning": "Standard contact form can be built without additional input", "canProceedWithout": true }

RULES:
- ONLY ask if truly necessary (prefer reasonable defaults)
- Questions must be SPECIFIC and ACTIONABLE
- If we can proceed with reasonable assumptions, set canProceedWithout = true
- Prefer to proceed rather than block user

Return ONLY the JSON, no markdown, no explanation.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  const response = message.content[0].type === 'text' ? message.content[0].text : '';

  console.log('[Input Detector] 📝 RAW AI RESPONSE:');
  console.log(response);
  console.log();

  // Parse response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.log('[Input Detector] ⚠️ Failed to parse AI response - proceeding without input');
    return { needsUserInput: false };
  }

  const analysis = JSON.parse(jsonMatch[0]);

  if (analysis.needsInput && !analysis.canProceedWithout) {
    console.log('[Input Detector] ⚠️ User input required before proceeding');
    console.log(`[Input Detector]   Type: ${analysis.inputType}`);
    console.log(`[Input Detector]   Question: "${analysis.question}"`);

    return {
      needsUserInput: true,
      userInputRequest: {
        type: analysis.inputType,
        question: analysis.question,
        reasoning: analysis.reasoning
      }
    };
  } else {
    console.log('[Input Detector] ✅ No input needed - proceeding to editing');
    if (analysis.needsInput && analysis.canProceedWithout) {
      console.log(`[Input Detector]   Note: Could ask about ${analysis.inputType}, but can proceed with defaults`);
    }

    return { needsUserInput: false };
  }
}
```

### Integration into Workflow

**File:** [lib/langgraph/workflow.ts](../../lib/langgraph/workflow.ts)

```typescript
// Add Input Detector node
workflow.addNode('input-detector', inputDetectorNode);

// Update conditional edge at START
workflow.addConditionalEdges('__start__', (state) => {
  if (state.editingSession && state.files && state.files.length > 0) {
    console.log('🔀 [Workflow] Routing to EDITOR workflow (existing project)');
    return 'input-detector'; // NEW: Go to input detector first
  }

  console.log('🔀 [Workflow] Routing to GENERATION workflow (new project)');
  return 'founder';
});

// Add conditional edge from Input Detector
workflow.addConditionalEdges('input-detector', (state) => {
  if (state.needsUserInput) {
    console.log('🔀 [Workflow] User input required - pausing workflow');
    return '__end__'; // Pause and wait for user response
  }

  console.log('🔀 [Workflow] No input needed - continuing to Context Analyzer');
  return 'context-analyzer';
});

// Connect rest of editor path (unchanged)
workflow.addEdge('context-analyzer', 'editor');
workflow.addEdge('editor', 'qa');
workflow.addEdge('qa', 'devops');
```

### UI for Conversational Features

**File:** [app/project/[id]/page.tsx](../../app/project/[id]/page.tsx)

```typescript
// Handle user input request from workflow
function renderMessage(message: Message) {
  // Regular message
  if (message.type === 'assistant' && !message.userInputRequest) {
    return <div className="assistant-message">{message.content}</div>;
  }

  // User input request
  if (message.type === 'assistant' && message.userInputRequest) {
    return (
      <div className="input-request">
        <div className="question">{message.userInputRequest.question}</div>

        {message.userInputRequest.type === 'api_key' && (
          <input
            type="password"
            placeholder="Enter API key..."
            className="api-key-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUserInput(e.currentTarget.value, message.userInputRequest.type);
              }
            }}
          />
        )}

        {message.userInputRequest.type === 'code_snippet' && (
          <textarea
            placeholder="Paste your code here..."
            className="code-snippet-input"
            rows={10}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleUserInput(e.currentTarget.value, message.userInputRequest.type);
              }
            }}
          />
        )}

        {message.userInputRequest.type === 'clarification' && (
          <input
            type="text"
            placeholder="Your answer..."
            className="clarification-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUserInput(e.currentTarget.value, message.userInputRequest.type);
              }
            }}
          />
        )}

        {message.userInputRequest.type === 'design_spec' && (
          <div className="design-spec-input">
            <input
              type="text"
              placeholder="e.g., blue, #3B82F6, or rgb(59, 130, 246)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUserInput(e.currentTarget.value, message.userInputRequest.type);
                }
              }}
            />
            <div className="design-spec-helper">
              Or pick a color: <input type="color" onChange={(e) => handleUserInput(e.target.value, 'design_spec')} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // User message
  return <div className="user-message">{message.content}</div>;
}

async function handleUserInput(value: string, type: string) {
  // Resume workflow with user-provided input
  const response = await fetch('/api/langgraph/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      resumeFrom: 'input-detector',
      userInput: {
        type,
        value
      },
      editingSession: {
        ...currentEditingSession,
        userProvidedInput: { type, value }
      }
    })
  });

  // Continue workflow from Context Analyzer
  const result = await response.json();
  console.log('✅ Workflow resumed with user input:', result);
}
```

### Checkpoint System for Rollback

**Activate Existing Checkpointer:**

The infrastructure already exists in LangGraph:
```typescript
const workflow = createAppGenWorkflow();
const app = workflow.compile({
  checkpointer: new MemorySaver() // Already exists!
});
```

**Add Checkpoint Snapshots:**

**File:** [lib/langgraph/nodes/editor-node.ts](../../lib/langgraph/nodes/editor-node.ts)

```typescript
// After successful edit (around line 600)

// Create checkpoint snapshot
const checkpoint = {
  id: `checkpoint_${Date.now()}`,
  projectId: state.projectId,
  timestamp: Date.now(),
  userRequest: state.editingSession?.userRequest,
  filesSnapshot: state.files, // Current state
  previousFilesSnapshot: state.editingSession?.originalFiles, // Before edit
  changeScope: state.editingSession?.changeScope,
  description: `Edit: ${state.editingSession?.userRequest}`
};

// Save checkpoint to PocketBase
await pb.collection('workflow_checkpoints').create(checkpoint);

console.log('[Editor] ✅ Checkpoint created:', checkpoint.id);

return {
  ...state,
  lastCheckpointId: checkpoint.id
};
```

**Rollback UI:**

**File:** [app/project/[id]/page.tsx](../../app/project/[id]/page.tsx)

```typescript
// Fetch checkpoints for project
const checkpoints = await pb.collection('workflow_checkpoints')
  .getFullList({ filter: `projectId = "${projectId}"`, sort: '-created' });

// Render checkpoint list
<div className="checkpoints-sidebar">
  <h3>Edit History</h3>
  {checkpoints.map(checkpoint => (
    <div key={checkpoint.id} className="checkpoint-item">
      <div className="checkpoint-description">{checkpoint.description}</div>
      <div className="checkpoint-time">{formatTime(checkpoint.timestamp)}</div>
      <button
        onClick={() => handleRollback(checkpoint.id)}
        className="rollback-button"
      >
        Rollback to this version
      </button>
    </div>
  ))}
</div>

// Rollback handler
async function handleRollback(checkpointId: string) {
  const checkpoint = await pb.collection('workflow_checkpoints').getOne(checkpointId);

  // Restore files from checkpoint
  const restoreFiles = checkpoint.previousFilesSnapshot;

  // Trigger deployment with restored files
  const response = await fetch(`http://localhost:4000/deploy/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      files: restoreFiles
    })
  });

  if (response.ok) {
    console.log('✅ Rolled back to checkpoint:', checkpointId);
    // Refresh UI
  }
}
```

---

## FILES TO MODIFY (Complete List)

### Phase 1: Backend Integration (Weeks 1-4)

1. **[lib/langgraph/nodes/backend-node.ts](../../lib/langgraph/nodes/backend-node.ts)**
   - Status: Completely disabled
   - Changes: Complete rewrite - generate Express API config
   - Lines: ~250 lines (new implementation)
   - Priority: CRITICAL

2. **[deployment-server/server.js](../../deployment-server/server.js)**
   - Changes: Add API server manager (spawn/kill/health check)
   - Lines: ~200 lines added
   - Priority: CRITICAL

3. **[deployment-server/nextjs-scaffold.js](../../deployment-server/nextjs-scaffold.js)**
   - Changes: Add Express server templates
   - Lines: ~400 lines added
   - Priority: CRITICAL

4. **[lib/langgraph/nodes/pm-node.ts](../../lib/langgraph/nodes/pm-node.ts)**
   - Changes: Add backend detection logic
   - Lines: ~50 lines added
   - Priority: HIGH

5. **[lib/langgraph/nodes/devops-node.ts](../../lib/langgraph/nodes/devops-node.ts)**
   - Changes: Trigger API deployment (include backendConfig)
   - Lines: ~15 lines modified
   - Priority: HIGH
   - Note: Already has Fix 47 (file deduplication)

6. **[lib/langgraph/nodes/frontend-node-nextjs.ts](../../lib/langgraph/nodes/frontend-node-nextjs.ts)**
   - Changes: Generate API client code
   - Lines: ~150 lines added
   - Priority: HIGH

7. **[lib/langgraph/types.ts](../../lib/langgraph/types.ts)**
   - Changes: Add BackendConfig interface
   - Lines: ~30 lines added
   - Priority: MEDIUM

### Phase 2: Editor Integration (Week 4)

8. **[lib/langgraph/workflow.ts](../../lib/langgraph/workflow.ts)**
   - Changes: Add conditional edges, connect editor path
   - Lines: ~30 lines added
   - Priority: HIGH

9. **[app/project/[id]/page.tsx](../../app/project/[id]/page.tsx)** (or chat interface)
   - Changes: Add edit mode trigger button/UI
   - Lines: ~50 lines added
   - Priority: MEDIUM

### Phase 3: Conversational Features (Weeks 5-8)

10. **[lib/langgraph/nodes/input-detector-node.ts](../../lib/langgraph/nodes/input-detector-node.ts)** (NEW)
    - Status: Does not exist yet
    - Changes: Create new node for detecting user input needs
    - Lines: ~200 lines
    - Priority: MEDIUM

11. **[lib/langgraph/nodes/editor-node.ts](../../lib/langgraph/nodes/editor-node.ts)**
    - Changes: Add checkpoint snapshot creation
    - Lines: ~30 lines added
    - Priority: LOW
    - Note: Already has Fixes 46, 48, 49, 50

12. **[lib/langgraph/workflow.ts](../../lib/langgraph/workflow.ts)**
    - Changes: Add input-detector node and conditional edges
    - Lines: ~20 lines added
    - Priority: MEDIUM

13. **[app/project/[id]/page.tsx](../../app/project/[id]/page.tsx)**
    - Changes: Add UI for user input requests and rollback
    - Lines: ~150 lines added
    - Priority: MEDIUM

---

## IMPLEMENTATION SEQUENCE

### Week 1: Backend Core (API Generation)
**Goal:** Generate Express API code from PM plan

1. Implement backend-node.ts
   - Add AI prompt for API structure generation
   - Parse AI response to extract collections/endpoints
   - Return BackendConfig object
   - Test: Generate config for "task manager app"

2. Update types.ts
   - Add BackendConfig interface
   - Add apiEndpoints, collections types

3. Update PM node
   - Add backend detection function
   - Announce backend decision in plan
   - Test: "Build a todo app" → needsBackend = true

**Deliverable:** Backend node generates API config JSON

---

### Week 2: Backend Deployment (API Server Manager)
**Goal:** Deploy and run Express API servers

4. Update deployment-server/server.js
   - Add port allocation system
   - Implement startApiServer() function
   - Implement stopApiServer() function
   - Add health check endpoint
   - Test: Start/stop API server manually

5. Update nextjs-scaffold.js
   - Add Express server template generation
   - Add database client template
   - Add route file templates
   - Test: Generate scaffold with backend config

6. Test end-to-end
   - Generate app with backend
   - Deploy to deployment server
   - API server starts automatically
   - Health check responds

**Deliverable:** API servers run on dynamic ports (5000-6000)

---

### Week 3: Frontend Integration (API Client)
**Goal:** Frontend can call backend APIs

7. Update frontend-node-nextjs.ts
   - Detect backendConfig in state
   - Generate API client code (src/lib/api.ts)
   - Generate .env.local with API URL
   - Test: API client has correct functions

8. Update devops-node.ts
   - Include backendConfig in deployment request
   - Log backend deployment trigger
   - Test: Backend config reaches deployment server

9. Test end-to-end
   - Generate "task manager with users"
   - Frontend has API client
   - Frontend calls backend APIs
   - Data persists to PocketBase

**Deliverable:** Full stack app works (frontend → API → database)

---

### Week 4: Editor Integration
**Goal:** Editing workflow connected to main workflow

10. Update workflow.ts
    - Add conditional edge at START
    - Add editor nodes (context-analyzer, editor)
    - Connect editor path to QA/DevOps
    - Test: Edit mode triggers correctly

11. Update UI (app/project/[id]/page.tsx)
    - Add edit mode trigger
    - Load existing files
    - Send editingSession to workflow
    - Test: Edit request routes to editor path

12. Test editing scenarios
    - Minor edit: Change button color
    - Moderate edit: Add new page
    - Major edit: Add new API endpoint
    - Test: All edits deploy successfully

**Deliverable:** Editing workflow fully integrated

---

### Week 5-6: Conversational Features (User Input)
**Goal:** Editor can ask user for input

13. Create input-detector-node.ts
    - Build AI prompt for input detection
    - Detect API keys, code snippets, clarifications
    - Return question if input needed
    - Test: "Integrate Stripe" → asks for API key

14. Update workflow.ts
    - Add input-detector node
    - Add conditional edge (pause if input needed)
    - Test: Workflow pauses for user input

15. Update UI
    - Render input request UI
    - Handle user response
    - Resume workflow with input
    - Test: User provides API key → workflow continues

**Deliverable:** Editor asks questions when needed

---

### Week 7-8: Rollback & Polish
**Goal:** Users can rollback to previous versions

16. Activate checkpoint system
    - Create checkpoint after each edit
    - Save to workflow_checkpoints collection
    - Test: Checkpoints appear in database

17. Build rollback UI
    - Fetch checkpoints for project
    - Display edit history
    - Rollback button restores files
    - Test: Rollback restores previous state

18. Polish & documentation
    - Error handling for all edge cases
    - Process crash recovery (auto-restart)
    - Port recycling on project deletion
    - Health monitoring dashboard (optional)
    - Write user documentation

**Deliverable:** Full conversational editor with rollback

---

## TESTING CHECKLIST

### Backend Integration Tests
- [ ] Generate app with backend (users CRUD API)
- [ ] Frontend successfully calls API endpoints
- [ ] Data persists to PocketBase with project prefix
- [ ] Multiple projects run simultaneously (different ports)
- [ ] Port allocation works (5000-6000 range)
- [ ] API server survives deployment server restart
- [ ] Port releases on project deletion
- [ ] CORS works for all HTTP methods (GET, POST, PUT, DELETE)
- [ ] Health check endpoint responds
- [ ] Auto-restart works after crash

### Editor Workflow Tests (Post Fixes 46-50)
- [ ] Edit mode: Change button color (minor edit) ✅ Already works
- [ ] Edit mode: Add new page (file creation) ✅ Already works
- [ ] Edit mode: Add new API endpoint (backend change)
- [ ] Edit mode: Remove feature (file deletion) ✅ Already works
- [ ] Edit mode: Rename component (reference updates) ✅ Already works
- [ ] Database code preserved during edits ✅ Already works
- [ ] Navigation preserved during edits ✅ Already works
- [ ] Multi-file changes work correctly ✅ Already works
- [ ] QA validation runs after editing ✅ Already works
- [ ] TypeScript errors caught before deployment ✅ Already works (Fix 50)
- [ ] Redeploys successfully after edit ✅ Already works

### Conversational Features Tests
- [ ] Input Detector: Detects API key requirement
- [ ] Input Detector: Detects clarification need
- [ ] Input Detector: Proceeds without input when possible
- [ ] UI: Renders input request correctly
- [ ] UI: Handles user response
- [ ] Workflow: Resumes after user input
- [ ] Checkpoint: Created after each edit
- [ ] Rollback: Restores previous version
- [ ] Rollback: Re-deploys successfully

### Integration Tests
- [ ] Generate static app → upgrade to backend via edit
- [ ] Generate backend app → edit frontend (API server stays running)
- [ ] Generate backend app → edit backend (API server restarts)
- [ ] Edit with user input request → user provides input → edit completes
- [ ] Multiple users editing different projects simultaneously
- [ ] Rollback → edit again → checkpoint history preserved

---

## EDGE CASES & SOLUTIONS

### Backend Integration

1. **Port Exhaustion (1000 projects max)**
   - Solution: Port recycling on project deletion
   - Implementation: `releasePort()` called in delete endpoint
   - Status: Documented in Week 2

2. **API Server Crashes**
   - Solution: Auto-restart with exponential backoff
   - Implementation: Watch process.on('exit'), respawn after delay
   - Max restarts: 3 attempts
   - Status: Documented in Week 7-8

3. **CORS Preflight Failures**
   - Solution: Handle OPTIONS in Express middleware
   - Implementation: `cors()` package handles automatically
   - Status: Included in Express template

4. **Concurrent Deployments**
   - Solution: Lock mechanism (already exists)
   - Implementation: `activeDeployments` Set in server.js
   - Status: ✅ Already handled

5. **Database Conflicts**
   - Solution: PocketBase multi-tenancy with `projectId_` prefix
   - Implementation: Already working
   - Status: ✅ No changes needed

6. **Environment Variables in Static Export**
   - Solution: Inject at build time into `.env.local`
   - Implementation: Generate .env.local in scaffold
   - Status: Documented in Week 3

### Editor Integration

7. **Database Code Removal**
   - Solution: `preservedSections` map (already implemented)
   - Status: ✅ Already handled by editor-node.ts (Fix 46-50)

8. **File Rename Cascades**
   - Solution: `updateFileReferences()` (already implemented)
   - Status: ✅ Already handled by editor-node.ts

9. **Multi-File Edits**
   - Solution: Context analyzer identifies all affected files
   - Status: ✅ Already handled by context-analyzer-node.ts

10. **Conflicting Edits**
    - Solution: File creation detection warns about overwrites
    - Status: ✅ Already handled by editor-node.ts

### Conversational Features

11. **User Abandons Input Request**
    - Solution: Timeout after 5 minutes, proceed with defaults
    - Implementation: Add timeout check in workflow
    - Status: To be implemented in Week 5

12. **Invalid User Input (Bad API Key)**
    - Solution: Validate input before continuing
    - Implementation: Add validation step after user input
    - Status: To be implemented in Week 6

13. **Rollback to Non-Existent Checkpoint**
    - Solution: Validate checkpoint exists before rollback
    - Implementation: Check PocketBase before restoring
    - Status: To be implemented in Week 7

14. **Checkpoint Storage Growth**
    - Solution: Limit to 10 checkpoints per project (keep latest)
    - Implementation: Delete old checkpoints in cron job
    - Status: To be implemented in Week 8

---

## SUCCESS CRITERIA

### Backend Integration (Phase 1)
✅ User generates app with "user management" → Gets working CRUD API
✅ Data persists to PocketBase with project prefix
✅ API server runs on dynamic port (5000-6000)
✅ User deploys 10 apps simultaneously → All work on different ports
✅ API server crashes → Auto-restarts within 5 seconds
✅ User deletes project → API server stops, port freed

### Editor Integration (Phase 2)
✅ User clicks "change primary color to green" → Color updates, database preserved
✅ User says "add a blog page" → New page created, navigation updated
✅ Static app upgraded to backend → Works seamlessly
✅ Backend app edited → API server restarts if needed

### Conversational Features (Phase 3)
✅ User says "integrate Stripe" → Editor asks for API key
✅ User provides API key → Integration continues automatically
✅ User makes edit → Checkpoint created
✅ User clicks "rollback" → Previous version restored and deployed
✅ User request ambiguous → Editor asks clarifying question

---

## DELIVERABLES

1. **Working backend generation** - Express APIs deployed per project
2. **Seamless editing** - Iterative changes without full regeneration
3. **Full integration** - Frontend → API → PocketBase working end-to-end
4. **Process management** - Stable, auto-recovering API servers
5. **Conversational editor** - Human-like interaction with users
6. **Rollback system** - Users can undo changes
7. **Developer experience** - Simple, intuitive, no over-engineering
8. **Documentation** - Clear guides for users and developers

---

## TIMELINE

**Estimated Total:** 8 weeks for complete implementation

- **Week 1:** Backend core (API generation, backend-node.ts)
- **Week 2:** Backend deployment (API server manager, port allocation)
- **Week 3:** Frontend integration (API client, CORS, env vars)
- **Week 4:** Editor integration (conditional routing, UI triggers)
- **Week 5-6:** Conversational features (input detection, user questions)
- **Week 7-8:** Rollback & polish (checkpoints, error handling, docs)

---

## RISK ASSESSMENT

**Risk Level:** Medium

**Mitigations:**
- ✅ Well-understood technologies (Express, child_process)
- ✅ Incremental approach (can test each phase)
- ✅ Editor node already complete (Fixes 46-50 applied)
- ✅ Backend optional (can disable if issues arise)
- ✅ Existing deployment infrastructure works (minimal changes)
- ✅ TypeScript validation prevents build failures (Fix 50)
- ✅ File deduplication prevents deployment corruption (Fix 47)

**Rollback Plan:**
- Backend generation can be disabled without breaking existing functionality
- Editor workflow can run separately if integration fails
- Static-only mode remains fully functional
- Conversational features are optional (can be disabled)

---

## NEXT STEPS

**Implementation Start (Next Chat Session):**

1. Review this updated plan
2. Confirm all RULES are understood
3. Start Week 1: Implement backend-node.ts
4. Set up testing environment
5. Create first test: "Build a task manager app" → Backend generated

**Questions Resolved:**
1. ✅ Backend-first approach confirmed (RULE 1)
2. ✅ Auto-detection (no asking user)
3. ✅ Conversational features in Phase 3
4. ✅ All recent fixes (46-50) documented

**Questions Remaining:**
1. Should API servers auto-stop after inactivity (cost saving)?
2. Do we need a dashboard to view all running API servers?
3. Should we log API server output to files or just console?

---

## REFERENCES

**Key Files (Current State):**
- [lib/langgraph/nodes/backend-node.ts](../../lib/langgraph/nodes/backend-node.ts) - Currently disabled
- [lib/langgraph/nodes/editor-node.ts](../../lib/langgraph/nodes/editor-node.ts) - ✅ Fully functional (Fixes 46, 48, 49, 50)
- [lib/langgraph/nodes/context-analyzer-node.ts](../../lib/langgraph/nodes/context-analyzer-node.ts) - ✅ Fully functional
- [lib/langgraph/nodes/qa-node.ts](../../lib/langgraph/nodes/qa-node.ts) - ✅ Enhanced with TypeScript validation (Fix 50)
- [lib/langgraph/nodes/devops-node.ts](../../lib/langgraph/nodes/devops-node.ts) - ✅ Has file deduplication (Fix 47)
- [lib/langgraph/workflows/editing-workflow.ts](../../lib/langgraph/workflows/editing-workflow.ts) - ✅ Complete editing workflow
- [lib/langgraph/workflow.ts](../../lib/langgraph/workflow.ts) - Main generation workflow (needs conditional routing)
- [lib/validation/typescript-validator.ts](../../lib/validation/typescript-validator.ts) - ✅ NEW (Fix 50)
- [lib/validation/index.ts](../../lib/validation/index.ts) - ✅ Integrated TypeScript validation (Fix 50)
- [deployment-server/server.js](../../deployment-server/server.js) - Needs API server manager
- [deployment-server/nextjs-scaffold.js](../../deployment-server/nextjs-scaffold.js) - Needs Express templates

**Related Documents:**
- [docs/FIX_46_COMPREHENSIVE_LOGGING.md](../FIX_46_COMPREHENSIVE_LOGGING.md) - Logging system
- [docs/FIX_47_DUPLICATE_GLOBALS_CSS.md](../FIX_47_DUPLICATE_GLOBALS_CSS.md) - File deduplication
- [docs/FIX_48_AI_RETURNING_WRONG_FILES.md](../FIX_48_AI_RETURNING_WRONG_FILES.md) - Explicit file targeting
- [docs/FIX_49_FILE_MARKER_REGEX.md](../FIX_49_FILE_MARKER_REGEX.md) - Regex slash support
- [docs/FIX_50_TYPESCRIPT_VALIDATION.md](../FIX_50_TYPESCRIPT_VALIDATION.md) - TypeScript validation

---

**End of Plan Document**

**Status:** ✅ READY FOR EXECUTION

*This plan is fully updated with current state (Fixes 46-50), incorporates all RULES, includes conversational features architecture, and is ready for implementation in the next chat session.*

*Start with Week 1: Implement backend-node.ts*
