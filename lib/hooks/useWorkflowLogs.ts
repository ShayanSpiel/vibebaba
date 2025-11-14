// lib/hooks/useWorkflowLogs.ts
import { useEffect, useState, useCallback, useRef } from 'react';

export interface WorkflowLog {
  type: 'connected' | 'node:start' | 'node:complete' | 'node:error' | 'workflow:complete' | 'progress' | 'autogen:attempt:start' | 'autogen:agent:start' | 'autogen:agent:complete' | 'autogen:error:diff';
  nodeName?: string;
  agentRole?: string; // AutoGen agent role (analyst, fixer, fileops, reviewer)
  projectId: string;
  message: string;
  timestamp: string;
  duration?: number;
  error?: { message: string; stack?: string };
  thinkingProcess?: {
    userInput: string;
    interpretation: string;
    plan: string;
  };
  taskDetails?: {
    taskDescription: string;
    success: boolean;
    output?: any;
    summary: string;
  };
  details?: any; // For progress event details
}

export interface UseWorkflowLogsOptions {
  projectId: string;
  enabled?: boolean;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  initialLogs?: WorkflowLog[]; // Restore logs from previous session
}

/**
 * React hook for consuming real-time workflow logs via Server-Sent Events
 *
 * @example
 * ```tsx
 * const { logs, isConnected } = useWorkflowLogs({
 *   projectId: 'abc123',
 *   enabled: isGenerating,
 *   onComplete: () => console.log('Workflow done!')
 * });
 *
 * // Display logs in console or UI
 * logs.forEach(log => console.log(`[${log.nodeName}] ${log.message}`));
 * ```
 */
export function useWorkflowLogs({
  projectId,
  enabled = true,
  onComplete,
  onError,
  initialLogs = []
}: UseWorkflowLogsOptions) {
  const [logs, setLogs] = useState<WorkflowLog[]>(initialLogs);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const hasLoadedInitialLogs = useRef(false);

  // Use refs to store latest callbacks without causing re-renders
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  // ✅ FIX: Update logs when initialLogs changes (on project load or clear)
  // Load initial logs when they become available, or clear when they're reset
  useEffect(() => {
    // Load saved logs when project data arrives (not generating yet)
    if (initialLogs.length > 0 && !hasLoadedInitialLogs.current && !enabled) {
      setLogs(initialLogs);
      hasLoadedInitialLogs.current = true;
    }
    // Clear logs when they're explicitly reset (e.g., regenerate)
    else if (initialLogs.length === 0 && hasLoadedInitialLogs.current && !enabled) {
      setLogs([]);
      hasLoadedInitialLogs.current = false;
    }
  }, [initialLogs, enabled]);

  // Add log to array
  const addLog = useCallback((log: WorkflowLog) => {
    setLogs(prev => [...prev, log]);
    // Console logging removed - all information shown in UI
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Close any existing connection before creating a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let connectionClosed = false;
    let workflowCompleted = false;

    // Exponential backoff calculator
    const getBackoffDelay = (attempt: number) => {
      return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
    };

    const closeConnection = () => {
      if (connectionClosed) return;
      connectionClosed = true;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      setIsConnected(false);
    };

    const connect = () => {
      if (connectionClosed) return;

      // Create EventSource connection
      eventSource = new EventSource(`/api/langgraph/stream?projectId=${projectId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttempts = 0; // Reset on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const log: WorkflowLog = JSON.parse(event.data);
          addLog(log);

          // Handle workflow completion
          if (log.type === 'workflow:complete') {
            workflowCompleted = true; // Mark as completed to prevent error reporting
            onCompleteRef.current?.();
            // Close connection after a delay
            setTimeout(() => {
              closeConnection();
            }, 2000);
          }
        } catch (error) {
          // Silent error handling - connection issues are handled by onerror
        }
      };

      eventSource.onerror = (error) => {
        // Close current connection
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // Only retry if not manually closed, under retry limit, and workflow not complete
        if (!connectionClosed && !workflowCompleted && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && enabled) {
          reconnectAttempts++;
          const delay = getBackoffDelay(reconnectAttempts);

          console.log(`[Workflow SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

          reconnectTimeout = setTimeout(() => {
            if (!connectionClosed && !workflowCompleted) {
              connect(); // Retry connection
            }
          }, delay);
        } else {
          // Max retries exceeded or workflow complete
          setIsConnected(false);
          // Don't call onError if the workflow completed successfully
          if (!workflowCompleted && !connectionClosed) {
            onErrorRef.current?.(new Error('SSE connection failed'));
          }
          closeConnection();
        }
      };
    };

    // Start initial connection
    connect();

    // Cleanup on unmount
    return () => {
      closeConnection();
    };
    // Only re-run when projectId or enabled changes, not when callbacks change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, enabled]);

  // Get current node name (last node that started)
  const currentNode = logs
    .filter(log => log.type === 'node:start')
    .slice(-1)[0]?.nodeName;

  // Get completion status
  const isComplete = logs.some(log => log.type === 'workflow:complete');
  const hasError = logs.some(log => log.type === 'node:error');

  return {
    logs,
    isConnected,
    currentNode,
    isComplete,
    hasError,
    clearLogs,
    lastLog: logs[logs.length - 1] || null
  };
}
