import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/pocketbase-middleware";
import { consumeTokens, getAvailableTokens, checkAndResetDailyTokens } from "@/lib/pocketbase-credits";
import { createAppGenWorkflow } from "@/lib/langgraph/workflow";
import type { AppGenState } from "@/lib/langgraph/types";
import { customAlphabet } from "nanoid";

// PocketBase-compatible ID generator (alphanumeric only, no hyphens)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 15);

/**
 * REFACTORED: Now uses LangGraph workflow (Founder → PM nodes)
 * Maintains 100% backward compatibility with existing response format
 */
export async function POST(req: NextRequest) {
  const USE_LANGGRAPH = process.env.USE_LANGGRAPH !== 'false'; // Default to true

  if (!USE_LANGGRAPH) {
    // Fallback to legacy implementation if flag is disabled
    return legacyPlanHandler(req);
  }

  try {
    // Check authentication
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description } = await req.json();

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    // Estimate tokens needed
    const estimatedTokens = Math.ceil(description.length / 2);

    // Check if user has enough tokens
    const updatedUser = await checkAndResetDailyTokens(user.id);
    const availableTokens = getAvailableTokens(updatedUser);
    if (availableTokens < estimatedTokens) {
      return NextResponse.json(
        { error: "Insufficient tokens. Please purchase more credits.", insufficientTokens: true },
        { status: 402 }
      );
    }

    // Create LangGraph workflow
    const workflow = createAppGenWorkflow();

    // Initialize state
    const initialState: AppGenState = {
      userDescription: description,
      userId: user.id,
      projectId: nanoid(),  // Exactly 15 chars, alphanumeric only (no hyphens)
      completedNodes: [],
      errors: [],
      artifacts: new Map(),
      stage: 'initial'
    };

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[LangGraph] 🎬 STARTING PLANNING WORKFLOW');
    console.log('[LangGraph] Project ID:', initialState.projectId);
    console.log('[LangGraph] Description:', description.substring(0, 100) + '...');
    console.log('[LangGraph] Flow: Founder → PM');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Run workflow - STOP after PM node completes
    // We use a custom execution that only runs Founder and PM
    const result = await runPlanningPhase(workflow, initialState);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[LangGraph] ✅ PLANNING COMPLETE');
    console.log(`[LangGraph] Completed nodes: ${result.completedNodes.join(' → ')}`);
    console.log('[LangGraph] Plan generated:', result.plan ? 'YES' : 'NO');
    console.log('[LangGraph] Context:', result.context ? 'YES' : 'NO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Consume tokens after successful generation
    await consumeTokens(user.id, estimatedTokens, "/api/ai/plan");

    // Return same format as before (BACKWARD COMPATIBLE)
    return NextResponse.json({
      plan: result.plan,
      context: result.context
    });

  } catch (error: any) {
    console.error("Error in plan generation:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Run only the planning phase (Founder → PM)
 * This is a partial workflow execution
 */
async function runPlanningPhase(workflow: any, initialState: AppGenState): Promise<AppGenState> {
  // Import nodes directly for partial execution
  const { founderNode } = await import('@/lib/langgraph/nodes/founder-node');
  const { pmNode } = await import('@/lib/langgraph/nodes/pm-node');

  // Execute Founder node
  let state = { ...initialState };
  const founderResult = await founderNode(state);
  state = { ...state, ...founderResult };

  // Execute PM node
  const pmResult = await pmNode(state);
  state = { ...state, ...pmResult };

  return state as AppGenState;
}

/**
 * Legacy plan handler (fallback)
 * Original implementation for rollback capability
 */
async function legacyPlanHandler(req: NextRequest) {
  const { generateWithFallback } = await import('@/lib/ai');
  const { isMCPEnabled } = await import('@/lib/mcp-config');
  const { gatherBackgroundContext, formatContextForAI, getSuggestedStarThreshold } = await import('@/lib/mcp-background-helper');
  const { getMemoryService, formatMemoryForPrompt } = await import('@/lib/services/memory-service');

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description, projectId } = await req.json();

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const estimatedTokens = Math.ceil(description.length / 2);
    const updatedUser = await checkAndResetDailyTokens(user.id);
    const availableTokens = getAvailableTokens(updatedUser);

    if (availableTokens < estimatedTokens) {
      return NextResponse.json(
        { error: "Insufficient tokens. Please purchase more credits.", insufficientTokens: true },
        { status: 402 }
      );
    }

    const analysisPrompt = `You are a product analyst. Analyze this app request and extract key context:

User Request: "${description}"

Analyze and return ONLY a JSON object with these fields:
{
  "appType": "landing-page|dashboard|saas-app|ecommerce|blog|portfolio|tool|game|other",
  "complexity": "simple|moderate|complex",
  "designStyle": "minimalist|modern|professional|playful|creative|corporate|tech|elegant",
  "primaryPurpose": "one sentence",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "targetAudience": "who is this for",
  "visualTone": "light|dark|colorful|muted|vibrant",
  "animationLevel": "none|subtle|moderate|heavy",
  "imageContext": ["relevant", "keywords", "for", "images"]
}

Return ONLY valid JSON, no explanations.`;

    const analysisResult = await generateWithFallback(analysisPrompt);

    let context;
    try {
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      context = JSON.parse(jsonMatch ? jsonMatch[0] : analysisResult);
    } catch (e) {
      context = {
        appType: "other",
        complexity: "moderate",
        designStyle: "modern",
        primaryPurpose: description,
        keyFeatures: [],
        targetAudience: "general users",
        visualTone: "light",
        animationLevel: "moderate",
        imageContext: ["professional", "modern"]
      };
    }

    const mcpEnabled = isMCPEnabled();
    let backgroundContext = null;

    if (mcpEnabled) {
      console.log("[Plan] Gathering background context silently...");
      const minStars = getSuggestedStarThreshold(context.appType);

      backgroundContext = await gatherBackgroundContext(
        description,
        context.appType,
        {
          timeout: 3000,
          minStars: minStars,
        }
      );
    }

    const optionalContext = backgroundContext ? formatContextForAI(backgroundContext) : "";

    // MEMORY INTEGRATION: Retrieve user preferences
    const memoryService = getMemoryService();
    const userPreferences = await memoryService.getUserPreferences(user.id);

    const memoryContext = formatMemoryForPrompt({
      userPreferences,
      projectContext: null,
      conversationHistory: []
    });

    const planPrompt = `You are an expert product manager creating a focused, precise plan.

USER REQUEST: "${description}"

ANALYZED CONTEXT:
- App Type: ${context.appType}
- Complexity: ${context.complexity}
- Design Style: ${context.designStyle}
- Purpose: ${context.primaryPurpose}
- Visual Tone: ${context.visualTone}
- Animation Level: ${context.animationLevel}
${optionalContext}
${memoryContext}

${userPreferences ? `
⚠️ IMPORTANT: This user has preferences! Follow them:
- Design Style: ${userPreferences.designStyle || 'Not specified'}
- Color Scheme: ${userPreferences.colorScheme || 'Not specified'}
- Dark Mode: ${userPreferences.prefersDarkMode ? 'REQUIRED - User prefers dark mode' : 'Not required'}
${userPreferences.favoriteComponents ? `- Favorite Components: ${userPreferences.favoriteComponents.join(', ')}` : ''}
` : ''}

Create a concise plan (max 250 words) with:

**Overview**
[2 sentences about what this app does]

**Core Features** (only what's needed)
${context.complexity === "simple" ? "- 2-3 essential features" : context.complexity === "moderate" ? "- 4-6 main features" : "- 6-8 comprehensive features"}

**Design Direction**
- Style: ${context.designStyle}
- Visual tone: ${context.visualTone}
- Animations: ${context.animationLevel === "none" ? "No animations, clean and fast" : context.animationLevel === "subtle" ? "Minimal transitions only" : context.animationLevel === "moderate" ? "Smooth transitions and hover effects" : "Rich animations and interactions"}
- Images: ${context.imageContext.join(", ")} theme

**User Experience**
[2-3 key UX points for this specific app]

**Technical Notes**
[Only if complexity is moderate/complex, mention key technical considerations]

Keep it focused and actionable. No fluff, no unnecessary features.`;

    const plan = await generateWithFallback(planPrompt);
    await consumeTokens(user.id, estimatedTokens, "/api/ai/plan");

    // MEMORY INTEGRATION: Store plan and project context
    const finalProjectId = projectId || `plan_${Date.now()}_${user.id}`;
    await memoryService.storeProjectContext(finalProjectId, {
      projectId: finalProjectId,
      description,
      plan,
      designDecisions: [],
      componentChoices: [],
      technicalStack: [],
      timestamp: Date.now()
    });

    // Link project to user
    await memoryService.linkEntities(
      `user_${user.id}`,
      `project_${finalProjectId}`,
      'owns'
    );

    // Learn from plan: Extract preferences
    if (plan.toLowerCase().includes('dark')) {
      await memoryService.storeUserPreference(user.id, 'learningNotes', `Requested dark mode in plan on ${new Date().toISOString()}`);
    }
    if (context.designStyle) {
      await memoryService.storeUserPreference(user.id, 'learningNotes', `Used design style: ${context.designStyle}`);
    }

    console.log(`[Plan] Stored plan in memory: ${finalProjectId}`);

    return NextResponse.json({
      plan,
      context,
      projectId: finalProjectId
    });
  } catch (error: any) {
    console.error("Error in plan generation:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
