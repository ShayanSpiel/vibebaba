'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LogEntry {
  id: string;
  node_name: string;
  error_type?: string;
  error_message?: string;
  status: string;
  timestamp: string;
  project_id?: string;
  operation_type?: string;
}

interface NodeErrorsTableProps {
  logs: LogEntry[];
  showLoadMore?: boolean;
  onLoadMore?: () => void;
}

const NODE_COLORS: { [key: string]: string } = {
  founder: 'bg-brand-primary/20 text-brand-primary',
  pm: 'bg-blue-500/20 text-blue-400',
  ux: 'bg-purple-500/20 text-purple-400',
  frontend: 'bg-green-500/20 text-green-400',
  backend: 'bg-red-500/20 text-red-400',
  qa: 'bg-orange-500/20 text-orange-400',
  devops: 'bg-cyan-500/20 text-cyan-400',
  editor: 'bg-yellow-500/20 text-yellow-400',
  input_detector: 'bg-indigo-500/20 text-indigo-400',
  context_analyzer: 'bg-pink-500/20 text-pink-400',
  frontend_router: 'bg-teal-500/20 text-teal-400',
};

export function NodeErrorsTable({ logs, showLoadMore = false, onLoadMore }: NodeErrorsTableProps) {
  const [visibleCount, setVisibleCount] = useState(10);

  const displayedLogs = logs.slice(0, visibleCount);
  const hasMore = logs.length > visibleCount;

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Node</TableHead>
            <TableHead>Error Type</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedLogs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-text-secondary py-8">
                No errors found
              </TableCell>
            </TableRow>
          ) : (
            displayedLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-text-secondary text-sm">
                  {formatDate(log.timestamp)}
                </TableCell>
                <TableCell>
                  <Badge className={NODE_COLORS[log.node_name] || 'bg-gray-500/20 text-gray-400'}>
                    {log.node_name}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm text-text-secondary">
                  {log.error_type || log.operation_type || 'N/A'}
                </TableCell>
                <TableCell className="max-w-md truncate text-text-primary">
                  {log.error_message || 'No message'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={log.status === 'error' || log.status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {log.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {hasMore && (
        <Button
          onClick={() => setVisibleCount((v) => v + 10)}
          variant="outline"
          className="w-full"
        >
          Load More (Showing {visibleCount} of {logs.length})
        </Button>
      )}

      {showLoadMore && onLoadMore && !hasMore && logs.length >= 10 && (
        <Button onClick={onLoadMore} variant="outline" className="w-full">
          Load More from Server
        </Button>
      )}
    </div>
  );
}
