/**
 * PROTOTYPE GENERATION API ROUTE - FULLY AGENTIC (LangGraph)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * AGENTIC INTEGRATION COMPLETE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * This route uses the FULLY AGENTIC LangGraph workflow where every operation
 * goes through specialized AI agent nodes.
 *
 * WORKFLOW:
 * UX Node → (Frontend Router & Backend Node parallel) → QA Node → DevOps Node
 *
 * KEY FEATURES:
 * ✅ 100% LangGraph-based (no legacy code)
 * ✅ Uses frontendRouter for intelligent HTML vs Next.js routing
 * ✅ AutoGen multi-agent debugging system
 * ✅ Memory-aware nodes with context integration
 * ✅ Artifact passing between nodes
 * ✅ Fully optimized parallel execution
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/pocketbase-middleware";
import { consumeTokens, getAvailableTokens, checkAndResetDailyTokens } from "@/lib/pocketbase-credits";
import type { AppGenState } from "@/lib/langgraph/types";
import { customAlphabet } from "nanoid";
import { loadMemoryContext, storeProjectContext } from "@/lib/langgraph/memory-loader";
import { unifiedSearch } from "@/lib/mcp/unified-search";

// PocketBase-compatible ID generator (alphanumeric only, no hyphens)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 15);

// Set maximum duration for this route (Vercel/Next.js config)
export const maxDuration = 300; // 5 minutes for serverless functions

/**
 * LangGraph-based prototype generation
 * Runs: UX → (Frontend Router & Backend parallel) → QA → DevOps
 */
export async function POST(req: NextRequest) {
  // Ensure we always return JSON, even on unexpected errors
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let plan: string | undefined;
    let description: string;
    let projectId: string | undefined;
    let backendConfig: any;
    let context: any;

    try {
      const body = await req.json();
      plan = body.plan;
      description = body.description;
      projectId = body.projectId;
      backendConfig = body.backendConfig;
      context = body.context;
    } catch (parseError: any) {
      console.error('[Prototype] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    // Estimate tokens needed (larger for prototype generation)
    const estimatedTokens = Math.ceil(((plan?.length || 0) + (description?.length || 0)) * 2);

    // Check if user has enough tokens
    const freshUser = await checkAndResetDailyTokens(user.id);
    const availableTokens = getAvailableTokens(freshUser);
    if (availableTokens < estimatedTokens) {
      return NextResponse.json(
        { error: "Insufficient tokens. Please purchase more credits.", insufficientTokens: true },
        { status: 402 }
      );
    }

    // #done Load MCP Memory Context
    const finalProjectId = projectId || nanoid();  // Exactly 15 chars, alphanumeric only (no hyphens)
    console.log('[Prototype] Loading memory context...');
    const memoryContext = await loadMemoryContext(user.id, projectId);

    // #done Run Unified Search (if not already in context)
    let searchResult;
    if (!context?.backgroundContext) {
      console.log('[Prototype] Running unified search...');
      searchResult = await unifiedSearch(description, context?.appType || 'app', {
        useCache: true,
        minStars: 10, // Lowered from 20 to get more results
        maxResults: 5,
        timeout: 10000 // Increased to 10 seconds for better results
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // IMPORT AGENTIC NODES (all exported from index)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const { uxNode, frontendRouter, backendNode, qaNode, devopsNode } =
      await import('@/lib/langgraph/nodes');

    // Resume from where /api/ai/plan left off
    let state: AppGenState = {
      userDescription: description,
      userId: user.id,
      projectId: finalProjectId,
      plan,
      context,
      memoryContext, // #done MCP Memory integration
      backgroundContext: searchResult?.success ? searchResult : (context?.backgroundContext || undefined), // #done Unified search
      backendConfig, // May be pre-generated or null
      completedNodes: ['founder', 'pm'], // Already completed in planning phase
      errors: [],
      artifacts: new Map(),
      stage: 'designing'
    };

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Prototype] 🎬 STARTING AGENTIC WORKFLOW');
    console.log('[Prototype] Project ID:', state.projectId);
    console.log('[Prototype] Flow: UX → (FrontendRouter || Backend) → QA → DevOps');
    console.log('[Prototype] Using: 100% LangGraph nodes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: UX NODE - Design System & Component Selection
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[Prototype] 🚀 Executing UX Designer node...');
    const uxResult = await uxNode(state);
    state = { ...state, ...uxResult };
    console.log('[Prototype] ✅ UX Designer complete');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: FRONTEND ROUTER & BACKEND NODE (PARALLEL)
    // Frontend Router intelligently routes to HTML or Next.js node
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[Prototype] 🚀 Executing Frontend Router & Backend nodes in parallel...');
    const [frontendResult, backendResult] = await Promise.all([
      frontendRouter(state), // ✅ Uses intelligent routing
      backendNode(state)
    ]);
    console.log('[Prototype] ✅ Frontend Router & Backend complete');

    // Merge results (backend may update backendConfig)
    state = {
      ...state,
      ...frontendResult,
      backendConfig: backendResult.backendConfig || state.backendConfig,
      completedNodes: [...new Set([...state.completedNodes, ...(frontendResult.completedNodes || []), ...(backendResult.completedNodes || [])])]
    };

    console.log('[Prototype] Files generated:', state.files?.length || 0);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: QA NODE - Validation & AutoGen Debugging
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[Prototype] 🚀 Executing QA Manager node...');
    const qaResult = await qaNode(state);
    state = { ...state, ...qaResult };
    console.log('[Prototype] ✅ QA Manager complete');

    if (state.debugAttempts && state.debugAttempts > 0) {
      console.log(`[Prototype] 🔧 AutoGen debugging was used: ${state.debugAttempts} attempts`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: DEVOPS NODE - Store in PocketBase & Deploy
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[Prototype] 🚀 Executing DevOps node...');
    const devopsResult = await devopsNode(state);
    state = { ...state, ...devopsResult };
    console.log('[Prototype] ✅ DevOps complete');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Prototype] ✅ AGENTIC WORKFLOW COMPLETE');
    console.log(`[Prototype] Completed nodes: ${state.completedNodes.join(' → ')}`);
    console.log(`[Prototype] Files generated: ${state.files?.length || 0}`);
    console.log(`[Prototype] Debug attempts: ${state.debugAttempts || 0}`);
    console.log(`[Prototype] Deploy URL: ${state.deployUrl || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Consume tokens after successful generation
    await consumeTokens(user.id, estimatedTokens, "/api/ai/prototype", state.projectId);

    // Prepare response
    const response = {
      code: state.files?.[0]?.content || '', // Main file for backward compatibility
      files: state.files || [],
      aiMetadata: {
        model: state.artifacts?.get('codeGenMetadata')?.model || 'unknown',
        provider: state.artifacts?.get('codeGenMetadata')?.provider || 'unknown',
        filesGenerated: state.files?.length || 0,
        debugAttempts: state.debugAttempts || 0,
        completedNodes: state.completedNodes,
        usedLangGraph: true,
        fullyAgentic: true
      }
    };

    console.log('[Prototype] 📤 Returning response with', response.files.length, 'files');
    console.log('[Prototype] Files:', response.files.map((f: any) => f.path).join(', '));

    // #done Store project context in MCP Memory
    await storeProjectContext(state.projectId, {
      userDescription: state.userDescription,
      plan: state.plan,
      designSystem: state.designSystem,
      backendConfig: state.backendConfig,
      files: state.files,
      context: state.context
    });

    // Return same format as before (BACKWARD COMPATIBLE)
    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error generating prototype:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
