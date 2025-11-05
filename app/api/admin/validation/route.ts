/**
 * ADMIN VALIDATION API ROUTE
 *
 * Fetch validation errors and sessions for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import {
  getValidationErrors,
  getValidationSessions,
  getProjectValidationStats,
  getAllValidationErrors,
  getAllValidationSessions,
} from '@/lib/services/validation-error-logger';

export async function GET(req: NextRequest) {
  return requireAdmin(req, async (req, user) => {
    try {

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'errors'; // 'errors' | 'sessions' | 'stats'
    const projectId = searchParams.get('projectId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const severity = searchParams.get('severity') as 'error' | 'warning' | undefined;
    const errorType = searchParams.get('errorType') || undefined;
    const wasSuccessful = searchParams.get('wasSuccessful');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    if (type === 'stats' && projectId) {
      // Get project stats
      const stats = await getProjectValidationStats(projectId);
      return NextResponse.json(stats);
    }

      if (type === 'sessions') {
        // Get validation sessions (admins see all, not filtered by userId)
        const sessions = await getValidationSessions({
          page,
          perPage,
          projectId,
          wasSuccessful: wasSuccessful ? wasSuccessful === 'true' : undefined,
          startDate,
          endDate,
        });

        return NextResponse.json(sessions);
      }

      // Get validation errors (default) (admins see all, not filtered by userId)
      const errors = await getValidationErrors({
        page,
        perPage,
        projectId,
        severity,
        errorType,
        startDate,
        endDate,
      });

      return NextResponse.json(errors);
    } catch (error: any) {
      console.error('[Admin Validation API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch validation data', details: error.message },
        { status: 500 }
      );
    }
  });
}

/**
 * Get aggregated statistics
 */
export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req, user) => {
    try {
      const { action } = await req.json();

    if (action === 'aggregate_stats') {
      // Get aggregated statistics across all projects
      const allErrors = getAllValidationErrors();
      const allSessions = getAllValidationSessions();

      // Admin sees all errors, not filtered by userId
      const errors = allErrors;
      const sessions = allSessions;

      const stats = {
        totalErrors: errors.filter(e => e.severity === 'error').length,
        totalWarnings: errors.filter(e => e.severity === 'warning').length,
        totalSessions: sessions.length,
        successfulSessions: sessions.filter(s => s.wasSuccessful).length,
        failedSessions: sessions.filter(s => !s.wasSuccessful).length,
        successRate:
          sessions.length > 0
            ? ((sessions.filter(s => s.wasSuccessful).length / sessions.length) * 100).toFixed(1)
            : 0,
        errorsByType: groupBy(errors, 'errorType'),
        errorsBySeverity: groupBy(errors, 'severity'),
        mostCommonErrors: getMostCommonErrors(errors, 10),
        errorTrend: getErrorTrend(errors),
        recentErrors: errors
          .sort((a, b) => new Date(b.created || '').getTime() - new Date(a.created || '').getTime())
          .slice(0, 20),
        recentSessions: sessions
          .sort((a, b) => new Date(b.created || '').getTime() - new Date(a.created || '').getTime())
          .slice(0, 20),
      };

      return NextResponse.json(stats);
    }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
      console.error('[Admin Validation API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to process request', details: error.message },
        { status: 500 }
      );
    }
  });
}

/**
 * Helper: Group by property
 */
function groupBy<T>(array: T[], key: keyof T): Record<string, number> {
  const result: Record<string, number> = {};
  array.forEach(item => {
    const groupKey = String(item[key]);
    result[groupKey] = (result[groupKey] || 0) + 1;
  });
  return result;
}

/**
 * Helper: Get most common errors
 */
function getMostCommonErrors(errors: any[], limit: number): Array<{ rule: string; count: number; severity: string }> {
  const counts: Record<string, { count: number; severity: string }> = {};

  errors.forEach(e => {
    if (!counts[e.rule]) {
      counts[e.rule] = { count: 0, severity: e.severity };
    }
    counts[e.rule].count++;
  });

  return Object.entries(counts)
    .map(([rule, data]) => ({ rule, count: data.count, severity: data.severity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Helper: Get error trend (last 7 days)
 */
function getErrorTrend(errors: any[]): Array<{ date: string; count: number }> {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const errorsByDate: Record<string, number> = {};
  errors.forEach(e => {
    if (e.created) {
      // Handle ISO date format (YYYY-MM-DDTHH:mm:ss.sssZ)
      const date = e.created.split('T')[0];
      errorsByDate[date] = (errorsByDate[date] || 0) + 1;
    }
  });

  return last7Days.map(date => ({
    date,
    count: errorsByDate[date] || 0,
  }));
}
