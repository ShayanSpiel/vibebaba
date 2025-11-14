// app/api/langgraph/resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/database/pocketbase-middleware";
import { createAppGenWorkflow } from "@/lib/langgraph/workflow";
import { PocketBaseCheckpointer } from "@/lib/langgraph/checkpointer";
import { emitWorkflowStart, emitWorkflowComplete } from "@/lib/langgraph/utils/logging/events";
import type { AppGenState } from "@/lib/langgraph/types";

/**
 * Resume a workflow from a saved checkpoint
 *
 * POST /api/langgraph/resume
 * Body: { projectId: string }
 * Returns: { success, result, resumedFrom }
 */
export async function POST(req: NextRequest) {
  const workflowStartTime = Date.now();

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Load checkpoint
    const checkpointer = new PocketBaseCheckpointer();
    const state = await checkpointer.loadCheckpoint(projectId);

    if (!state) {
      return NextResponse.json({ error: 'No checkpoint found for this project' }, { status: 404 });
    }

    console.log(`[LangGraph] Resuming workflow for project ${projectId}`);
    console.log(`[LangGraph] Last completed node: ${state.completedNodes[state.completedNodes.length - 1]}`);
    console.log(`[LangGraph] Stage: ${state.stage}`);

    emitWorkflowStart(projectId, `Resume from ${state.stage}`);

    // Determine which nodes need to run based on completed nodes
    const resumeFrom = determineResumePoint(state);
    console.log(`[LangGraph] Will resume from: ${resumeFrom}`);

    // Create workflow and run from resume point
    const workflow = createAppGenWorkflow();
    const result = await workflow.invoke(state as any, {
      recursionLimit: 30
    }) as unknown as AppGenState;

    const totalDuration = Date.now() - workflowStartTime;
    emitWorkflowComplete(result, totalDuration);

    console.log('[LangGraph] ✅ Resumed workflow COMPLETE!');
    console.log(`[LangGraph] Flow: ${result.completedNodes.join(' → ')}`);

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      resumedFrom: resumeFrom,
      completedNodes: result.completedNodes,
      files: result.files,
      deployUrl: result.deployUrl,
      metadata: {
        stage: result.stage,
        artifacts: Object.fromEntries(result.artifacts || []),
        errors: result.errors,
        duration: totalDuration
      }
    });

  } catch (error: any) {
    console.error("[LangGraph] Resume failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Determine which node to resume from based on completed nodes
 */
function determineResumePoint(state: AppGenState): string {
  const completed = new Set(state.completedNodes);

  if (!completed.has('founder')) return 'founder';
  if (!completed.has('pm')) return 'pm';
  if (!completed.has('ux')) return 'ux';
  if (!completed.has('frontend') || !completed.has('backend')) return 'frontend/backend';
  if (!completed.has('qa')) return 'qa';
  if (!completed.has('devops')) return 'devops';

  return 'completed';
}
