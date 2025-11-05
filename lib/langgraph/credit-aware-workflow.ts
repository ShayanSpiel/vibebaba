// lib/langgraph/credit-aware-workflow.ts
// PHASE 3: Credit-Aware Workflow Management
import { getTokenEstimator } from '@/lib/credits/token-estimator';
import {
  reserveCredits,
  consumeFromReservation,
  completeReservation,
  releaseReservation,
  getReservation,
} from '@/lib/credits/reservation-manager';

export interface WorkflowConfig {
  userId: string;
  nodes: Array<{ name: string; context: any }>;
}

export interface WorkflowCreditCheck {
  canProceed: boolean;
  estimatedCost: number;
  breakdown: Record<string, number>;
  reservationId?: string;
  insufficientCredits?: boolean;
  error?: string;
}

/**
 * Initialize workflow with pre-flight credit check
 * PHASE 3: Ensures user has enough credits before starting execution
 */
export async function initializeWorkflowWithCreditCheck(
  workflowConfig: WorkflowConfig
): Promise<WorkflowCreditCheck> {
  try {
    // 1. Estimate total cost accurately using tiktoken
    const estimator = getTokenEstimator();
    const { total, breakdown } = estimator.estimateWorkflowCost({
      nodes: workflowConfig.nodes,
    });

    console.log(
      `[Workflow] Estimated cost: ${total} tokens for ${workflowConfig.nodes.length} nodes`
    );
    console.log(`[Workflow] Breakdown:`, breakdown);

    // 2. Reserve credits upfront
    const reservation = await reserveCredits(workflowConfig.userId, total);

    if (!reservation.success) {
      return {
        canProceed: false,
        estimatedCost: total,
        breakdown,
        insufficientCredits: reservation.insufficientCredits,
        error: reservation.insufficientCredits
          ? 'Insufficient credits'
          : 'Failed to reserve credits',
      };
    }

    // 3. Return success with reservation ID
    return {
      canProceed: true,
      estimatedCost: total,
      breakdown,
      reservationId: reservation.reservationId,
    };
  } catch (error) {
    console.error('[Workflow] Error in credit check:', error);
    return {
      canProceed: false,
      estimatedCost: 0,
      breakdown: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track token usage during workflow execution
 * PHASE 3: Consume credits from reservation as nodes execute
 */
export async function trackNodeExecution(
  reservationId: string,
  nodeName: string,
  actualTokens: number
): Promise<boolean> {
  console.log(`[Workflow] Node ${nodeName} used ${actualTokens} tokens`);

  const success = await consumeFromReservation(reservationId, actualTokens);

  if (!success) {
    console.error(
      `[Workflow] Failed to consume tokens for node ${nodeName} - exceeding budget or reservation expired`
    );
  }

  return success;
}

/**
 * Finalize workflow and release unused credits
 * PHASE 3: Called when workflow completes successfully
 */
export async function finalizeWorkflow(reservationId: string): Promise<void> {
  const reservation = getReservation(reservationId);

  if (reservation) {
    const unusedTokens = reservation.tokensReserved - reservation.tokensUsed;
    console.log(
      `[Workflow] Finalizing: used ${reservation.tokensUsed}/${reservation.tokensReserved} tokens (${unusedTokens} unused, returned to pool)`
    );
  }

  await completeReservation(reservationId);
}

/**
 * Cancel workflow and release all reserved credits
 * PHASE 3: Called when workflow is aborted or fails
 */
export async function cancelWorkflow(reservationId: string): Promise<void> {
  const reservation = getReservation(reservationId);

  if (reservation) {
    console.log(
      `[Workflow] Cancelling: used ${reservation.tokensUsed}/${reservation.tokensReserved} tokens`
    );
  }

  await releaseReservation(reservationId);
}

/**
 * Get current reservation status
 */
export function getWorkflowCreditStatus(reservationId: string): {
  tokensUsed: number;
  tokensReserved: number;
  tokensRemaining: number;
  percentUsed: number;
} | null {
  const reservation = getReservation(reservationId);

  if (!reservation) {
    return null;
  }

  const tokensRemaining = reservation.tokensReserved - reservation.tokensUsed;
  const percentUsed =
    (reservation.tokensUsed / reservation.tokensReserved) * 100;

  return {
    tokensUsed: reservation.tokensUsed,
    tokensReserved: reservation.tokensReserved,
    tokensRemaining,
    percentUsed,
  };
}
