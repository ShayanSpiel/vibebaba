// lib/langgraph/utils.ts
import type { AppGenState } from '../types';

/**
 * Helper to merge state updates
 */
export function mergeState(current: AppGenState, updates: Partial<AppGenState>): AppGenState {
  return {
    ...current,
    ...updates,
    completedNodes: updates.completedNodes || current.completedNodes,
    errors: updates.errors || current.errors,
    artifacts: updates.artifacts || current.artifacts,
  };
}

/**
 * Helper to check if a node has been completed
 */
export function isNodeCompleted(state: AppGenState, nodeName: string): boolean {
  return state.completedNodes.includes(nodeName);
}

/**
 * Helper to get the last completed node
 */
export function getLastCompletedNode(state: AppGenState): string | undefined {
  return state.completedNodes[state.completedNodes.length - 1];
}

/**
 * Helper to check if the workflow has errors
 */
export function hasErrors(state: AppGenState): boolean {
  return state.errors.length > 0;
}

/**
 * Helper to format duration in ms to human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
