/**
 * Action Runner System (inspired by Bolt.new)
 *
 * Provides sequential action execution with:
 * - Status tracking (pending → running → complete/failed/aborted)
 * - Loop prevention through execution flags
 * - Abort controller for cancellable operations
 * - Promise chaining to prevent race conditions
 */

import { VirtualFileSystem, createVirtualFileSystem } from './files/file-operations';
import { retryWithBackoff, globalCircuitBreaker, globalErrorDeduplicator } from './monitoring/error-prevention';

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

export type ActionType = 'file' | 'shell' | 'modification';

export interface BaseAction {
  id: string;
  type: ActionType;
  content: string;
  filePath?: string;
  status: ActionStatus;
  executed: boolean;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface FileAction extends BaseAction {
  type: 'file';
  filePath: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
  command: string;
}

export interface ModificationAction extends BaseAction {
  type: 'modification';
  filePath: string;
  targetCode?: string;
}

export type Action = FileAction | ShellAction | ModificationAction;

export interface ActionResult {
  actionId: string;
  status: ActionStatus;
  output?: string;
  error?: string;
  duration?: number;
}

export class ActionRunner {
  private actions: Map<string, Action> = new Map();
  private currentExecutionPromise: Promise<void> = Promise.resolve();
  private abortControllers: Map<string, AbortController> = new Map();
  private listeners: Set<(action: Action) => void> = new Set();
  private vfs: VirtualFileSystem | null = null;
  private projectId: string | null = null;

  /**
   * Add a new action to the queue
   * Returns false if action already exists (deduplication)
   */
  addAction(action: Omit<Action, 'status' | 'executed' | 'createdAt'>): boolean {
    // Deduplication: prevent adding same action twice
    if (this.actions.has(action.id)) {
      console.log(`[ActionRunner] Action ${action.id} already exists, skipping`);
      return false;
    }

    const abortController = new AbortController();
    this.abortControllers.set(action.id, abortController);

    const newAction: Action = {
      ...action,
      status: 'pending',
      executed: false,
      createdAt: Date.now(),
    } as Action;

    this.actions.set(action.id, newAction);
    this.notifyListeners(newAction);

    console.log(`[ActionRunner] Added action ${action.id} (${action.type})`);
    return true;
  }

  /**
   * Run an action (adds to sequential execution queue)
   */
  async runAction(actionId: string): Promise<ActionResult> {
    const action = this.actions.get(actionId);

    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    // Loop prevention: prevent re-execution
    if (action.executed) {
      console.log(`[ActionRunner] Action ${actionId} already executed, skipping`);
      return {
        actionId,
        status: action.status,
        error: 'Action already executed',
      };
    }

    // Mark as executed immediately to prevent duplicate runs
    this.updateAction(actionId, { executed: true });

    // Sequential execution via promise chaining
    return new Promise((resolve) => {
      this.currentExecutionPromise = this.currentExecutionPromise
        .then(async () => {
          const result = await this.executeAction(actionId);
          resolve(result);
        })
        .catch((error) => {
          console.error(`[ActionRunner] Action ${actionId} failed:`, error);
          const failedResult: ActionResult = {
            actionId,
            status: 'failed',
            error: error.message,
          };
          resolve(failedResult);
        });
    });
  }

  /**
   * Execute a single action
   */
  private async executeAction(actionId: string): Promise<ActionResult> {
    const action = this.actions.get(actionId);

    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    const startTime = Date.now();
    this.updateAction(actionId, { status: 'running' });

    try {
      let output: string | undefined;

      switch (action.type) {
        case 'file':
          output = await this.executeFileAction(action as FileAction);
          break;
        case 'shell':
          output = await this.executeShellAction(action as ShellAction);
          break;
        case 'modification':
          output = await this.executeModificationAction(action as ModificationAction);
          break;
        default:
          throw new Error(`Unknown action type: ${(action as any).type}`);
      }

      const abortController = this.abortControllers.get(actionId);
      const finalStatus = abortController?.signal.aborted ? 'aborted' : 'complete';

      this.updateAction(actionId, {
        status: finalStatus,
        completedAt: Date.now(),
      });

      return {
        actionId,
        status: finalStatus,
        output,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      this.updateAction(actionId, {
        status: 'failed',
        error: error.message,
        completedAt: Date.now(),
      });

      return {
        actionId,
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Set project ID for file operations
   */
  setProjectId(projectId: string): void {
    this.projectId = projectId;
    this.vfs = createVirtualFileSystem(projectId);
    console.log(`[ActionRunner] Set project ID: ${projectId}`);
  }

  /**
   * Execute a file action (handled by file-operations.ts)
   */
  private async executeFileAction(action: FileAction): Promise<string> {
    if (!this.vfs) {
      throw new Error('Project ID not set. Call setProjectId() first.');
    }

    const abortController = this.abortControllers.get(action.id);

    // Check if aborted before starting
    if (abortController?.signal.aborted) {
      throw new Error('Action aborted before execution');
    }

    // Use circuit breaker and retry logic
    const result = await globalCircuitBreaker.execute(async () => {
      return await retryWithBackoff(
        async () => {
          const writeResult = await this.vfs!.writeFile({
            filePath: action.filePath,
            content: action.content,
          });

          if (!writeResult.success) {
            throw new Error(writeResult.error || 'File write failed');
          }

          return writeResult;
        },
        {
          maxAttempts: 3,
          initialDelay: 500,
          maxDelay: 2000,
          shouldRetry: (error, attempt) => {
            // Log error only if it's not a duplicate
            if (globalErrorDeduplicator.shouldLog(error, 'file-action')) {
              console.error(`[ActionRunner] File action attempt ${attempt} failed:`, error);
            }
            return true;
          },
        }
      );
    });

    return `File written: ${result.filePath} (${result.bytesWritten} bytes)`;
  }

  /**
   * Execute a shell action (placeholder for future implementation)
   */
  private async executeShellAction(action: ShellAction): Promise<string> {
    // Browser environment - shell actions not supported
    // This would be used in Node.js/server-side context
    throw new Error('Shell actions not supported in browser environment');
  }

  /**
   * Execute a modification action
   */
  private async executeModificationAction(action: ModificationAction): Promise<string> {
    // This will integrate with existing chat/modification logic
    return `Modification action: ${action.filePath}`;
  }

  /**
   * Abort a running action
   */
  abortAction(actionId: string): boolean {
    const action = this.actions.get(actionId);

    if (!action) {
      return false;
    }

    const abortController = this.abortControllers.get(actionId);

    if (abortController) {
      abortController.abort();
      this.updateAction(actionId, { status: 'aborted', completedAt: Date.now() });
      console.log(`[ActionRunner] Aborted action ${actionId}`);
      return true;
    }

    return false;
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): Action | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Get all actions
   */
  getAllActions(): Action[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get actions by status
   */
  getActionsByStatus(status: ActionStatus): Action[] {
    return Array.from(this.actions.values()).filter(a => a.status === status);
  }

  /**
   * Clear completed actions
   */
  clearCompleted(): void {
    for (const [id, action] of this.actions) {
      if (action.status === 'complete') {
        this.actions.delete(id);
        this.abortControllers.delete(id);
      }
    }
  }

  /**
   * Clear all actions
   */
  clearAll(): void {
    this.actions.clear();
    this.abortControllers.clear();
  }

  /**
   * Update action state
   */
  private updateAction(actionId: string, updates: Partial<Action>): void {
    const action = this.actions.get(actionId);

    if (!action) {
      return;
    }

    const updatedAction = { ...action, ...updates } as Action;
    this.actions.set(actionId, updatedAction);
    this.notifyListeners(updatedAction);
  }

  /**
   * Subscribe to action updates
   */
  subscribe(listener: (action: Action) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of action update
   */
  private notifyListeners(action: Action): void {
    this.listeners.forEach(listener => {
      try {
        listener(action);
      } catch (error) {
        console.error('[ActionRunner] Listener error:', error);
      }
    });
  }

  /**
   * Get execution statistics
   */
  getStats() {
    const actions = Array.from(this.actions.values());

    return {
      total: actions.length,
      pending: actions.filter(a => a.status === 'pending').length,
      running: actions.filter(a => a.status === 'running').length,
      complete: actions.filter(a => a.status === 'complete').length,
      failed: actions.filter(a => a.status === 'failed').length,
      aborted: actions.filter(a => a.status === 'aborted').length,
    };
  }
}

// Singleton instance for global use
let globalActionRunner: ActionRunner | null = null;

export function getActionRunner(): ActionRunner {
  if (!globalActionRunner) {
    globalActionRunner = new ActionRunner();
  }
  return globalActionRunner;
}
