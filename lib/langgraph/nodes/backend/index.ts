// @ts-nocheck
// lib/langgraph/nodes/backend-node.ts
import type { AppGenState } from '../../types';
import { emitNodeStart, emitNodeComplete, emitNodeError, emitProgress } from '../../utils/logging/events';
import { generateWithLogging, estimateTokens } from '../../utils/logging/ai-with-logging';
import { safeJsonParse, extractAndParseJson } from '../../utils/json-parser';
import { addAssistantMessage, conversationMemoryStore } from '@/lib/memory/conversation-memory';
import { withLangSmithTracing, traceAICall } from '@/lib/langsmith/tracing';
import { validateFeatureBackendCompleteness, getCompletenessReport } from '@/lib/langgraph/validation/post-gen/feature-backend-completeness';
import { API_CONTRACT_SCHEMA } from '@/lib/langgraph/prompts/backend-integration';

/**
 * BACKEND NODE
 *
 * Generates Express API server configuration for projects requiring data persistence.
 * Uses AI to generate contextual API endpoints based on PM plan.
 *
 * RULE 1: Only generates if needsBackend = true (database-first approach)
 * RULE 5: Comprehensive logging with emoji prefixes
 */
async function backendNodeImpl(state: AppGenState): Promise<Partial<AppGenState>> {
  const startTime = Date.now();

  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 BACKEND NODE - Express API Generation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // INCREMENTAL MODE DETECTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const existingBackend = state.backendConfig;
    const existingCollections = existingBackend?.collections || [];
    const existingEndpoints = existingBackend?.apiEndpoints || [];
    const isIncremental = existingCollections.length > 0;

    if (isIncremental) {
      console.log('[Backend] 🔄 INCREMENTAL MODE: Adding to existing backend');
      console.log(`[Backend]   Existing collections: ${existingCollections.length}`);
      console.log(`[Backend]   Existing endpoints: ${existingEndpoints.length}`);
      console.log(`[Backend]   Collections: ${existingCollections.map(c => c.name).join(', ')}`);
    } else {
      console.log('[Backend] 🚀 NEW PROJECT MODE: Creating backend from scratch');
    }

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

    emitNodeStart('backend', state, {
      userInput: state.userDescription,
      interpretation: 'Generating Express API with RESTful endpoints for data persistence',
      plan: 'Creating database collections and API routes based on app requirements'
    });

    // Build prompt for AI (with conversation context)
    const prompt = buildBackendPrompt(state);

    console.log('[Backend] 🤖 Calling AI for API endpoint generation...');
    emitProgress('backend', state.projectId, 'Generating API structure...');

    const estimatedTokens = estimateTokens(prompt);
    console.log(`[Backend] 🤖 AI Call: API Generation (~${estimatedTokens} tokens)`);

    const response = await traceAICall('backend-api-generation', async () => {
      return await generateWithLogging({
        prompt,
        projectId: state.projectId,
        nodeName: 'backend',
        callType: 'generation',
        estimatedTokens,
        attempt: 1
      });
    }, {
      needsBackend,
      userDescription: state.userDescription,
      estimatedTokens
    });

    // RULE 5: Log raw AI response (first 500 chars for debugging)
    console.log('[Backend] 📝 RAW AI RESPONSE (first 500 chars):');
    console.log(response.substring(0, 500));
    console.log('...\n');

    // Parse AI response
    const generatedConfig = parseBackendResponse(response, state.projectId);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // INCREMENTAL MERGING: Add new collections, avoid duplicates
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let backendConfig: any;

    if (isIncremental) {
      console.log('[Backend] 🔄 Merging new collections with existing backend...');

      // Filter out duplicate collections
      const newCollections = generatedConfig.collections.filter(newCol =>
        !existingCollections.some(existing =>
          existing.name.toLowerCase() === newCol.name.toLowerCase()
        )
      );

      console.log(`[Backend]   New collections: ${newCollections.length}`);
      console.log(`[Backend]   Existing preserved: ${existingCollections.length}`);

      // Filter out duplicate endpoints
      const newEndpoints = (generatedConfig.apiEndpoints || []).filter(newEp =>
        !existingEndpoints.some(existing =>
          existing.path === newEp.path && existing.method === newEp.method
        )
      );

      console.log(`[Backend]   New endpoints: ${newEndpoints.length}`);
      console.log(`[Backend]   Existing endpoints preserved: ${existingEndpoints.length}`);

      // Merge configurations
      backendConfig = {
        ...existingBackend,
        collections: [...existingCollections, ...newCollections],
        apiEndpoints: [...existingEndpoints, ...newEndpoints],
        pages: generatedConfig.pages || existingBackend?.pages || [],
        needsBackend: true,
        projectId: state.projectId
      };

      console.log('[Backend] ✅ Merged backend config:');
      console.log(`[Backend]   Total collections: ${backendConfig.collections.length}`);
      console.log(`[Backend]   Total endpoints: ${backendConfig.apiEndpoints.length}`);
    } else {
      // New project - use generated config as-is
      backendConfig = generatedConfig;
      console.log('[Backend] ✅ New backend config generated:');
      console.log(`[Backend]   Collections: ${backendConfig.collections.map(c => c.name).join(', ')}`);
      console.log(`[Backend]   Total Endpoints: ${backendConfig.apiEndpoints?.length || 0}`);
    }

    // DEPENDENCY ASSIGNMENT: Analyze collection relationships and assign dependencies
    console.log('[Backend] 🔗 Assigning feature dependencies based on collection relationships...');
    const updatedFeatures = (state.allRequestedFeatures || []).map((feature: any) => {
      const dependencies: string[] = [];

      // Find collection for this feature
      const featureCollection = backendConfig.collections.find(c =>
        c.name.toLowerCase() === feature.name.toLowerCase().replace(/\s+/g, '_') ||
        c.name.toLowerCase() === feature.id.replace(/-/g, '_')
      );

      if (featureCollection && featureCollection.fields) {
        // Check for relation fields pointing to other collections
        featureCollection.fields.forEach((field: any) => {
          if (field.type === 'relation') {
            // Find which feature owns this collection
            const relatedFeature = (state.allRequestedFeatures || []).find((f: any) => {
              const relatedCollectionName = field.options?.collectionId || field.relation;
              return relatedCollectionName && (
                relatedCollectionName.toLowerCase() === f.name.toLowerCase().replace(/\s+/g, '_') ||
                relatedCollectionName.toLowerCase() === f.id.replace(/-/g, '_')
              );
            });

            if (relatedFeature && !dependencies.includes(relatedFeature.id)) {
              dependencies.push(relatedFeature.id);
              console.log(`[Backend]   ${feature.name} depends on ${relatedFeature.name} (${field.name} relation)`);
            }
          }
        });
      }

      return {
        ...feature,
        dependencies
      };
    });

    // VALIDATION: Check feature-backend completeness
    console.log('[Backend] 🔍 Validating feature-backend completeness...');
    const completenessReport = getCompletenessReport({
      ...state,
      backendConfig
    });

    console.log(`[Backend] 📊 Completeness Report:`);
    console.log(`[Backend]   Total MVP features: ${completenessReport.totalFeatures}`);
    console.log(`[Backend]   Features needing backend: ${completenessReport.featuresNeedingBackend}`);
    console.log(`[Backend]   Collections generated: ${completenessReport.collectionsGenerated}`);
    console.log(`[Backend]   Endpoints generated: ${completenessReport.endpointsGenerated}`);

    if (completenessReport.errors.length > 0) {
      console.log(`[Backend] ❌ ${completenessReport.errors.length} validation errors:`);
      completenessReport.errors.forEach(err => {
        console.log(`[Backend]     • ${err.feature}: ${err.message}`);
        console.log(`[Backend]       💡 ${err.suggestion}`);
      });
    }

    if (completenessReport.warnings.length > 0) {
      console.log(`[Backend] ⚠️  ${completenessReport.warnings.length} validation warnings:`);
      completenessReport.warnings.forEach(warn => {
        console.log(`[Backend]     • ${warn.feature}: ${warn.message}`);
      });
    }

    if (completenessReport.isComplete) {
      console.log('[Backend] ✅ All MVP features have backend coverage');
    } else {
      console.log('[Backend] ⚠️  Some MVP features are missing backend implementation');
    }
    console.log();

    // CONVERSATION MEMORY: Track Backend's response
    const backendResponse = `Generated backend configuration. Collections: ${backendConfig.collections.map(c => c.name).join(', ')}. Created ${backendConfig.apiEndpoints?.length || 0} API endpoints.`;
    addAssistantMessage(state.projectId, backendResponse, 'backend');
    console.log('[Backend] 💬 Tracked assistant response in conversation memory');

    // 💾 Save memory checkpoint after backend config generation
    await conversationMemoryStore.saveMemory(state.projectId);
    console.log('[Backend] 💾 Checkpoint saved after backend config generation');

    const duration = Date.now() - startTime;
    emitNodeComplete('backend', state, duration, {
      taskDescription: 'Generated backend collections and API endpoints',
      success: true,
      output: {
        collections: backendConfig.collections.length,
        endpoints: backendConfig.apiEndpoints?.length || 0
      },
      summary: `Generated ${backendConfig.collections.length} collections and ${backendConfig.apiEndpoints?.length || 0} API endpoints`
    });

    return {
      backendConfig,
      allRequestedFeatures: updatedFeatures, // Return features with assigned dependencies
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

function buildBackendPrompt(state: AppGenState): string {
  const plan = state.plan || 'No plan provided';

  // INCREMENTAL MODE: Detect existing backend
  const existingCollections = state.backendConfig?.collections || [];
  const isIncremental = existingCollections.length > 0;

  // MVP FILTERING: Only build features marked for MVP AND requiring backend
  // In incremental mode, only generate for NEW features (not completed)
  // IMPORTANT: Must match frontend's feature filtering to avoid mismatches
  let mvpFeatures = state.allRequestedFeatures?.filter((f: any) => f.included_in_mvp && f.backend_required) || [];

  if (isIncremental) {
    // Filter to only NEW features (not yet completed)
    mvpFeatures = mvpFeatures.filter((f: any) => !f.completed);
    console.log('[Backend] 📋 Incremental mode: Generating only for NEW features');
  }

  console.log('[Backend] 📋 All features:', state.allRequestedFeatures?.length || 0);
  console.log('[Backend] 📋 MVP features for backend:', mvpFeatures.length);
  console.log('[Backend] 📋 Backend requirements:', JSON.stringify(state.backendRequirements || {}, null, 2));

  // 🔍 Enhanced logging: Show which features will get collections
  console.log('[Backend] 🔍 Feature Analysis (MVP only):');
  state.allRequestedFeatures?.forEach((f: any) => {
    const willGenerate = f.included_in_mvp && f.backend_required && (!isIncremental || !f.completed);
    console.log(`[Backend]   ${f.name}:`);
    console.log(`[Backend]     - Phase: ${f.included_in_mvp ? '1 (MVP)' : '2 (Later)'}`);
    console.log(`[Backend]     - Backend Required: ${f.backend_required ? '✅' : '❌'}`);
    console.log(`[Backend]     - Completed: ${f.completed ? '✅' : '❌'}`);
    console.log(`[Backend]     - Status: ${willGenerate ? '✅ Will Generate Collections' : '⏭️ Skipped (Phase 2 or complete)'}`);
  });

  // Check if auth is required
  const userDescription = state.userDescription.toLowerCase();
  const needsAuth = userDescription.includes('auth') ||
                    userDescription.includes('login') ||
                    userDescription.includes('signup') ||
                    userDescription.includes('sign up') ||
                    userDescription.includes('register') ||
                    userDescription.includes('user account');

  // Build feature list with auth if needed
  const featuresList = [...mvpFeatures];
  if (needsAuth) {
    featuresList.push({
      name: 'User Authentication',
      description: 'Register, login, logout, and user session management',
      priority: 'high'
    });
  }

  console.log('[Backend] 📋 Features for backend generation:', featuresList.length);
  featuresList.forEach((f: any) => {
    console.log(`[Backend]   - ${f.name}: ${f.description || 'no description'}`);
  });

  const existingCollectionsContext = isIncremental ? `
🔄 **INCREMENTAL MODE - EXISTING BACKEND DETECTED:**

Existing Collections (DO NOT DUPLICATE):
${existingCollections.map((c: any) => `- ${c.name}: ${c.fields?.map((f: any) => f.name).join(', ')}`).join('\n')}

CRITICAL RULES FOR INCREMENTAL MODE:
1. Generate ONLY NEW collections for the NEW features listed below
2. DO NOT regenerate or modify existing collections
3. Ensure new collections don't conflict with existing ones
4. Verify collection names are unique

` : '';

  const backendInstructions = featuresList.length > 0 ? `
${existingCollectionsContext}
🚨 CRITICAL CONSTRAINT - READ THIS FIRST:
Generate backend for these ${isIncremental ? 'NEW' : ''} features:
${featuresList.map((f: any) => `- ${f.name}: ${f.description || ''}`).join('\n')}

RULES FOR COLLECTION GENERATION:
1. Create collections that DIRECTLY support the features above
2. Collection names should reflect the data entities needed by each feature
3. DO NOT add unrelated features (e.g., if no auth mentioned, don't add Users collection)
4. DO NOT assume additional functionality not in the feature list
${isIncremental ? '5. DO NOT duplicate existing collections (see list above)' : ''}

COMMON MISTAKES TO AVOID:
❌ Adding "Users" collection when there's no authentication/user management feature
❌ Adding "Cart"/"Orders" collections when there's no shopping/purchase feature
❌ Adding "Auth"/"Sessions" when there's no login/signup feature
❌ Creating collections for unrelated domains (e.g., adding Products to a messaging app)

VERIFICATION:
✅ Each collection should be clearly needed by a feature in the list above
✅ Collection name should match the domain of the feature it supports
✅ If unsure whether a collection is needed, include it (better to have it than missing)

COMMON PATTERNS (examples for typical domains):
E-commerce: "Product Catalog" → ["products"], "Shopping Cart" → ["cartItems"], "Checkout" → ["orders", "payments"]
SaaS: "Dashboard" → ["users", "projects"], "Analytics" → ["events", "metrics"]
Social: "Feed" → ["posts", "comments"], "User Profiles" → ["users", "followers"]
Content: "Blog" → ["posts", "categories"], "News" → ["articles", "tags"]

MULTI-COLLECTION FEATURES (features can use multiple collections):
- Product page → ["products", "reviews"]
- Checkout → ["cartItems", "orders", "payments"]
- Dashboard → ["users", "events", "metrics"]

HANDLING RELATIONS BETWEEN COLLECTIONS:
When a feature needs data from multiple collections (e.g., CartItems + Products):

🔗 USE RELATION FIELDS (Default approach):
Create a "relation" type field that references another collection:
Example: cartItems collection with relation to products
{
  "name": "cartItems",
  "fields": [
    { "name": "product", "type": "relation", "required": true },  ← Points to products collection
    { "name": "quantity", "type": "number", "required": true },
    { "name": "userId", "type": "text", "required": true }
  ]
}
- ✅ Pros: Clean normalized schema, no data duplication
- ⚠️  Note: Frontend must fetch both collections and join in code

📋 OPTIONAL DENORMALIZATION (Only when explicitly mentioned):
If user specifically asks to "store price with cart item" or "avoid extra lookups":
{
  "name": "cartItems",
  "fields": [
    { "name": "product", "type": "relation", "required": true },
    { "name": "productName", "type": "text" },     ← Denormalized from products
    { "name": "productPrice", "type": "number" },  ← Denormalized from products
    { "name": "quantity", "type": "number" }
  ]
}
- ✅ Pros: Simpler frontend queries, no joins needed
- ❌ Cons: Data duplication, must sync updates

🎯 DEFAULT RULE: Use relation fields (first option) unless explicitly told otherwise.

Create PocketBase collections and Express API endpoints for the features listed above.

CRITICAL: For EVERY collection created, you MUST generate AT MINIMUM these endpoints:
1. GET /api/[collection] - List all items (ALWAYS REQUIRED)
2. GET /api/[collection]/:id - Get single item by ID
3. POST /api/[collection] - Create new item
4. PUT/PATCH /api/[collection]/:id - Update item
5. DELETE /api/[collection]/:id - Delete item

ENDPOINT NAMING RULES (CRITICAL - Frontend expects these exact patterns):

🎯 SEMANTIC NAMING STRATEGY:
For user-facing actions, name endpoints after the ACTION, not the CRUD operation:
- If feature is about adding/removing items → use "add", "remove" verbs
- If feature is about submitting/editing content → use "submit", "edit" verbs
- If feature is about liking/favoriting → use "like", "favorite" verbs
- Think: "What does the USER do?" not "What does the database do?"

📋 GENERIC NAMING STRATEGY (MOST COMMON):
For data management, use standard CRUD pattern based on COLLECTION NAME:
- List all: get + [CollectionName] (e.g., collection "todos" → getTodos, collection "waitlist" → getWaitlist)
- Get one: get + [CollectionName] + ById (e.g., collection "todos" → getTodosById)
- Create: create + [CollectionName] (e.g., collection "todos" → createTodos)
- Update: update + [CollectionName] (e.g., collection "todos" → updateTodos)
- Delete: delete + [CollectionName] (e.g., collection "todos" → deleteTodos)

DECISION GUIDE:
- ✅ User-facing feature? → Use semantic action verbs
- ✅ Data management? → Use generic CRUD pattern (LIST endpoint is MANDATORY)
- ⚠️  CRITICAL: Every collection needs a GET (list) endpoint with PLURAL name

ROUTE-COLLECTION MAPPING:
Map PM-assigned routes to collections they need.

PROCESS:
1. Use feature routes from PM Node (already assigned)
2. Match collections to feature requirements
3. List collections each route interacts with

MAPPING RULES:
- Marketing pages (/) → Empty array (static content)
- Feature pages → Include collections for feature operations
- Dashboard pages → Include collections for aggregated data

${needsAuth ? `Include authentication endpoints: registerUser, loginUser, logoutUser, getCurrentUser.
` : ''}Skip static UI sections - they don't need backend.
` : '';

  return `🚨 [BACKEND NODE OUTPUT FORMAT] - READ THIS FIRST:
Your response MUST be ONLY valid JSON. Start with { and end with }.
NO markdown, NO headers, NO code fences, NO explanatory text.
⚠️ NOTE: This JSON format is ONLY for backend API schema generation. Frontend nodes use TypeScript code format.

USER REQUEST: "${state.userDescription}"

PLAN: ${plan}

${API_CONTRACT_SCHEMA}

${backendInstructions}

🚨 CRITICAL RETURN TYPE RULE - READ THIS FIRST:
The "returns" field MUST be the EXACT collection name with ONLY first letter capitalized.
NEVER singularize! If collection is "todos" → returns MUST be "Todos" or "Todos[]"
NEVER use "Todo", "TodoType", or any variation!

🚨 [BACKEND NODE] CRITICAL OUTPUT FORMAT:
- Return ONLY valid JSON
- NO markdown headers (no ###, no ####)
- NO code fences (no \`\`\`json, no \`\`\`)
- NO explanatory text before or after JSON
- Start directly with { and end with }
⚠️ This is backend-specific: Frontend nodes output TypeScript code, NOT JSON

Return pure JSON:

{
  "collections": [
    {
      "name": "collection_name",
      "fields": [
        { "name": "field_name", "type": "text|email|number|date|relation|file|json|bool", "required": true|false }
      ]
    }
  ],

🚨 FIELD REQUIREMENT RULE: Set required: true for ALL user-defined fields by default. Only use required: false for explicitly optional fields like notes, tags, or metadata.
Example: name, email, price, imageUrl → required: true | description, tags → required: false
  "pageCollectionMapping": [
    {
      "route": "/route-path",
      "collections": ["collection_name1", "collection_name2"],
      "purpose": "Brief description of what this page does with these collections"
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET|POST|PUT|DELETE|PATCH",
      "path": "/api/collection or /api/collection/:id",
      "handler": "functionNameInCamelCase",
      "collection": "collection_name",
      "description": "What this endpoint does",
      "parameters": [
        {
          "name": "parameterName",
          "type": "string|number|boolean|object|array",
          "required": true|false,
          "location": "path|query|body",
          "description": "What this parameter does"
        }
      ],
      "returns": "CollectionName|CollectionName[]|void"
    }
  ]
}

🚨 CRITICAL: PARAMETER SCHEMA RULES:

LOCATION TYPES:
- "path": Parameter from URL path (e.g., /api/{collection}/:id → id is path param)
- "query": Parameter from URL query string (e.g., /api/{collection}/search?query=keyword → query is query param)
- "body": Parameter from request body (POST/PUT/PATCH only)

PARAMETER DETECTION RULES:

🚨 CRITICAL CONSTRAINT: Generate ONLY parameters that are:
   1. Explicitly mentioned in the feature requirements
   2. Standard CRUD operations (id for detail/update/delete)
   3. Standard pagination (page, limit for list endpoints)

❌ DO NOT generate parameters based on assumptions or common patterns
❌ DO NOT infer additional filter parameters not mentioned in requirements
❌ DO NOT add timeRange, dateFilter, price, or other "reasonable" parameters unless explicitly specified

1. PATH PARAMETERS (location: "path"):
   - Extract from URL path using :paramName syntax
   - Example: /api/{collection}/:id → { name: "id", type: "string", required: true, location: "path" }
   - Always required: true (path params can't be optional)
   - ONLY generate "id" for detail/update/delete endpoints

2. QUERY PARAMETERS (location: "query"):
   - Used for GET endpoints that filter/search/paginate
   - STRICT RULE: Only add query params if:
     * Feature requirements explicitly mention filtering/searching
     * Requirements specify WHICH fields to filter by
   - Standard params (always safe to add):
     * page, limit, offset (pagination)
     * sort, order (sorting)
   - Example: If requirements say "filter by category and date range":
     → [
       { name: "category", type: "string", required: false, location: "query" },
       { name: "startDate", type: "string", required: false, location: "query" },
       { name: "endDate", type: "string", required: false, location: "query" }
     ]
   - ❌ WRONG: Adding "timeRange" when requirements say "date range"
   - Usually required: false (query params are typically optional filters)

3. BODY PARAMETERS (location: "body"):
   - Used for POST/PUT/PATCH endpoints that create/update data
   - Represents the data object being sent
   - Example: POST /api/{collection} → [
       { name: "data", type: "object", required: true, location: "body",
         description: "Data object with required fields for this collection" }
     ]
   - Usually required: true (body is needed for create/update)

RETURN TYPES - CRITICAL TYPE NAMING RULE:
🚨 Type name = Capitalized collection name (first letter uppercase, rest unchanged)
Formula: typeName = collection[0].toUpperCase() + collection.slice(1)

🚫 NEVER SINGULARIZE COLLECTION NAMES:
- DO NOT remove 's' from plural collections
- DO NOT convert "todos" to "todo"
- DO NOT convert "entries" to "entry"
- USE THE EXACT COLLECTION NAME, only capitalize first letter

Examples:
- collection: "todos" → returns: "Todos[]" or "Todos" (NOT "Todo", NOT "TodoType")
- collection: "entries" → returns: "Entries[]" or "Entries" (NOT "Entry")
- collection: "blogPosts" → returns: "BlogPosts[]" or "BlogPosts" (NOT "BlogPost")
- collection: "cartItems" → returns: "CartItems[]" or "CartItems" (NOT "CartItem")
- collection: "waitlist" → returns: "Waitlist[]" or "Waitlist" (NOT "WaitlistItem")

Other return types:
- "void" for DELETE endpoints
- "{success: boolean, message: string}" for status-only responses

ENDPOINT PATTERN RULES:

1. LIST endpoint (GET /api/{collection}):
   - No path params
   - Optional query params for filtering (location: "query", required: false)
   - Returns: "{CollectionName}[]" (array of items)

2. DETAIL endpoint (GET /api/{collection}/:id):
   - Path param: id (location: "path", required: true)
   - No query params
   - Returns: "{CollectionName}" (single item)

3. CREATE endpoint (POST /api/{collection}):
   - No path params
   - Body param: data object (location: "body", required: true)
   - Returns: "{CollectionName}" (created item)

4. UPDATE endpoint (PUT /api/{collection}/:id):
   - Path param: id (location: "path", required: true)
   - Body param: data object (location: "body", required: true)
   - Returns: "{CollectionName}" (updated item)

5. DELETE endpoint (DELETE /api/{collection}/:id):
   - Path param: id (location: "path", required: true)
   - No body params
   - Returns: "void"

6. SEARCH/FILTER endpoint (GET /api/{collection}/search or /filter):
   - No path params
   - Query params: search criteria (location: "query", required: false)
   - Returns: "{CollectionName}[]" (filtered array)

🚨 MANDATORY: Every endpoint MUST include "parameters" array (even if empty [])
🚨 MANDATORY: Every endpoint MUST include "returns" field with correct capitalized collection name`;
}

function parseBackendResponse(response: string, projectId: string): NonNullable<AppGenState['backendConfig']> {
  // Use the improved JSON parser that handles markdown contamination
  const fallbackConfig = {
    collections: [],
    pages: [],
    projectId,
    apiEndpoints: [],
    relationships: [],
    port: null,
    needsBackend: true
  };

  const parsed = extractAndParseJson(response, {
    collections: [],
    pages: [],
    apiEndpoints: [],
    relationships: [],
    pageCollectionMapping: []
  });

  // ✅ CRITICAL FIX: Remove duplicates and ensure every collection has a GET (list all) endpoint
  // Store original name for type generation, lowercase for PocketBase
  const collections = (parsed.collections || []).map((col: any) => ({
    ...col,
    originalName: col.name, // Keep original for type names (e.g., "BlogPosts")
    name: col.name.toLowerCase() // Normalize for PocketBase (e.g., "blogposts")
  }));
  let apiEndpoints = parsed.apiEndpoints || [];

  console.log('[Backend] 🔍 Deduplicating endpoints and validating GET endpoints...');

  // STEP 1: Remove duplicate endpoints (keep first occurrence)
  const uniqueEndpoints = new Map();
  const duplicatesRemoved: string[] = [];

  apiEndpoints.forEach((ep: any) => {
    if (ep.handler) {
      const key = `${ep.handler}`;
      if (!uniqueEndpoints.has(key)) {
        uniqueEndpoints.set(key, ep);
      } else {
        duplicatesRemoved.push(`${ep.handler} (${ep.method} ${ep.path})`);
      }
    }
  });

  if (duplicatesRemoved.length > 0) {
    console.log(`[Backend] ⚠️  REMOVED ${duplicatesRemoved.length} duplicate endpoints:`);
    duplicatesRemoved.forEach(dup => console.log(`[Backend]     ✂️  ${dup}`));
  }

  // Convert back to array
  apiEndpoints = Array.from(uniqueEndpoints.values());

  // ✅ NEW: STEP 1.5: Validate and enrich schema (parameters + returns)
  console.log('[Backend] 🔍 Validating and enriching endpoint schemas...');
  apiEndpoints = apiEndpoints.map((ep: any) => {
    // Ensure parameters array exists
    if (!ep.parameters) {
      console.log(`[Backend] ⚠️  ${ep.handler}: Missing parameters array, auto-detecting...`);
      ep.parameters = autoDetectParameters(ep);
    }

    // Ensure returns field exists
    if (!ep.returns) {
      console.log(`[Backend] ⚠️  ${ep.handler}: Missing returns field, inferring...`);
      ep.returns = inferReturnType(ep, collections);
    }

    // 🚨 CRITICAL FIX: Validate that return types match generated type names
    // Type names are generated from ORIGINAL collection names, then capitalized
    // e.g., "BlogPosts" → "BlogPosts", "blogposts" → "Blogposts"
    if (ep.collection) {
      // Normalize collection name to lowercase (PocketBase convention)
      const normalizedCollection = ep.collection.toLowerCase();
      ep.collection = normalizedCollection;

      // Find the original collection to get originalName
      const collectionObj = collections.find((c: any) =>
        c.name.toLowerCase() === normalizedCollection
      );

      if (collectionObj) {
        // Use originalName for type generation (preserves camelCase like "BlogPosts")
        const nameForType = collectionObj.originalName || collectionObj.name;
        const expectedTypeName = nameForType.charAt(0).toUpperCase() + nameForType.slice(1);
        const returnsWithoutArray = ep.returns.replace('[]', '').replace('void', 'void');

        // Skip void returns (DELETE endpoints)
        if (ep.returns !== 'void' && returnsWithoutArray !== expectedTypeName) {
          console.log(`[Backend] 🔧 ${ep.handler}: Fixing incorrect return type "${ep.returns}" → "${expectedTypeName}${ep.returns.includes('[]') ? '[]' : ''}"`);
          console.log(`[Backend]     Collection: "${normalizedCollection}" (original: "${nameForType}") → Expected type: "${expectedTypeName}"`);
          console.log(`[Backend]     ⚠️ AI GENERATED WRONG TYPE - This is why we validate!`);

          // Fix the return type to match collection name
          if (ep.returns.includes('[]')) {
            ep.returns = `${expectedTypeName}[]`;
          } else {
            ep.returns = expectedTypeName;
          }
        }
      }
    }

    return ep;
  });

  // STEP 2: Ensure every collection has a GET (list all) endpoint
  for (const collection of collections) {
    const collectionName = collection.name.toLowerCase();

    // Check if there's a GET endpoint for this collection (list all)
    const hasGetEndpoint = apiEndpoints.some((ep: any) =>
      ep.method === 'GET' &&
      !ep.path.includes(':id') && // Not a detail endpoint
      (ep.collection?.toLowerCase() === collectionName ||
       ep.path.toLowerCase().includes(collectionName))
    );

    if (!hasGetEndpoint) {
      // Auto-generate missing GET endpoint
      const handlerName = `get${collection.name.charAt(0).toUpperCase()}${collection.name.slice(1)}`;
      const newEndpoint = {
        method: 'GET',
        path: `/api/${collection.name}`,
        handler: handlerName,
        collection: collection.name,
        description: `Get all ${collection.name}`
      };

      apiEndpoints.push(newEndpoint);
      console.log(`[Backend] ⚠️  AUTO-FIXED: Added missing GET endpoint for "${collection.name}" → ${handlerName}()`);
    }
  }

  return {
    collections: parsed.collections || [],
    pages: parsed.pages || [],
    apiEndpoints,
    pageCollectionMapping: parsed.pageCollectionMapping || [],
    projectId,
    relationships: parsed.relationships || [],
    port: null, // Assigned during deployment
    needsBackend: true
  };
}

/**
 * Auto-detect parameters for endpoints that don't have schema
 * This is a fallback for backward compatibility
 */
function autoDetectParameters(endpoint: any): any[] {
  const parameters = [];
  const path = endpoint.path || '';
  const method = endpoint.method || 'GET';
  const handler = endpoint.handler || '';

  // 1. Extract path parameters from :param syntax
  const pathParams = path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g) || [];
  pathParams.forEach((param: string) => {
    const paramName = param.slice(1); // Remove ':'
    parameters.push({
      name: paramName,
      type: 'string',
      required: true,
      location: 'path',
      description: `${paramName} parameter`
    });
  });

  // 2. Detect query parameters for GET endpoints
  if (method === 'GET') {
    const pathLower = path.toLowerCase();
    const handlerLower = handler.toLowerCase();

    // Search/filter/query endpoints need query params
    if (pathLower.includes('/search') ||
        pathLower.includes('/filter') ||
        pathLower.includes('/query') ||
        handlerLower.includes('search') ||
        handlerLower.includes('filter') ||
        handlerLower.includes('query') ||
        handlerLower.includes('find') ||
        handlerLower.includes('lookup')) {

      // Add generic query parameters
      parameters.push({
        name: 'query',
        type: 'string',
        required: false,
        location: 'query',
        description: 'Search query'
      });

      // If it seems like a list/search, add pagination
      parameters.push({
        name: 'limit',
        type: 'number',
        required: false,
        location: 'query',
        description: 'Number of items to return'
      });
    }

    // ✅ FIX: ALWAYS add parameters array for GET endpoints (even if empty)
    // This ensures frontend doesn't fall back to heuristics
    // List endpoints (no :id) may have filters
    if (!path.includes(':id') && !pathLower.includes('/search') && !pathLower.includes('/filter')) {
      // Add optional pagination for list endpoints
      parameters.push({
        name: 'limit',
        type: 'number',
        required: false,
        location: 'query',
        description: 'Number of items to return'
      });

      parameters.push({
        name: 'offset',
        type: 'number',
        required: false,
        location: 'query',
        description: 'Number of items to skip'
      });
    }
  }

  // ✅ CRITICAL FIX: For GET endpoints with :id and NO OTHER params,
  // ensure parameters array is not empty
  if (method === 'GET' && path.includes(':id') && parameters.length === 1) {
    // This is correct - just has the id parameter
    // No additional work needed
  }

  // 3. Add body parameter for POST/PUT/PATCH
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const resourceName = handler.replace(/^(create|update|add|edit|modify)/, '').toLowerCase();
    parameters.push({
      name: 'data',
      type: 'object',
      required: true,
      location: 'body',
      description: `${resourceName || 'Resource'} data`
    });
  }

  return parameters;
}

/**
 * Infer return type from endpoint metadata
 * Fallback for endpoints without explicit return type
 */
function inferReturnType(endpoint: any, collections: any[]): string {
  const method = endpoint.method || 'GET';
  const path = endpoint.path || '';
  const collection = endpoint.collection;

  // DELETE typically returns void
  if (method === 'DELETE') {
    return 'void';
  }

  // Try to find matching collection and capitalize
  if (collection) {
    const collectionObj = collections.find((c: any) =>
      c.name.toLowerCase() === collection.toLowerCase()
    );

    if (collectionObj) {
      // 🚨 CRITICAL: Use EXACT same algorithm as api-client-generator.ts:7-9
      // Use originalName if available (preserves camelCase), otherwise use normalized name
      const nameForType = collectionObj.originalName || collectionObj.name;
      const typeName = nameForType.charAt(0).toUpperCase() + nameForType.slice(1);

      // List endpoints return arrays
      if (!path.includes(':id') && method === 'GET') {
        return `${typeName}[]`;
      }

      // Detail/create/update return single item
      return typeName;
    }
  }

  // Generic fallback
  if (path.includes(':id') || method === 'GET') {
    return 'any';
  }

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    return 'any';
  }

  return 'any';
}

// Export traced version of backend node
export const backendNode = withLangSmithTracing('backend', backendNodeImpl);
