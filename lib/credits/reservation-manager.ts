// lib/credits/reservation-manager.ts
// PHASE 3: Credit Reservation System
import { getAvailableTokens, consumeTokens } from '../database/pocketbase-credits';
import { creditsCache } from '../credits-cache';
import { pb, User } from '../database/pocketbase';

interface CreditReservation {
  id: string;
  userId: string;
  tokensReserved: number;
  tokensUsed: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

// In-memory reservation tracking
// TODO: Move to Redis for multi-instance deployments
const reservations = new Map<string, CreditReservation>();

/**
 * Reserve credits before starting a workflow
 */
export async function reserveCredits(
  userId: string,
  estimatedTokens: number
): Promise<{
  success: boolean;
  reservationId?: string;
  insufficientCredits?: boolean;
}> {
  try {
    // Get user to check credits
    const user = await pb.collection('users').getOne<User>(userId);
    const available = getAvailableTokens(user);

    if (available < estimatedTokens) {
      return { success: false, insufficientCredits: true };
    }

    // Create reservation
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

    reservations.set(reservationId, {
      id: reservationId,
      userId,
      tokensReserved: estimatedTokens,
      tokensUsed: 0,
      status: 'active',
      createdAt: now,
      expiresAt,
    });

    // Invalidate cache to reflect reservation
    creditsCache.invalidate(`credits:${userId}`);

    console.log(
      `[Credits] Reserved ${estimatedTokens} tokens for user ${userId} (reservation: ${reservationId})`
    );

    return { success: true, reservationId };
  } catch (error) {
    console.error('Error reserving credits:', error);
    return { success: false };
  }
}

/**
 * Get available tokens accounting for active reservations
 */
export async function getAvailableTokensWithReservations(
  userId: string
): Promise<number> {
  const user = await pb.collection('users').getOne<User>(userId);
  const totalAvailable = getAvailableTokens(user);

  // Subtract active reservations
  let reserved = 0;
  for (const [_, reservation] of reservations) {
    if (reservation.userId === userId && reservation.status === 'active') {
      reserved += reservation.tokensReserved - reservation.tokensUsed;
    }
  }

  return Math.max(0, totalAvailable - reserved);
}

/**
 * Consume tokens from a reservation
 */
export async function consumeFromReservation(
  reservationId: string,
  tokensUsed: number
): Promise<boolean> {
  const reservation = reservations.get(reservationId);

  if (!reservation || reservation.status !== 'active') {
    console.error(`Reservation ${reservationId} not found or inactive`);
    return false;
  }

  // Check if within reserved budget
  if (reservation.tokensUsed + tokensUsed > reservation.tokensReserved) {
    console.warn(
      `Exceeding reserved tokens for ${reservationId}: used ${reservation.tokensUsed + tokensUsed}, reserved ${reservation.tokensReserved}`
    );
    // Allow slight overage (5%) but log warning
    if (
      reservation.tokensUsed + tokensUsed >
      reservation.tokensReserved * 1.05
    ) {
      console.error(
        `Exceeded 5% tolerance for reservation ${reservationId}, rejecting`
      );
      return false;
    }
  }

  // Update reservation
  reservation.tokensUsed += tokensUsed;

  // Actually consume from user's credits
  const success = await consumeTokens(reservation.userId, tokensUsed);

  if (!success) {
    // Rollback reservation update
    reservation.tokensUsed -= tokensUsed;
    return false;
  }

  console.log(
    `[Credits] Consumed ${tokensUsed} tokens from reservation ${reservationId} (total used: ${reservation.tokensUsed}/${reservation.tokensReserved})`
  );

  return true;
}

/**
 * Complete a reservation and consume the full reserved amount
 * NOTE: Currently uses full reservation amount (conservative approach)
 * Future: Track actual usage per node for more accurate billing
 */
export async function completeReservation(reservationId: string): Promise<void> {
  const reservation = reservations.get(reservationId);

  if (!reservation || reservation.status !== 'active') {
    return;
  }

  // If no tokens were consumed yet (no trackNodeExecution calls), consume the full reservation
  if (reservation.tokensUsed === 0) {
    console.log(
      `[Credits] No tokens tracked during workflow, consuming full reservation: ${reservation.tokensReserved} tokens`
    );
    await consumeTokens(reservation.userId, reservation.tokensReserved);
    reservation.tokensUsed = reservation.tokensReserved;
  }

  reservation.status = 'completed';

  const unusedTokens = reservation.tokensReserved - reservation.tokensUsed;

  console.log(
    `[Credits] Completed reservation ${reservationId}: used ${reservation.tokensUsed}/${reservation.tokensReserved} tokens (${unusedTokens} unused)`
  );

  // Invalidate cache to reflect updated credits
  creditsCache.invalidate(`credits:${reservation.userId}`);

  // Clean up after 1 hour
  setTimeout(() => {
    reservations.delete(reservationId);
  }, 60 * 60 * 1000);
}

/**
 * Release a reservation (cancel workflow)
 */
export async function releaseReservation(reservationId: string): Promise<void> {
  const reservation = reservations.get(reservationId);

  if (!reservation) {
    return;
  }

  console.log(
    `[Credits] Released reservation ${reservationId}: used ${reservation.tokensUsed}/${reservation.tokensReserved} tokens`
  );

  reservation.status = 'expired';
  creditsCache.invalidate(`credits:${reservation.userId}`);
  reservations.delete(reservationId);
}

/**
 * Get reservation info
 */
export function getReservation(
  reservationId: string
): CreditReservation | null {
  return reservations.get(reservationId) || null;
}

/**
 * Clean up expired reservations (run periodically)
 */
export function cleanupExpiredReservations(): void {
  const now = new Date();
  let cleaned = 0;

  for (const [id, reservation] of reservations) {
    if (reservation.expiresAt < now && reservation.status === 'active') {
      reservation.status = 'expired';
      reservations.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Credits] Cleaned up ${cleaned} expired reservations`);
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredReservations, 5 * 60 * 1000);
