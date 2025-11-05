import { NextRequest, NextResponse } from 'next/server';
import { getMemoryConsolidator } from '@/lib/services/memory-consolidator';

/**
 * Memory Consolidation Cron Job
 *
 * Runs periodically to consolidate user observations into preferences
 *
 * Setup with Vercel Cron:
 * vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/consolidate-memory",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      console.error('[Cron] Unauthorized memory consolidation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting memory consolidation...');
    const startTime = Date.now();

    const consolidator = getMemoryConsolidator();
    await consolidator.consolidateAll();

    const duration = Date.now() - startTime;
    console.log(`[Cron] Memory consolidation complete in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Memory consolidation complete',
      duration
    });
  } catch (error: any) {
    console.error('[Cron] Memory consolidation failed:', error);
    return NextResponse.json(
      {
        error: 'Memory consolidation failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET(req: NextRequest) {
  try {
    // Check for test secret
    const testSecret = req.nextUrl.searchParams.get('secret');
    if (testSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron Test] Running memory consolidation...');
    const consolidator = getMemoryConsolidator();
    await consolidator.consolidateAll();

    return NextResponse.json({
      success: true,
      message: 'Test consolidation complete'
    });
  } catch (error: any) {
    console.error('[Cron Test] Failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
