'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ErrorSummaryCard } from '../components/ErrorSummaryCard';
import { NodeErrorsTable } from '../components/NodeErrorsTable';
import { CategoryFilter } from '../components/CategoryFilter';
import { Code2 } from 'lucide-react';

export default function AppGenerationHealthPage() {
  const [timeframe, setTimeframe] = useState('24h');
  const [nodeFilter, setNodeFilter] = useState('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timeframe, nodeFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'app_generation',
        timeframe,
        ...(nodeFilter !== 'all' && { node: nodeFilter }),
      });

      const response = await fetch(`/api/admin/workflow-health?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch app generation health:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">App Generation Health</h1>
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">App Generation Health</h1>
        <p className="text-error">Failed to load data</p>
      </div>
    );
  }

  const appGenStats = data.category_stats.app_generation;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code2 className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold text-text-primary">App Generation Health</h1>
            <p className="text-text-secondary mt-1">
              Monitor all nodes in the app generation workflow
            </p>
          </div>
        </div>

        <CategoryFilter
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          nodeFilter={nodeFilter}
          onNodeFilterChange={setNodeFilter}
          showNodeFilter={true}
        />
      </div>

      {/* Summary */}
      <ErrorSummaryCard
        category="App Generation Pipeline"
        totalErrors={appGenStats.errors}
        totalWarnings={appGenStats.warnings}
        successRate={
          appGenStats.total > 0
            ? ((appGenStats.total - appGenStats.errors) / appGenStats.total) * 100
            : 100
        }
        status={
          appGenStats.errors === 0 ? 'healthy' : appGenStats.errors < 5 ? 'degraded' : 'critical'
        }
      />

      {/* Node Breakdown */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Node Breakdown</h2>
        <div className="grid grid-cols-4 gap-4">
          {data.node_breakdown
            .filter((node: any) =>
              ['founder', 'pm', 'ux', 'frontend', 'backend', 'qa', 'devops', 'frontend_router'].includes(
                node.node_name
              )
            )
            .map((node: any) => (
              <Card key={node.node_name} className="p-4 bg-background-sunken">
                <h3 className="text-sm font-bold text-text-secondary uppercase mb-2">
                  {node.node_name}
                </h3>
                <div className="space-y-1">
                  <p className="text-xs text-text-tertiary">
                    Executions: <span className="text-text-primary font-bold">{node.executions}</span>
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Errors: <span className="text-error font-bold">{node.errors}</span>
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Success: <span className="text-success font-bold">{node.success_rate.toFixed(1)}%</span>
                  </p>
                </div>
              </Card>
            ))}
        </div>
      </Card>

      {/* Recent Errors */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Recent Errors</h2>
        <NodeErrorsTable logs={data.recent_errors} />
      </Card>
    </div>
  );
}
