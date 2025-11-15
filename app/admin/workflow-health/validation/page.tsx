'use client';

/**
 * ADMIN VALIDATION DASHBOARD
 *
 * Monitors validation errors and debugging sessions
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ValidationError {
  id: string;
  projectId: string;
  errorType: string;
  severity: 'error' | 'warning';
  rule: string;
  file: string;
  line: number;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  isFixed: boolean;
  attemptNumber: number;
  created: string;
}

interface ValidationSession {
  id: string;
  projectId: string;
  sessionType: string;
  attemptNumber: number;
  totalFiles: number;
  totalErrors: number;
  totalWarnings: number;
  totalFixed: number;
  wasSuccessful: boolean;
  timestamp?: string;
  durationMs?: number;
  created: string;
}

interface AggregateStats {
  totalErrors: number;
  totalWarnings: number;
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  successRate: string;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  mostCommonErrors: Array<{ rule: string; count: number; severity: string }>;
  errorTrend: Array<{ date: string; count: number }>;
  recentErrors: ValidationError[];
  recentSessions: ValidationSession[];
}

export default function ValidationDashboard() {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [sessions, setSessions] = useState<ValidationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Use workflow-health API (PocketBase) for consistency
      const response = await fetch('/api/admin/workflow-health?category=validation&timeframe=30d');

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      // Transform workflow-health data to match validation page expectations
      const validationStats = data.category_stats?.validation || {
        total: 0,
        errors: 0,
        warnings: 0,
      };
      const totalErrors = validationStats.errors;
      const totalWarnings = validationStats.warnings;
      const totalSessions = validationStats.total;
      const successfulSessions = totalSessions - totalErrors;
      const failedSessions = totalErrors;
      const successRate =
        totalSessions > 0 ? ((successfulSessions / totalSessions) * 100).toFixed(1) : '0';

      // Get recent errors from workflow data
      const recentErrors = data.recent_errors || [];

      const transformedStats: AggregateStats = {
        totalErrors,
        totalWarnings,
        totalSessions,
        successfulSessions,
        failedSessions,
        successRate,
        errorsByType: {},
        errorsBySeverity: { error: totalErrors, warning: totalWarnings },
        mostCommonErrors:
          data.most_common_errors?.map((e: any) => ({
            rule: e.error,
            count: e.count,
            severity: 'error',
          })) || [],
        errorTrend: Object.entries(data.error_trends || {}).map(([date, count]) => ({
          date,
          count: count as number,
        })),
        recentErrors: recentErrors.map((err: any) => ({
          id: err.id,
          projectId: err.project_id || '',
          errorType: err.error_type || 'Unknown',
          severity: 'error' as const,
          rule: err.error_type || 'Unknown',
          file: 'N/A',
          line: 0,
          message: err.error_message || '',
          suggestion: undefined,
          autoFixable: false,
          isFixed: false,
          attemptNumber: 1,
          created: err.timestamp || new Date().toISOString(),
        })),
        recentSessions: [],
      };

      setStats(transformedStats);
      setErrors(transformedStats.recentErrors);
      setSessions([]);
    } catch (error) {
      console.error('Failed to load validation data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading validation data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Validation Dashboard</h1>
          <p className="text-text-secondary">Monitor validation errors and AI debugging sessions</p>
        </div>
        <Button onClick={() => (window.location.href = '/admin/validation/logs')} variant="outline">
          View Full Logs
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Recent Errors</TabsTrigger>
          <TabsTrigger value="sessions">Debug Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Errors</CardDescription>
                <CardTitle className="text-3xl text-destructive">
                  {stats?.totalErrors || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">{stats?.totalWarnings || 0} warnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Sessions</CardDescription>
                <CardTitle className="text-3xl">{stats?.totalSessions || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-primary">
                  {stats?.successfulSessions || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-3xl text-text-primary">
                  {stats?.successRate || 0}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">{stats?.failedSessions || 0} failed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Auto-Fixed</CardDescription>
                <CardTitle className="text-3xl text-text-primary">
                  {errors.filter((e) => e.isFixed).length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  {((errors.filter((e) => e.isFixed).length / (errors.length || 1)) * 100).toFixed(
                    0
                  )}
                  % of errors
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Most Common Errors */}
          <Card>
            <CardHeader>
              <CardTitle>Most Common Errors</CardTitle>
              <CardDescription>Top 10 validation errors</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.mostCommonErrors?.slice(0, 10).map((error, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{error.rule}</TableCell>
                      <TableCell>{error.count}</TableCell>
                      <TableCell>
                        <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                          {error.severity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Validation Errors</CardTitle>
              <CardDescription>Last 20 validation errors across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Fixed</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell className="font-mono text-sm">
                        {error.file}:{error.line}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{error.rule}</TableCell>
                      <TableCell className="max-w-xs truncate">{error.message}</TableCell>
                      <TableCell>
                        <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                          {error.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {error.isFixed ? (
                          <Badge variant="outline" className="bg-muted">
                            Yes
                          </Badge>
                        ) : error.autoFixable ? (
                          <Badge variant="outline" className="bg-muted text-text-secondary">
                            Fixable
                          </Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>{error.attemptNumber}</TableCell>
                      <TableCell className="text-sm text-text-secondary">
                        {new Date(error.created).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Debug Sessions</CardTitle>
              <CardDescription>Recent validation and debugging sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Warnings</TableHead>
                    <TableHead>Fixed</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <Badge variant="outline">{session.sessionType}</Badge>
                      </TableCell>
                      <TableCell>{session.totalFiles}</TableCell>
                      <TableCell className="text-destructive">{session.totalErrors}</TableCell>
                      <TableCell className="text-text-primary">{session.totalWarnings}</TableCell>
                      <TableCell className="text-text-primary">{session.totalFixed}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {session.durationMs
                          ? session.durationMs < 1000
                            ? `${session.durationMs}ms`
                            : session.durationMs < 60000
                              ? `${(session.durationMs / 1000).toFixed(2)}s`
                              : `${(session.durationMs / 60000).toFixed(2)}m`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {session.wasSuccessful ? (
                          <Badge className="bg-primary">Success</Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </TableCell>
                      <TableCell>{session.attemptNumber}</TableCell>
                      <TableCell className="text-sm text-text-secondary">
                        {new Date(session.timestamp || session.created).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Errors by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats?.errorsByType || {}).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="font-medium capitalize">{type}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.errorTrend?.map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm">{day.date}</span>
                      <Badge variant="outline">{day.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button onClick={loadData} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
