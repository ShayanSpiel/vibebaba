// @ts-nocheck
// lib/langgraph/workflow.ts
import { END, START, StateGraph } from '@langchain/langgraph';
// Workflow health logging
import { logNodeError, logNodeExecution } from '@/lib/services/workflow-logger';
// Import all agent nodes
import {
  backendNode,
  devopsNode,
  founderNode,
  inputDetectorNode,
  pmNode,
  qaNode,
  techLeadNode,
  uxNode,
} from './nodes';
import { editorNode } from './nodes/editor';
import { frontendRouter } from './nodes/frontend/router'; // ✅ USE ROUTER INSTEAD OF DIRECT FRONTEND NODE
import type { AppGenState } from './types';
import { AppGenAnnotation } from './types'; // NEW: Import annotation for modern state management

/**
 * Wrap node execution with error recovery and logging
 */
function withErrorRecovery<T extends AppGenState>(
  nodeName: string,
  nodeFunc: (state: T) => Promise<Partial<T>>
) {
  return async (state: T): Promise<Partial<T>> => {
    const startTime = Date.now();
    const workflowId =
      state.workflowId || `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await nodeFunc(state);
      const duration = Date.now() - startTime;

      // Log successful execution to database
      if (state.projectId && state.userId) {
        await logNodeExecution({
          projectId: state.projectId,
          userId: state.userId,
          workflowId,
          nodeName,
          status: 'success',
          durationMs: duration,
          metadata: {
            completedNodes: state.completedNodes,
            hasFiles: !!state.files,
            filesCount: state.files?.length || 0,
          },
        });
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[Workflow] Error in ${nodeName} node:`, error);

      // Log error to database
      if (state.projectId && state.userId) {
        await logNodeError(
          {
            projectId: state.projectId,
            userId: state.userId,
            workflowId,
            nodeName,
            durationMs: duration,
            metadata: {
              completedNodes: state.completedNodes,
              errorCode: error.code,
            },
          },
          error
        );
      }

      // Return partial state with comprehensive error info instead of throwing
      return {
        errors: [
          ...(state.errors || []),
          {
            node: nodeName,
            message: error.message || 'Unknown error',
            name: error.name || 'Error',
            code: error.code,
            cause: error.cause,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          },
        ],
        completedNodes: [...(state.completedNodes || []), nodeName],
      } as Partial<T>;
    }
  };
}

/**
 * Create the main app generation workflow
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * COMPLETE FULL-STACK FLOW:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Founder → PM → UX → Backend → Frontend → QA → DevOps → END
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * BACKEND INTEGRATION (Full Implementation):
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 1. PM Node: Smart Backend Detection
 *    - Analyzes user request for 50+ backend keywords across 8 categories
 *    - Keywords OVERRIDE static keywords (form on landing page = needs backend!)
 *    - Categories: data persistence, user management, forms, e-commerce, etc.
 *    - Sets context.pmPlan.needsBackend = true/false
 *
 * 2. Backend Node: Complete Schema Generation (if needsBackend = true)
 *    - Collections: Database tables with typed fields
 *      Example: { name: "users", fields: [{ name: "email", type: "email" }] }
 *    - Pages: Route definitions for multi-page apps
 *      Example: [{ name: "Home", route: "/" }, { name: "Dashboard", route: "/dashboard" }]
 *    - API Endpoints: RESTful CRUD routes (GET, POST, PUT, DELETE)
 *      Example: { method: "POST", path: "/api/users", handler: "createUser" }
 *    - Uses AI to generate contextual schema based on app requirements
 *    - Output: backendConfig with collections, pages, apiEndpoints
 *
 * 3. Frontend Node: Next.js Generation with API Integration
 *    - Generates Next.js 14 app with TypeScript + Tailwind
 *    - If backendConfig exists: creates typed API client (src/lib/api.ts)
 *    - API client includes: fetch wrappers, error handling, TypeScript types
 *    - Components auto-integrate with API endpoints
 *    - Uses AI file autonomy for optimal structure
 *
 * 4. QA Node: Multi-Layer Validation
 *    - Structure validation: Required Next.js files present
 *    - TypeScript validation: No type errors or placeholders
 *    - Backend validation: Skipped (PocketBase handles schema validation)
 *    - AutoGen debugging: Triggers AI repair if errors found
 *
 * 5. DevOps Node: Complete Deployment Pipeline
 *    - Frontend: Next.js static export → http://localhost:4000/apps/[projectId]
 *    - Backend (if apiEndpoints exist):
 *      • Generates Express server (api/server.js)
 *      • Generates PocketBase client (api/db.js)
 *      • Generates route handlers (api/routes/[collection].js)
 *      • Starts API server on dynamic port (5000-6000)
 *      • Auto-restart on crash with retry logic
 *    - Database: Creates PocketBase collections with schema
 *    - Real-time sync: Database tab connects to PocketBase for live updates
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * STATE FLOW:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * stage: "planning" → "building" → "completed"
 *
 * Planning Stage:
 * - PM generates plan and detects backend needs
 * - Sets context.pmPlan.needsBackend flag
 *
 * Building Stage:
 * - Backend node runs (if needsBackend = true)
 * - Frontend generates Next.js app + API client
 * - QA validates and auto-fixes errors
 * - DevOps deploys everything
 *
 * Completed Stage:
 * - User sees: Preview tab, Code tab, Database tab (if backend exists)
 * - Database tab shows live PocketBase collections
 * - Real-time updates via PocketBase subscriptions
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CRITICAL ORDERING:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Backend MUST run BEFORE Frontend to ensure backendConfig is available
 * for API client generation and component integration.
 */
export function createAppGenWorkflow() {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODERN STATE GRAPH using Annotation.Root
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Benefits:
  // - 60 lines vs 274 lines (78% reduction)
  // - Automatic array accumulation via reducers
  // - Better type safety with typeof AppGenAnnotation.State
  // - Same performance as manual channels (compiles to same thing)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const workflow = new StateGraph(AppGenAnnotation);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REGISTER ALL AGENT NODES (with error recovery)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Generation workflow nodes
  workflow.addNode('founder', withErrorRecovery('founder', founderNode) as any);
  workflow.addNode('pm', withErrorRecovery('pm', pmNode) as any);
  workflow.addNode('ux', withErrorRecovery('ux', uxNode) as any);
  workflow.addNode('backend', withErrorRecovery('backend', backendNode) as any); // ✅ BACKEND NODE ENABLED
  workflow.addNode('frontend', withErrorRecovery('frontend', frontendRouter) as any);
  workflow.addNode('qa', withErrorRecovery('qa', qaNode) as any);
  workflow.addNode('devops', withErrorRecovery('devops', devopsNode) as any);

  // PHASE 3: Conversational editor workflow nodes
  workflow.addNode('input-detector', withErrorRecovery('input-detector', inputDetectorNode) as any);
  workflow.addNode(
    'tech-lead',
    withErrorRecovery('tech-lead', techLeadNode) as any
  );
  workflow.addNode('editor', withErrorRecovery('editor', editorNode) as any);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DEFINE WORKFLOW EDGES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // PHASE 3: Conditional routing at START
  // Check if editing existing project or creating new one
  (workflow as any).addConditionalEdges('__start__', (state: AppGenState) => {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // NEW: FEATURE ADDITION DETECTION
    // Intercept __ADD_FEATURE: requests and route to editing workflow
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const featureAddMatch = state.userRequest?.match(/^__ADD_FEATURE:(.+)$/);

    if (featureAddMatch) {
      const featureId = featureAddMatch[1];
      const feature = state.allRequestedFeatures?.find((f: any) => f.id === featureId);

      if (!feature) {
        console.error(`[Workflow] Feature ${featureId} not found`);
        throw new Error(`Feature ${featureId} not found`);
      }

      // Check dependencies
      const unmetDeps = (feature.dependencies || []).filter((depId: string) => {
        const dep = state.allRequestedFeatures?.find((f: any) => f.id === depId);
        return dep && !dep.completed;
      });

      if (unmetDeps.length > 0) {
        const depNames = unmetDeps
          .map((id: string) => state.allRequestedFeatures?.find((f: any) => f.id === id)?.name)
          .join(', ');
        console.error(`[Workflow] Cannot add "${feature.name}" - requires: ${depNames}`);
        throw new Error(`Cannot add "${feature.name}" - requires: ${depNames}`);
      }

      // Enrich user request with full feature context
      state.userRequest = `Add this feature: ${feature.name}\n${feature.description}`;

      // Create editing session
      state.editingSession = {
        originalFiles: state.files || [],
        userRequest: state.userRequest,
        conversationHistory: [],
        changeScope: feature.complexity === 'simple' ? 'moderate' : 'major',
        filesToModify: [],
        preservedSections: new Map(),
        changesApplied: [],
        fileChanges: [],
      };

      console.log('[Workflow] 🎯 Feature addition detected - routing to editing workflow');
      console.log(`[Workflow]   Feature: "${feature.name}"`);
      console.log(`[Workflow]   Scope: ${state.editingSession.changeScope}`);

      // Route to editing workflow
      return 'input-detector';
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // END FEATURE ADDITION DETECTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Check if editing mode (has existing files and edit request)
    if (state.editingSession && state.files && state.files.length > 0) {
      console.log('🔀 [Workflow] Routing to EDITOR workflow (existing project)');
      console.log(`🔀 [Workflow]   Files loaded: ${state.files.length}`);
      console.log(`🔀 [Workflow]   Edit request: "${state.editingSession.userRequest}"`);
      return 'input-detector';
    }

    // Otherwise, full generation
    console.log('🔀 [Workflow] Routing to GENERATION workflow (new project)');
    return 'founder';
  });

  // GENERATION PATH: founder → pm → ux → backend → frontend → qa → devops → END
  (workflow as any).addEdge('founder', 'pm'); // Create product plan + detect backend needs
  (workflow as any).addEdge('pm', 'ux'); // Design UI/UX system
  (workflow as any).addEdge('ux', 'backend'); // Generate Express API + PocketBase schema
  (workflow as any).addEdge('backend', 'frontend'); // Generate Next.js frontend + API client
  (workflow as any).addEdge('frontend', 'qa'); // Validate code quality & fix errors

  // PHASE 3: EDITING PATH with conversational features
  // input-detector → (pause if input needed OR continue) → context-analyzer → editor → qa → devops → END
  (workflow as any).addConditionalEdges('input-detector', (state: AppGenState) => {
    if (state.needsUserInput) {
      console.log('🔀 [Workflow] User input required - pausing workflow');
      console.log(`🔀 [Workflow]   Question: "${state.userInputRequest?.question}"`);
      return '__end__'; // Pause and wait for user response
    }

    console.log('🔀 [Workflow] No input needed - continuing to Tech Lead');
    return 'tech-lead';
  });

  // CRITICAL ROUTING: Tech Lead decides which node to start from
  (workflow as any).addConditionalEdges('tech-lead', (state: AppGenState) => {
    const session = state.editingSession;

    // Question answered, end workflow
    if (session?.isQuestion && session?.questionAnswered) {
      console.log('🔀 [Workflow] Question answered - ending workflow');
      return '__end__';
    }

    // Route based on startNode from Tech Lead
    const startNode = session?.startNode || 'pm'; // Default to PM for safety

    console.log('🔀 [Workflow] Tech Lead routing:');
    console.log(`🔀 [Workflow]   Request type: ${session?.requestType}`);
    console.log(`🔀 [Workflow]   Start node: ${startNode.toUpperCase()}`);
    console.log(`🔀 [Workflow]   Reasoning: ${session?.reasoning || 'N/A'}`);

    // Valid start nodes: pm, ux, backend, frontend, editor
    const validNodes = ['pm', 'ux', 'backend', 'frontend', 'editor'];
    if (validNodes.includes(startNode)) {
      console.log(`🔀 [Workflow] ✅ Routing to ${startNode.toUpperCase()} node`);
      return startNode;
    }

    // Fallback to PM for safety
    console.warn('🔀 [Workflow] ⚠️ Invalid startNode - defaulting to PM');
    return 'pm';
  });

  (workflow as any).addEdge('editor', 'qa'); // Apply edits & validate

  // SHARED PATH: Both generation and editing paths merge at QA → DevOps → END
  (workflow as any).addEdge('qa', 'devops'); // Deploy to server + start API server
  (workflow as any).addEdge('devops', '__end__'); // Complete! 🎉

  // Compile the workflow
  return workflow.compile();
}
