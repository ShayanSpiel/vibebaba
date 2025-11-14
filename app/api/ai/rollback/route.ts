import { NextRequest, NextResponse } from 'next/server';
import { pb } from '@/lib/database/pocketbase';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { projectId, checkpointId } = await req.json();

    if (!projectId || !checkpointId) {
      return NextResponse.json(
        { error: 'Missing projectId or checkpointId' },
        { status: 400 }
      );
    }

    console.log('[Rollback] 🔄 Rolling back to checkpoint:', checkpointId);

    // Get the checkpoint from PocketBase
    const checkpoint = await pb.collection('workflow_checkpoints').getOne(checkpointId);

    if (!checkpoint) {
      return NextResponse.json(
        { error: 'Checkpoint not found' },
        { status: 404 }
      );
    }

    console.log('[Rollback] ✅ Checkpoint found, restoring files...');
    console.log('[Rollback] 📁 Files to restore:', checkpoint.previousFilesSnapshot?.length || 0);

    // Return the restored files (previousFilesSnapshot = state before edit)
    return NextResponse.json({
      success: true,
      files: checkpoint.previousFilesSnapshot || [],
      message: 'Changes reverted successfully'
    });

  } catch (error: any) {
    console.error('[Rollback] ❌ Error:', error);
    return NextResponse.json(
      { error: error.message || 'Rollback failed' },
      { status: 500 }
    );
  }
}
