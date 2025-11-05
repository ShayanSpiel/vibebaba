// @ts-nocheck
// lib/langgraph/nodes/backend-node.ts
import type { AppGenState } from '../types';
import { emitNodeStart, emitNodeComplete, emitNodeError, emitProgress } from '../events';
import { generateWithLogging, estimateTokens } from '@/lib/langgraph/ai-with-logging';
import { safeJsonParse } from '../utils/json-parser';
import { getConversationContext, addAssistantMessage, conversationMemoryStore } from '@/lib/memory/conversation-memory';

/**
 * BACKEND NODE
 *
 * Generates Express API server configuration for projects requiring data persistence.
 * Uses AI to generate contextual API endpoints based on PM plan.
 *
 * RULE 1: Only generates if needsBackend = true (database-first approach)
 * RULE 5: Comprehensive logging with emoji prefixes
 */
export async function backendNode(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 BACKEND NODE - Express API Generation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // RULE 1: Check if backend is needed
    console.log('[Backend] 🔍 Checking backend requirements...');
    console.log('[Backend] 🔍 state.context:', JSON.stringify(state.context, null, 2));
    console.log('[Backend] 🔍 state.context?.pmPlan:', JSON.stringify(state.context?.pmPlan, null, 2));
    console.log('[Backend] 🔍 state.context?.pmPlan?.needsBackend:', state.context?.pmPlan?.needsBackend);

    const needsBackend = state.context?.pmPlan?.needsBackend ?? false;
    console.log('[Backend] 🔍 needsBackend flag:', needsBackend);

    if (!needsBackend) {
      console.log('[Backend] 📦 Backend not needed - skipping API generation');
      console.log('[Backend] ✅ Static-only app\n');

      const duration = Date.now() - startTime;
      emitNodeComplete('backend', state, duration, {
        taskDescription: 'Backend analysis completed',
        success: true,
        output: { status: 'skipped' },
        summary: 'Static export mode - no backend needed'
      });

      return {
        backendConfig: undefined,
        completedNodes: ['backend'] // Reducer auto-appends to existing array
      };
    }

    console.log('[Backend] ✅ Backend required - generating Express API');
    console.log(`[Backend] 📋 Project: ${state.projectId}`);
    console.log(`[Backend] 📝 User Request: ${state.userDescription}\n`);

    // CONVERSATION MEMORY: Get conversation context for multi-turn editing
    console.log('[Backend] 💬 Loading conversation memory...');
    const conversationContext = getConversationContext(state.projectId);
    if (conversationContext) {
      console.log('[Backend] 💬 Conversation context loaded - enabling multi-turn editing');
    }

    emitNodeStart('backend', state, {
      userInput: state.userDescription,
      interpretation: 'Generating Express API with RESTful endpoints for data persistence',
      plan: 'Creating database collections and API routes based on app requirements'
    });

    // Build prompt for AI (with conversation context)
    const prompt = buildBackendPrompt(state, conversationContext);

    console.log('[Backend] 🤖 Calling AI for API endpoint generation...');
    emitProgress('backend', state.projectId, 'Generating API structure...');

    const estimatedTokens = estimateTokens(prompt);
    console.log(`[Backend] 🤖 AI Call: API Generation (~${estimatedTokens} tokens)`);

    const response = await generateWithLogging({
      prompt,
      projectId: state.projectId,
      nodeName: 'backend',
      callType: 'generation',
      estimatedTokens,
      attempt: 1
    });

    // RULE 5: Log raw AI response (first 500 chars for debugging)
    console.log('[Backend] 📝 RAW AI RESPONSE (first 500 chars):');
    console.log(response.substring(0, 500));
    console.log('...\n');

    // Parse AI response
    const backendConfig = parseBackendResponse(response, state.projectId);

    console.log('[Backend] ✅ Backend config generated:');
    console.log(`[Backend]   📊 Collections: ${backendConfig.collections.map(c => c.name).join(', ')}`);
    console.log(`[Backend]   📄 Pages: ${backendConfig.pages?.map(p => p.route).join(', ') || 'none'}`);
    console.log(`[Backend]   🔗 API Endpoints: ${backendConfig.apiEndpoints?.length || 0}`);
    backendConfig.collections.forEach(col => {
      console.log(`[Backend]     • ${col.name}: ${col.fields.map(f => f.name).join(', ')}`);
    });
    if (backendConfig.apiEndpoints && backendConfig.apiEndpoints.length > 0) {
      backendConfig.apiEndpoints.forEach(ep => {
        console.log(`[Backend]     → ${ep.method} ${ep.path}`);
      });
    }
    console.log();

    // CONVERSATION MEMORY: Track Backend's response
    const backendResponse = `Generated backend with ${backendConfig.collections.length} collections: ${backendConfig.collections.map(c => c.name).join(', ')}. Created ${backendConfig.apiEndpoints?.length || 0} API endpoints.`;
    addAssistantMessage(state.projectId, backendResponse, 'backend');
    console.log('[Backend] 💬 Tracked assistant response in conversation memory');

    // 💾 Save memory checkpoint after backend config generation
    await conversationMemoryStore.saveMemory(state.projectId);
    console.log('[Backend] 💾 Checkpoint saved after backend config generation');

    const duration = Date.now() - startTime;
    emitNodeComplete('backend', state, duration, {
      taskDescription: 'Generated backend schema with database collections and API endpoints',
      success: true,
      output: {
        collections: backendConfig.collections.length,
        pages: backendConfig.pages?.length || 0,
        endpoints: backendConfig.apiEndpoints?.length || 0
      },
      summary: `Generated ${backendConfig.collections.length} collections, ${backendConfig.apiEndpoints?.length || 0} API endpoints, and ${backendConfig.pages?.length || 0} pages`
    });

    return {
      backendConfig,
      completedNodes: ['backend'] // Reducer auto-appends to existing array
    };
  } catch (error) {
    emitNodeError('backend', error as Error, state);
    console.error('[Backend] Error:', error);

    return {
      backendConfig: undefined,
      completedNodes: ['backend'], // Reducer auto-appends
      errors: [{ node: 'backend', message: (error as Error).message }] // Reducer auto-appends
    };
  }
}

function buildBackendPrompt(state: AppGenState, conversationContext?: string): string {
  const plan = state.plan || 'No plan provided';

  // MVP FILTERING: Only build features marked for MVP
  const mvpFeatures = state.allRequestedFeatures?.filter((f: any) => f.included_in_mvp) || [];
  const mvpFeaturesList = mvpFeatures.length > 0
    ? `\n\n🎯 MVP FEATURES (ONLY BUILD THESE):\n${mvpFeatures.map((f: any) => `- ${f.name}: ${f.description}`).join('\n')}`
    : '';

  // Check if auth is required
  const userDescription = state.userDescription.toLowerCase();
  const needsAuth = userDescription.includes('auth') ||
                    userDescription.includes('login') ||
                    userDescription.includes('signup') ||
                    userDescription.includes('sign up') ||
                    userDescription.includes('register') ||
                    userDescription.includes('user account');

  const authInstructions = needsAuth ? `

🔐 AUTHENTICATION REQUIRED:
User requested authentication features. You MUST include these auth endpoints:

{
  "method": "POST",
  "path": "/api/auth/register",
  "handler": "registerUser",
  "collection": "users",
  "description": "Register a new user account"
},
{
  "method": "POST",
  "path": "/api/auth/login",
  "handler": "loginUser",
  "collection": "users",
  "description": "Authenticate user and return JWT token"
},
{
  "method": "POST",
  "path": "/api/auth/logout",
  "handler": "logoutUser",
  "collection": "users",
  "description": "Clear user session"
},
{
  "method": "GET",
  "path": "/api/auth/me",
  "handler": "getCurrentUser",
  "collection": "users",
  "description": "Get current authenticated user profile"
}

⚠️ CRITICAL: Always include "users" collection when auth is needed:
{
  "name": "users",
  "fields": [
    { "name": "email", "type": "email", "required": true },
    { "name": "password", "type": "text", "required": true },
    { "name": "username", "type": "text", "required": false }
  ]
}` : '';

  return `${conversationContext || ''}

USER REQUEST: "${state.userDescription}"

PLAN: ${plan}${mvpFeaturesList}${authInstructions}

Generate backend for what user requested. Return JSON only (no markdown):

{
  "collections": [{ "name": "leads", "fields": [{ "name": "email", "type": "email", "required": true }] }],
  "pages": [{ "name": "Home", "route": "/" }],
  "apiEndpoints": [
    {
      "method": "POST",
      "path": "/api/leads",
      "handler": "createLead",
      "collection": "leads",
      "description": "Create a new lead submission"
    },
    {
      "method": "GET",
      "path": "/api/leads",
      "handler": "getLeads",
      "collection": "leads",
      "description": "Get all leads"
    },
    {
      "method": "PUT",
      "path": "/api/leads/:id",
      "handler": "updateLead",
      "collection": "leads",
      "description": "Update a lead by ID"
    },
    {
      "method": "DELETE",
      "path": "/api/leads/:id",
      "handler": "deleteLead",
      "collection": "leads",
      "description": "Delete a lead by ID"
    }
  ]
}

🚨 CRITICAL - API ENDPOINT FORMAT:
- method: HTTP method (GET, POST, PUT, PATCH, DELETE)
- path: API route with path parameters for operations on specific items
  ✅ CORRECT for CREATE: "/api/posts" (no ID needed)
  ✅ CORRECT for GET ALL: "/api/posts" (no ID needed)
  ✅ CORRECT for UPDATE: "/api/posts/:id" (MUST include :id parameter!)
  ✅ CORRECT for DELETE: "/api/posts/:id" (MUST include :id parameter!)
  ✅ CORRECT for GET ONE: "/api/posts/:id" (MUST include :id parameter!)
- handler: Function name in camelCase (e.g., "createLead", "getLeads", "updateLead", "deleteLead")
- collection: Database collection name
- description: Human-readable description of what the endpoint does

⚠️ PATH PARAMETER REQUIREMENTS (CRITICAL):
- PUT/PATCH endpoints MUST include :id in path → "/api/posts/:id" NOT "/api/posts"
- DELETE endpoints MUST include :id in path → "/api/posts/:id" NOT "/api/posts"
- GET single item MUST include :id in path → "/api/posts/:id" NOT "/api/posts"
- POST (create) does NOT need :id → "/api/posts" is correct
- GET all items does NOT need :id → "/api/posts" is correct

⚠️ HANDLER MUST BE A VALID FUNCTION NAME:
✅ CORRECT: "handler": "createLead"
❌ WRONG: "handler": "Handles user message and returns AI response"

🎯 MVP RULES (CRITICAL):
${mvpFeatures.length > 0 ? `- ONLY build backend for MVP features listed above
- Do NOT create collections/endpoints for features not in MVP list
- Keep it minimal - ${mvpFeatures.length} feature${mvpFeatures.length > 1 ? 's' : ''} only!` : '- Build minimal MVP based on request'}
- Each MVP feature should have 1 page maximum
- Only create necessary database collections and API endpoints`;
}

function parseBackendResponse(response: string, projectId: string): NonNullable<AppGenState['backendConfig']> {
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn('[Backend] Failed to parse JSON, using fallback');
    // Fallback config
    return {
      collections: [],
      pages: [],
      projectId,
      apiEndpoints: [],
      relationships: [],
      port: null,
      needsBackend: true
    };
  }

  const parsed = safeJsonParse(jsonMatch[0], {
    collections: [],
    pages: [],
    apiEndpoints: [],
    relationships: []
  });

  return {
    collections: parsed.collections || [],
    pages: parsed.pages || [],
    apiEndpoints: parsed.apiEndpoints || [],
    projectId,
    relationships: parsed.relationships || [],
    port: null, // Assigned during deployment
    needsBackend: true
  };
}
