/**
 * AI Action Execution API
 *
 * Provides a new endpoint for executing actions with:
 * - Sequential execution via ActionRunner
 * - Error loop prevention
 * - Circuit breaker pattern
 * - Rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/pocketbase-middleware';
import { getActionRunner } from '@/lib/action-runner';
import { globalRateLimiter, globalExecutionGuard } from '@/lib/error-prevention';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!globalRateLimiter.isAllowed()) {
      const timeUntilNext = globalRateLimiter.getTimeUntilNextRequest();
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(timeUntilNext / 1000),
        },
        { status: 429 }
      );
    }

    // Parse request
    const body = await req.json();
    const { projectId, actions } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: 'Actions array required' },
        { status: 400 }
      );
    }

    // Get action runner and set project ID
    const actionRunner = getActionRunner();
    actionRunner.setProjectId(projectId);

    // Execution guard to prevent duplicate runs
    const executionKey = `execute-${projectId}-${Date.now()}`;
    const results = await globalExecutionGuard.execute(executionKey, async () => {
      const actionResults = [];

      for (const actionData of actions) {
        // Validate action
        if (!actionData.id || !actionData.type) {
          actionResults.push({
            error: 'Invalid action: id and type required',
            action: actionData,
          });
          continue;
        }

        // Add action to runner
        const added = actionRunner.addAction(actionData);

        if (!added) {
          actionResults.push({
            actionId: actionData.id,
            status: 'skipped',
            reason: 'Action already exists',
          });
          continue;
        }

        // Execute action
        try {
          const result = await actionRunner.runAction(actionData.id);
          actionResults.push(result);
        } catch (error: any) {
          actionResults.push({
            actionId: actionData.id,
            status: 'failed',
            error: error.message,
          });
        }
      }

      return actionResults;
    });

    // If execution guard prevented duplicate run
    if (results === null) {
      return NextResponse.json(
        { error: 'Execution already in progress for this project' },
        { status: 409 }
      );
    }

    // Get statistics
    const stats = actionRunner.getStats();

    return NextResponse.json({
      success: true,
      results,
      stats,
    });
  } catch (error: any) {
    console.error('[Execute API] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check action status
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const actionId = searchParams.get('actionId');
    const status = searchParams.get('status');

    const actionRunner = getActionRunner();

    if (actionId) {
      // Get specific action
      const action = actionRunner.getAction(actionId);

      if (!action) {
        return NextResponse.json(
          { error: 'Action not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ action });
    } else if (status) {
      // Get actions by status
      const actions = actionRunner.getActionsByStatus(status as any);
      return NextResponse.json({ actions });
    } else {
      // Get all actions and stats
      const actions = actionRunner.getAllActions();
      const stats = actionRunner.getStats();

      return NextResponse.json({
        actions,
        stats,
      });
    }
  } catch (error: any) {
    console.error('[Execute API GET] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to abort or clear actions
 */
export async function DELETE(req: NextRequest) {
  try {
    // Authentication
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const actionId = searchParams.get('actionId');
    const clearCompleted = searchParams.get('clearCompleted') === 'true';
    const clearAll = searchParams.get('clearAll') === 'true';

    const actionRunner = getActionRunner();

    if (actionId) {
      // Abort specific action
      const aborted = actionRunner.abortAction(actionId);

      if (!aborted) {
        return NextResponse.json(
          { error: 'Action not found or already completed' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Action ${actionId} aborted`,
      });
    } else if (clearCompleted) {
      // Clear completed actions
      actionRunner.clearCompleted();

      return NextResponse.json({
        success: true,
        message: 'Completed actions cleared',
      });
    } else if (clearAll) {
      // Clear all actions
      actionRunner.clearAll();

      return NextResponse.json({
        success: true,
        message: 'All actions cleared',
      });
    } else {
      return NextResponse.json(
        { error: 'actionId, clearCompleted, or clearAll parameter required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[Execute API DELETE] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
