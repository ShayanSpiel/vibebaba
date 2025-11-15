'use client';

import { Edit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CategoryFilter } from '../components/CategoryFilter';
import { ErrorSummaryCard } from '../components/ErrorSummaryCard';
import { LogViewer } from '../components/LogViewer';

export default function EditorHealthPage() {
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
        `/api/admin/workflow-health?category=editor&timeframe=${timeframe}`
      );
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch editor health:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Editor Operations</h1>
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Editor Operations</h1>
        <p className="text-error">Failed to load data</p>
      </div>
    );
  }

  const editorStats = data.category_stats.editor;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Editor Operations</h1>
            <p className="text-text-secondary mt-1">
              Monitor code editing operations and modifications
            </p>
          </div>
        </div>

        <CategoryFilter timeframe={timeframe} onTimeframeChange={setTimeframe} />
      </div>

      {/* Summary */}
      <ErrorSummaryCard
        category="Editor Operations"
        totalErrors={editorStats.errors}
        totalWarnings={editorStats.warnings}
        successRate={
          editorStats.total > 0
            ? ((editorStats.total - editorStats.errors) / editorStats.total) * 100
            : 100
        }
        status={
          editorStats.errors === 0 ? 'healthy' : editorStats.errors < 5 ? 'degraded' : 'critical'
        }
      />

      {/* Operation Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-text-secondary mb-2">Total Operations</p>
          <p className="text-3xl font-bold text-text-primary">{editorStats.total}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary mb-2">Successful</p>
          <p className="text-3xl font-bold text-success">
            {editorStats.total - editorStats.errors}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary mb-2">Failed</p>
          <p className="text-3xl font-bold text-error">{editorStats.errors}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-text-secondary mb-2">Success Rate</p>
          <p className="text-3xl font-bold text-success">
            {editorStats.total > 0
              ? (((editorStats.total - editorStats.errors) / editorStats.total) * 100).toFixed(1)
              : '100'}
            %
          </p>
        </Card>
      </div>

      {/* Recent Operations */}
      <Card className="p-6">
        <LogViewer
          logs={data.recent_errors.filter((log: any) => log.node_name === 'editor')}
          title="Recent Editor Operations"
        />
      </Card>
    </div>
  );
}
