// app/api/credits/estimate/route.ts
// PHASE 3: API endpoint for estimating workflow credit cost
import { type NextRequest, NextResponse } from 'next/server';
import { getTokenEstimator } from '@/lib/credits/token-estimator';
import { getAuthenticatedUser } from '@/lib/database/pocketbase-middleware';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow } = await req.json();

    if (!workflow || !workflow.nodes) {
      return NextResponse.json({ error: 'Invalid workflow configuration' }, { status: 400 });
    }

    // Estimate cost using tiktoken
    const estimator = getTokenEstimator();
    const { total, breakdown } = estimator.estimateWorkflowCost(workflow);

    return NextResponse.json({
      total,
      breakdown,
      bufferPercentage: 20, // We add 20% safety buffer
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error estimating credits:', error);
    return NextResponse.json(
      {
        error: 'Failed to estimate credits',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
