/**
 * ADMIN WORKFLOW HEALTH API ROUTE
 *
 * Provides comprehensive workflow monitoring data for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { getAdminPb } from '@/lib/database/pocketbase-admin';

// Helper to get timeframe filter
function getTimeframeFilter(timeframe: string): string {
  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default 24h
  }

  return `timestamp >= "${startDate.toISOString()}"`;
}

// Helper to categorize nodes
function categorizeNode(nodeName: string): string {
  const appGenNodes = ['founder', 'pm', 'ux', 'frontend', 'backend', 'qa', 'devops', 'frontend_router'];

  if (appGenNodes.includes(nodeName)) return 'app_generation';
  if (nodeName === 'editor' || nodeName === 'context_analyzer' || nodeName === 'input_detector') return 'editor';

  return 'other';
}

/**
 * GET /api/admin/workflow-health
 *
 * Query params:
 * - category: app_generation|validation|editor|deployment|all
 * - timeframe: 1h|24h|7d|30d
 * - node: specific node filter (optional)
 */
export async function GET(req: NextRequest) {
  return requireAdmin(req, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get('category') || 'all';
      const timeframe = searchParams.get('timeframe') || '24h';
      const nodeFilter = searchParams.get('node');

      const timeframeFilter = getTimeframeFilter(timeframe);

      // Get admin-authenticated PocketBase client
      const pb = await getAdminPb();

      // Fetch workflow execution logs with graceful handling
      let workflowLogs: any[] = [];
      try {
        let workflowFilter = timeframeFilter;
        if (nodeFilter && nodeFilter !== 'all') {
          workflowFilter += ` && node_name = "${nodeFilter}"`;
        }
        workflowLogs = await pb.collection('workflow_execution_logs').getFullList({
          filter: workflowFilter,
          sort: '-timestamp',
          requestKey: null,
        });
      } catch (error: any) {
        if (error.status === 404) {
          console.warn('[Workflow Health] workflow_execution_logs collection not found - returning empty data');
        } else {
          throw error;
        }
      }

      // Fetch editor logs with graceful handling
      let editorLogs: any[] = [];
      try {
        editorLogs = await pb.collection('editor_operation_logs').getFullList({
          filter: timeframeFilter,
          sort: '-timestamp',
          requestKey: null,
        });
      } catch (error: any) {
        if (error.status === 404) {
          console.warn('[Workflow Health] editor_operation_logs collection not found - returning empty data');
        } else {
          throw error;
        }
      }

      // Fetch deployment logs with graceful handling
      let deploymentLogs: any[] = [];
      try {
        deploymentLogs = await pb.collection('deployment_logs').getFullList({
          filter: timeframeFilter,
          sort: '-timestamp',
          requestKey: null,
        });
      } catch (error: any) {
        if (error.status === 404) {
          console.warn('[Workflow Health] deployment_logs collection not found - returning empty data');
        } else {
          throw error;
        }
      }

      // Fetch validation errors with graceful handling
      let validationErrors: any[] = [];
      try {
        validationErrors = await pb.collection('validation_errors').getFullList({
          filter: timeframeFilter,
          sort: '-timestamp',
          requestKey: null,
        });
      } catch (error: any) {
        if (error.status === 404) {
          console.warn('[Workflow Health] validation_errors collection not found - returning empty data');
        } else {
          throw error;
        }
      }

      // Calculate summary statistics
      const workflowErrors = workflowLogs.filter((log: any) => log.status === 'error');
      const workflowWarnings = workflowLogs.filter((log: any) => log.status === 'warning');
      const editorErrors = editorLogs.filter((log: any) => log.status === 'error');
      const deploymentFailures = deploymentLogs.filter((log: any) => log.build_status === 'failed');
      const validationErrorsCount = validationErrors.filter((e: any) => e.severity === 'error').length;

      const totalExecutions = workflowLogs.length;
      const totalErrors = workflowErrors.length;
      const totalWarnings = workflowWarnings.length;
      const successRate = totalExecutions > 0
        ? ((totalExecutions - totalErrors) / totalExecutions) * 100
        : 100;

      // Determine health status
      let healthStatus: 'healthy' | 'degraded' | 'critical';
      if (successRate >= 95) healthStatus = 'healthy';
      else if (successRate >= 80) healthStatus = 'degraded';
      else healthStatus = 'critical';

      // Node breakdown
      const nodeStats = new Map<string, any>();

      workflowLogs.forEach((log: any) => {
        const nodeName = log.node_name;
        if (!nodeStats.has(nodeName)) {
          nodeStats.set(nodeName, {
            node_name: nodeName,
            executions: 0,
            errors: 0,
            warnings: 0,
            total_duration_ms: 0,
          });
        }

        const stats = nodeStats.get(nodeName);
        stats.executions += 1;
        if (log.status === 'error') stats.errors += 1;
        if (log.status === 'warning') stats.warnings += 1;
        stats.total_duration_ms += log.duration_ms || 0;
      });

      const nodeBreakdown = Array.from(nodeStats.values()).map(stats => ({
        ...stats,
        success_rate: stats.executions > 0
          ? parseFloat((((stats.executions - stats.errors) / stats.executions) * 100).toFixed(2))
          : 100,
        avg_duration_ms: stats.executions > 0
          ? Math.round(stats.total_duration_ms / stats.executions)
          : 0,
      }));

      // Most common errors
      const errorMessages = workflowErrors.map((log: any) => log.error_message || log.error_type || 'Unknown error');
      const errorCounts = errorMessages.reduce((acc: any, msg: string) => {
        acc[msg] = (acc[msg] || 0) + 1;
        return acc;
      }, {});

      const mostCommonErrors = Object.entries(errorCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([error, count]) => ({ error, count }));

      // Recent errors (last 10)
      const recentErrors = [...workflowErrors, ...editorErrors.filter((l: any) => l.status === 'error')]
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map((log: any) => ({
          id: log.id,
          node_name: log.node_name || 'editor',
          error_type: log.error_type || log.operation_type || 'Unknown',
          error_message: log.error_message || 'No message',
          timestamp: log.timestamp,
          project_id: log.project_id,
        }));

      // Error trends (hourly breakdown)
      const trends: { [key: string]: number } = {};
      const hourlyBuckets = timeframe === '1h' ? 12 : timeframe === '24h' ? 24 : 7; // 5min intervals for 1h, hourly for 24h, daily for 7d+

      workflowErrors.forEach((log: any) => {
        const date = new Date(log.timestamp);
        const bucket = timeframe === '1h'
          ? `${date.getHours()}:${Math.floor(date.getMinutes() / 5) * 5}`
          : timeframe === '24h'
          ? `${date.getHours()}:00`
          : date.toISOString().split('T')[0];

        trends[bucket] = (trends[bucket] || 0) + 1;
      });

      return NextResponse.json({
        summary: {
          total_executions: totalExecutions,
          total_errors: totalErrors,
          total_warnings: totalWarnings,
          success_rate: parseFloat(successRate.toFixed(2)),
          health_status: healthStatus,
        },
        node_breakdown: nodeBreakdown.sort((a, b) => b.errors - a.errors),
        recent_errors: recentErrors,
        most_common_errors: mostCommonErrors,
        error_trends: trends,
        category_stats: {
          app_generation: {
            total: workflowLogs.length,
            errors: workflowErrors.length,
            warnings: workflowWarnings.length,
          },
          validation: {
            total: validationErrors.length,
            errors: validationErrorsCount,
            warnings: validationErrors.filter((e: any) => e.severity === 'warning').length,
          },
          editor: {
            total: editorLogs.length,
            errors: editorErrors.length,
            warnings: editorLogs.filter((l: any) => l.status === 'warning').length,
          },
          deployment: {
            total: deploymentLogs.length,
            errors: deploymentFailures.length,
            warnings: 0,
          },
        },
      });

    } catch (error: any) {
      console.error('[Admin Workflow Health API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workflow health data', details: error.message },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/admin/workflow-health
 *
 * For complex queries and filtering
 */
export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req, user) => {
    try {
      const { action, filters } = await req.json();

      if (action === 'detailed_logs') {
        const { category, timeframe, page = 1, limit = 10 } = filters;

        const timeframeFilter = getTimeframeFilter(timeframe || '24h');
        const skip = (page - 1) * limit;

        // Get admin-authenticated PocketBase client
        const pb = await getAdminPb();

        let logs: any[] = [];
        let total = 0;

        try {
          if (category === 'app_generation' || category === 'all') {
            const workflowLogs = await pb.collection('workflow_execution_logs').getList(page, limit, {
              filter: timeframeFilter,
              sort: '-timestamp',
            });
            logs = workflowLogs.items;
            total = workflowLogs.totalItems;
          } else if (category === 'editor') {
            const editorLogs = await pb.collection('editor_operation_logs').getList(page, limit, {
              filter: timeframeFilter,
              sort: '-timestamp',
            });
            logs = editorLogs.items;
            total = editorLogs.totalItems;
          } else if (category === 'deployment') {
            const deployLogs = await pb.collection('deployment_logs').getList(page, limit, {
              filter: timeframeFilter,
              sort: '-timestamp',
            });
            logs = deployLogs.items;
            total = deployLogs.totalItems;
          }
        } catch (error: any) {
          if (error.status === 404) {
            console.warn(`[Workflow Health] Collection not found for category: ${category} - returning empty data`);
            logs = [];
            total = 0;
          } else {
            throw error;
          }
        }

        return NextResponse.json({
          logs,
          pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
          },
        });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
      console.error('[Admin Workflow Health API POST] Error:', error);
      return NextResponse.json(
        { error: 'Failed to process request', details: error.message },
        { status: 500 }
      );
    }
  });
}
