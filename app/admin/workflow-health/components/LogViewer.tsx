'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LogEntry {
  id: string;
  node_name?: string;
  operation_type?: string;
  status: string;
  error_message?: string;
  error_stack?: string;
  timestamp: string;
  duration_ms?: number;
}

interface LogViewerProps {
  logs: LogEntry[];
  title?: string;
}

export function LogViewer({ logs, title = 'Logs' }: LogViewerProps) {
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const displayedLogs = logs.slice(0, visibleCount);
  const hasMore = logs.length > visibleCount;

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>

      <div className="space-y-2">
        {displayedLogs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">No logs available</p>
          </Card>
        ) : (
          displayedLogs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            const hasDetails = log.error_stack || log.error_message;

            return (
              <Card key={log.id} className="p-4">
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => hasDetails && toggleExpand(log.id)}
                >
                  {hasDetails && (
                    <div className="mt-1">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-text-secondary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-text-secondary" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant={
                          log.status === 'error' || log.status === 'failed'
                            ? 'destructive'
                            : log.status === 'warning'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {log.status}
                      </Badge>

                      {log.node_name && (
                        <span className="text-sm font-mono text-text-primary">{log.node_name}</span>
                      )}

                      {log.operation_type && (
                        <span className="text-sm text-text-secondary">{log.operation_type}</span>
                      )}

                      <span className="text-xs text-text-tertiary ml-auto">
                        {formatDate(log.timestamp)}
                      </span>

                      {log.duration_ms !== undefined && (
                        <span className="text-xs text-text-tertiary">
                          Duration: {formatDuration(log.duration_ms)}
                        </span>
                      )}
                    </div>

                    {log.error_message && !isExpanded && (
                      <p className="text-sm text-text-secondary truncate">{log.error_message}</p>
                    )}

                    {isExpanded && (
                      <div className="mt-4 space-y-3 pt-3 border-t border-border-subtle">
                        {log.error_message && (
                          <div>
                            <p className="text-xs font-bold text-text-secondary mb-1">
                              Error Message:
                            </p>
                            <p className="text-sm text-text-primary font-mono bg-background-sunken p-3 rounded">
                              {log.error_message}
                            </p>
                          </div>
                        )}

                        {log.error_stack && (
                          <div>
                            <p className="text-xs font-bold text-text-secondary mb-1">
                              Stack Trace:
                            </p>
                            <pre className="text-xs text-text-primary font-mono bg-background-sunken p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                              {log.error_stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {hasMore && (
        <Button onClick={() => setVisibleCount((v) => v + 10)} variant="outline" className="w-full">
          Load More (Showing {visibleCount} of {logs.length})
        </Button>
      )}
    </div>
  );
}
