// app/api/project/revert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pb } from '@/lib/database/pocketbase';

export async function POST(request: NextRequest) {
  try {
    const { projectId, checkpointId } = await request.json();

    if (!projectId || !checkpointId) {
      return NextResponse.json(
        { error: 'Missing projectId or checkpointId' },
        { status: 400 }
      );
    }

    console.log(`[Revert] Reverting project ${projectId} to checkpoint ${checkpointId}`);

    // 1. Fetch the checkpoint
    const checkpoint = await pb.collection('workflow_checkpoints').getOne(checkpointId);

    if (checkpoint.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Checkpoint does not belong to this project' },
        { status: 403 }
      );
    }

    // 2. Get previous files snapshot from checkpoint
    const previousFiles = checkpoint.previousFilesSnapshot || [];

    if (!previousFiles || previousFiles.length === 0) {
      return NextResponse.json(
        { error: 'Checkpoint does not contain previous files snapshot' },
        { status: 400 }
      );
    }

    console.log(`[Revert] Restoring ${previousFiles.length} files from checkpoint`);

    // 3. Update project with previous files
    await pb.collection('projects').update(projectId, {
      files: previousFiles,
      updatedAt: new Date().toISOString()
    });

    console.log(`[Revert] ✅ Project ${projectId} reverted successfully`);

    // 4. Return the restored files for immediate re-deployment
    return NextResponse.json({
      success: true,
      files: previousFiles,
      message: 'Changes reverted successfully',
      checkpointDescription: checkpoint.description
    });

  } catch (error: any) {
    console.error('[Revert] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revert changes' },
      { status: 500 }
    );
  }
}
