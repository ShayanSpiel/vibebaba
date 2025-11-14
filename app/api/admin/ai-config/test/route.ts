/**
 * AI Model Testing API
 * Tests individual models and providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/ai/ai';

// POST /api/admin/ai-config/test - Test AI generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt = 'Hello! Please respond with a short greeting.' } = body;

    const startTime = Date.now();
    const result = await generateWithFallback(prompt, true);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        text: result.text,
        provider: result.provider,
        model: result.model,
        tokenCount: result.tokenCount,
        duration,
        attemptsLog: result.attemptsLog,
      },
    });
  } catch (error: any) {
    console.error('[API] Error testing AI:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
