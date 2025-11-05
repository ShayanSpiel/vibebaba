/**
 * Gap Detection API
 * Admin endpoint for detecting example coverage gaps
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  detectAllGaps,
  createGenerationTasksFromGaps,
  getCoverageMatrix,
  formatGapReport,
} from '@/lib/gap-detector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const createTasks = searchParams.get('createTasks') === 'true';

    console.log('Running gap detection...');

    const report = await detectAllGaps();

    if (createTasks && report.totalGaps > 0) {
      console.log('Creating generation tasks...');
      const tasks = await createGenerationTasksFromGaps(report.gapsByCategory);
      console.log(`Created ${tasks.length} tasks`);

      return NextResponse.json({
        report,
        tasksCreated: tasks.length,
        tasks: tasks.map(t => ({
          id: t.id,
          categoryId: t.categoryId,
          priority: t.priority,
          reason: t.reason,
          targetCount: t.targetCount,
        })),
      });
    }

    if (format === 'text') {
      const formatted = formatGapReport(report);
      return new NextResponse(formatted, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Gap detection error:', error);
    return NextResponse.json(
      {
        error: 'Failed to detect gaps',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'coverage-matrix') {
      const matrix = await getCoverageMatrix();
      return NextResponse.json(matrix);
    }

    if (action === 'create-tasks') {
      const report = await detectAllGaps();

      if (report.totalGaps === 0) {
        return NextResponse.json({
          message: 'No gaps detected',
          tasksCreated: 0,
        });
      }

      const tasks = await createGenerationTasksFromGaps(report.gapsByCategory);

      return NextResponse.json({
        message: `Created ${tasks.length} generation tasks`,
        tasksCreated: tasks.length,
        tasks: tasks.map(t => ({
          id: t.id,
          categoryId: t.categoryId,
          priority: t.priority,
          reason: t.reason,
        })),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Gap detection error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
