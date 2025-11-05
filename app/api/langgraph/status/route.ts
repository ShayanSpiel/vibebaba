// app/api/langgraph/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/pocketbase-middleware";
import { PocketBaseCheckpointer } from "@/lib/langgraph/checkpointer";
import { updateProject } from "@/lib/project-helpers";

/**
 * Get workflow status for a project
 *
 * GET /api/langgraph/status?projectId=xxx
 * Returns: { status, checkpoints, currentStage, completedNodes }
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Load checkpoints
    const checkpointer = new PocketBaseCheckpointer();
    const checkpoints = await checkpointer.listCheckpoints(projectId);

    if (checkpoints.length === 0) {
      return NextResponse.json({
        status: 'not_started',
        projectId,
        checkpoints: [],
        message: 'No workflow checkpoints found for this project'
      });
    }

    // Get most recent checkpoint
    const latest = checkpoints[0];

    // Debug logging
    console.log('[Status] Checkpoint state:', {
      projectId,
      hasStylingConfig: !!latest.state?.stylingConfig,
      completedNodes: latest.completedNodes,
      hasUxNode: latest.completedNodes?.includes('ux')
    });

    // ✨ Save stylingConfig to project if UX node has completed
    if (latest.state?.stylingConfig && latest.completedNodes?.includes('ux')) {
      try {
        console.log('[Status] 💾 Saving stylingConfig to project:', projectId,
          'Keys:', Object.keys(latest.state.stylingConfig));
        await updateProject(projectId, { stylingConfig: latest.state.stylingConfig });
        console.log('[Status] ✅ Saved stylingConfig successfully');
      } catch (error) {
        console.error('[Status] ❌ Failed to save stylingConfig:', error);
      }
    } else {
      console.log('[Status] ⏭️  Skipping stylingConfig save - not ready yet');
    }

    // Determine status
    const status = determineStatus(latest);

    return NextResponse.json({
      status,
      projectId,
      currentStage: latest.stage,
      lastNode: latest.lastNode,
      completedNodes: latest.completedNodes,
      checkpoints: checkpoints.map(cp => ({
        id: cp.id,
        stage: cp.stage,
        lastNode: cp.lastNode,
        timestamp: cp.timestamp
      })),
      canResume: status === 'paused' || status === 'failed'
    });

  } catch (error: any) {
    console.error("[LangGraph] Status check failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Determine workflow status from checkpoint
 */
function determineStatus(checkpoint: any): string {
  const { stage, completedNodes } = checkpoint;

  if (stage === 'complete') return 'completed';
  if (stage === 'initial') return 'not_started';
  if (completedNodes && completedNodes.length > 0) {
    // Has started but not complete
    if (completedNodes.includes('devops')) return 'completed';
    return 'in_progress';
  }

  return 'unknown';
}
