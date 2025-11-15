'use client';

import { Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CategoryFilter } from '../components/CategoryFilter';
import { ErrorSummaryCard } from '../components/ErrorSummaryCard';
import { LogViewer } from '../components/LogViewer';

export default function DeploymentHealthPage() {
  const [timeframe, setTimeframe] = useState('24h');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/workflow-health?category=deployment&timeframe=${timeframe}`
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch deployment health:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Deployment Health</h1>
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Deployment Health</h1>
        <p className="text-error">Failed to load data</p>
      </div>
    );
  }

  const deploymentStats = data.category_stats.deployment;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rocket className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Deployment Health</h1>
            <p className="text-text-secondary mt-1">
              Monitor deployment processes and build status
            </p>
          </div>
        </div>

        <CategoryFilter timeframe={timeframe} onTimeframeChange={setTimeframe} />
      </div>

      {/* Summary */}
      <ErrorSummaryCard
        category="Deployments"
        totalErrors={deploymentStats.errors}
        totalWarnings={deploymentStats.warnings}
        successRate={
          deploymentStats.total > 0
            ? ((deploymentStats.total - deploymentStats.errors) / deploymentStats.total) * 100
            : 100
        }
        status={
          deploymentStats.errors === 0
            ? 'healthy'
            : deploymentStats.errors < 3
              ? 'degraded'
              : 'critical'
        }
      />

      {/* Deployment Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-text-secondary mb-2">Total Deployments</p>
          <p className="text-3xl font-bold text-text-primary">{deploymentStats.total}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary mb-2">Successful</p>
          <p className="text-3xl font-bold text-success">
            {deploymentStats.total - deploymentStats.errors}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary mb-2">Failed</p>
          <p className="text-3xl font-bold text-error">{deploymentStats.errors}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary mb-2">Success Rate</p>
          <p className="text-3xl font-bold text-success">
            {deploymentStats.total > 0
              ? (
                  ((deploymentStats.total - deploymentStats.errors) / deploymentStats.total) *
                  100
                ).toFixed(1)
              : '100'}
            %
          </p>
        </Card>
      </div>

      {/* Recent Deployments */}
      <Card className="p-6">
        <LogViewer logs={[]} title="Recent Deployments (Coming Soon)" />
        <p className="text-center text-text-secondary py-8">
          Deployment logs will appear here once deployments are tracked
        </p>
      </Card>
    </div>
  );
}
