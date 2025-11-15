'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ErrorSummaryCardProps {
  category: string;
  totalErrors: number;
  totalWarnings: number;
  successRate: number;
  status: 'healthy' | 'degraded' | 'critical';
  timestamp?: string;
}

export function ErrorSummaryCard({
  category,
  totalErrors,
  totalWarnings,
  successRate,
  status,
  timestamp,
}: ErrorSummaryCardProps) {
  const statusColors = {
    healthy: 'bg-green-500/10 text-green-500 border-green-500/20',
    degraded: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <Card className="p-6 bg-background-raised border-border-subtle">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary">{category}</h3>
        <Badge className={`${statusColors[status]} border`}>{status.toUpperCase()}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-text-secondary">Errors</p>
          <p className="text-2xl font-bold text-error">{totalErrors}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Warnings</p>
          <p className="text-2xl font-bold text-warning">{totalWarnings}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Success Rate</p>
          <p className="text-2xl font-bold text-success">{successRate.toFixed(1)}%</p>
        </div>
      </div>

      {timestamp && (
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <p className="text-xs text-text-tertiary">
            Last updated: {new Date(timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </Card>
  );
}
