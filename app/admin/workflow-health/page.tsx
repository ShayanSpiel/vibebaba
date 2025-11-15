'use client';

import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryFilter } from './components/CategoryFilter';
import { ErrorSummaryCard } from './components/ErrorSummaryCard';
import { ErrorTrendChart } from './components/ErrorTrendChart';
import { LogViewer } from './components/LogViewer';
import { NodeErrorsTable } from './components/NodeErrorsTable';

interface WorkflowHealthData {
  summary: {
    total_executions: number;
    total_errors: number;
    total_warnings: number;
    success_rate: number;
    health_status: 'healthy' | 'degraded' | 'critical';
  };
  node_breakdown: Array<{
    node_name: string;
    executions: number;
    errors: number;
    warnings: number;
    success_rate: number;
    avg_duration_ms: number;
  }>;
  recent_errors: Array<any>;
  most_common_errors: Array<{ error: string; count: number }>;
  error_trends: { [key: string]: number };
  category_stats: {
    app_generation: { total: number; errors: number; warnings: number };
    validation: { total: number; errors: number; warnings: number };
    editor: { total: number; errors: number; warnings: number };
    deployment: { total: number; errors: number; warnings: number };
  };
}

export default function WorkflowHealthPage() {
  const [timeframe, setTimeframe] = useState('24h');
  const [healthData, setHealthData] = useState<WorkflowHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, [timeframe]);

  async function fetchHealthData() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/workflow-health?category=all&timeframe=${timeframe}`
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      console.error('Failed to fetch workflow health data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="h-8 w-8 text-brand-primary" />
          <h1 className="text-3xl font-bold text-text-primary">Workflow Health</h1>
        </div>
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="h-8 w-8 text-brand-primary" />
          <h1 className="text-3xl font-bold text-text-primary">Workflow Health</h1>
        </div>
        <p className="text-error">Failed to load workflow health data</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Workflow Health</h1>
            <p className="text-text-secondary mt-1">
              Monitor errors and performance across all workflow stages
            </p>
          </div>
        </div>

        <CategoryFilter timeframe={timeframe} onTimeframeChange={setTimeframe} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <ErrorSummaryCard
          category="App Generation"
          totalErrors={healthData.category_stats.app_generation.errors}
          totalWarnings={healthData.category_stats.app_generation.warnings}
          successRate={
            healthData.category_stats.app_generation.total > 0
              ? ((healthData.category_stats.app_generation.total -
                  healthData.category_stats.app_generation.errors) /
                  healthData.category_stats.app_generation.total) *
                100
              : 100
          }
          status={
            healthData.category_stats.app_generation.errors === 0
              ? 'healthy'
              : healthData.category_stats.app_generation.errors < 5
                ? 'degraded'
                : 'critical'
          }
        />

        <ErrorSummaryCard
          category="Validation"
          totalErrors={healthData.category_stats.validation.errors}
          totalWarnings={healthData.category_stats.validation.warnings}
          successRate={
            healthData.category_stats.validation.total > 0
              ? ((healthData.category_stats.validation.total -
                  healthData.category_stats.validation.errors) /
                  healthData.category_stats.validation.total) *
                100
              : 100
          }
          status={
            healthData.category_stats.validation.errors === 0
              ? 'healthy'
              : healthData.category_stats.validation.errors < 10
                ? 'degraded'
                : 'critical'
          }
        />

        <ErrorSummaryCard
          category="Editor"
          totalErrors={healthData.category_stats.editor.errors}
          totalWarnings={healthData.category_stats.editor.warnings}
          successRate={
            healthData.category_stats.editor.total > 0
              ? ((healthData.category_stats.editor.total -
                  healthData.category_stats.editor.errors) /
                  healthData.category_stats.editor.total) *
                100
              : 100
          }
          status={
            healthData.category_stats.editor.errors === 0
              ? 'healthy'
              : healthData.category_stats.editor.errors < 5
                ? 'degraded'
                : 'critical'
          }
        />

        <ErrorSummaryCard
          category="Deployment"
          totalErrors={healthData.category_stats.deployment.errors}
          totalWarnings={healthData.category_stats.deployment.warnings}
          successRate={
            healthData.category_stats.deployment.total > 0
              ? ((healthData.category_stats.deployment.total -
                  healthData.category_stats.deployment.errors) /
                  healthData.category_stats.deployment.total) *
                100
              : 100
          }
          status={
            healthData.category_stats.deployment.errors === 0
              ? 'healthy'
              : healthData.category_stats.deployment.errors < 3
                ? 'degraded'
                : 'critical'
          }
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nodes">Node Performance</TabsTrigger>
          <TabsTrigger value="errors">Recent Errors</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">System Health Overview</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-text-secondary mb-2">Total Executions</p>
                <p className="text-3xl font-bold text-text-primary">
                  {healthData.summary.total_executions}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-2">Total Errors</p>
                <p className="text-3xl font-bold text-error">{healthData.summary.total_errors}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-2">Success Rate</p>
                <p className="text-3xl font-bold text-success">
                  {healthData.summary.success_rate.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Most Common Errors</h2>
            {healthData.most_common_errors.length === 0 ? (
              <p className="text-text-secondary text-center py-8">No errors found</p>
            ) : (
              <div className="space-y-3">
                {healthData.most_common_errors.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-background-sunken rounded"
                  >
                    <span className="text-sm text-text-primary font-mono">{item.error}</span>
                    <span className="text-sm font-bold text-error">{item.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Node Performance Tab */}
        <TabsContent value="nodes">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Node Performance Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-3 px-4 text-text-secondary text-sm font-bold">
                      Node
                    </th>
                    <th className="text-right py-3 px-4 text-text-secondary text-sm font-bold">
                      Executions
                    </th>
                    <th className="text-right py-3 px-4 text-text-secondary text-sm font-bold">
                      Errors
                    </th>
                    <th className="text-right py-3 px-4 text-text-secondary text-sm font-bold">
                      Warnings
                    </th>
                    <th className="text-right py-3 px-4 text-text-secondary text-sm font-bold">
                      Success Rate
                    </th>
                    <th className="text-right py-3 px-4 text-text-secondary text-sm font-bold">
                      Avg Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {healthData.node_breakdown.map((node) => (
                    <tr
                      key={node.node_name}
                      className="border-b border-border-subtle hover:bg-background-sunken"
                    >
                      <td className="py-3 px-4 font-mono text-text-primary">{node.node_name}</td>
                      <td className="py-3 px-4 text-right text-text-primary">{node.executions}</td>
                      <td className="py-3 px-4 text-right text-error font-bold">{node.errors}</td>
                      <td className="py-3 px-4 text-right text-warning font-bold">
                        {node.warnings}
                      </td>
                      <td className="py-3 px-4 text-right text-success font-bold">
                        {node.success_rate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-text-secondary">
                        {node.avg_duration_ms < 1000
                          ? `${node.avg_duration_ms}ms`
                          : `${(node.avg_duration_ms / 1000).toFixed(2)}s`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Recent Errors Tab */}
        <TabsContent value="errors">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Recent Errors</h2>
            <NodeErrorsTable logs={healthData.recent_errors} showLoadMore={false} />
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">Error Trends</h2>
            <ErrorTrendChart data={healthData.error_trends} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
