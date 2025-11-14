// lib/langgraph/checkpointer.ts
import { pb } from '@/lib/database/pocketbase';
import type { AppGenState } from './types';

export class PocketBaseCheckpointer {
  /**
   * Save workflow state to PocketBase
   */
  async saveCheckpoint(projectId: string, state: AppGenState): Promise<void> {
    try {
      // Convert Map to object for JSON serialization
      const serializedState = {
        ...state,
        artifacts: state.artifacts ? Object.fromEntries(state.artifacts) : {}
      };

      await pb.collection('workflow_checkpoints').create({
        projectId,
        state: JSON.stringify(serializedState),
        timestamp: new Date().toISOString(),
        stage: state.stage,
        completedNodes: state.completedNodes,
        lastNode: state.completedNodes[state.completedNodes.length - 1] || null
      });

      console.log(`[Checkpointer] Saved checkpoint for ${projectId} at stage ${state.stage}`);
    } catch (error) {
      console.error('[Checkpointer] Failed to save checkpoint:', error);
    }
  }

  /**
   * Load most recent checkpoint for a project
   */
  async loadCheckpoint(projectId: string): Promise<AppGenState | null> {
    try {
      const checkpoint = await pb.collection('workflow_checkpoints')
        .getFirstListItem(`projectId="${projectId}"`, {
          sort: '-timestamp'
        });

      const state = JSON.parse(checkpoint.state);

      // Restore Map from object
      state.artifacts = new Map(Object.entries(state.artifacts || {}));

      console.log(`[Checkpointer] Loaded checkpoint for ${projectId} from stage ${state.stage}`);
      return state;
    } catch (error) {
      console.log(`[Checkpointer] No checkpoint found for ${projectId}`);
      return null;
    }
  }

  /**
   * Delete checkpoints for a project
   */
  async deleteCheckpoints(projectId: string): Promise<void> {
    try {
      const checkpoints = await pb.collection('workflow_checkpoints')
        .getFullList({ filter: `projectId="${projectId}"` });

      for (const checkpoint of checkpoints) {
        await pb.collection('workflow_checkpoints').delete(checkpoint.id);
      }

      console.log(`[Checkpointer] Deleted ${checkpoints.length} checkpoints for ${projectId}`);
    } catch (error) {
      console.error('[Checkpointer] Failed to delete checkpoints:', error);
    }
  }

  /**
   * List all checkpoints for a project
   */
  async listCheckpoints(projectId: string): Promise<any[]> {
    try {
      const checkpoints = await pb.collection('workflow_checkpoints')
        .getFullList({
          filter: `projectId="${projectId}"`,
          sort: '-timestamp'
        });

      return checkpoints.map(cp => ({
        id: cp.id,
        projectId: cp.projectId,
        stage: cp.stage,
        lastNode: cp.lastNode,
        completedNodes: cp.completedNodes,
        timestamp: cp.timestamp
      }));
    } catch (error) {
      console.error('[Checkpointer] Failed to list checkpoints:', error);
      return [];
    }
  }
}

/**
 * Helper to create workflow with automatic checkpointing
 */
export async function createWorkflowWithCheckpoints() {
  const { createAppGenWorkflow } = await import('./workflow');
  const workflow = createAppGenWorkflow();
  const checkpointer = new PocketBaseCheckpointer();

  // Checkpointing will be handled by nodes themselves if needed
  // Or can be added as middleware to the workflow

  return { workflow, checkpointer };
}
