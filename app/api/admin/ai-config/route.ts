/**
 * AI Configuration API
 * Manages AI mode, providers, and cache
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  type AIMode,
  clearCachedWorkingModel,
  getAIMode,
  getConfigSummary,
  setAIMode,
} from '@/lib/ai/ai-config-store';

// GET /api/admin/ai-config - Get current configuration
export async function GET() {
  try {
    const summary = getConfigSummary();

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('[API] Error getting AI config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/ai-config - Update configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode } = body;

    if (!mode || (mode !== 'serverless' && mode !== 'server')) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Must be "serverless" or "server"' },
        { status: 400 }
      );
    }

    setAIMode(mode as AIMode);

    return NextResponse.json({
      success: true,
      message: `AI mode switched to ${mode}`,
      data: getConfigSummary(),
    });
  } catch (error: any) {
    console.error('[API] Error updating AI config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/ai-config/cache - Clear cache
export async function DELETE() {
  try {
    clearCachedWorkingModel();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error: any) {
    console.error('[API] Error clearing cache:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
