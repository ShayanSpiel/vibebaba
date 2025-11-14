// @ts-nocheck
import { pb, User, Transaction, TokenUsage } from './pocketbase';
import { getAdminPb } from './pocketbase-admin';
import { nanoid } from 'nanoid';
import { getPackage, getCustomCreditPrice } from '../config/pricing-config';

// DEPRECATED: Use getPackage() from config/pricing-config instead
// Kept for backward compatibility only
export const PRICING_PACKAGES = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyTokens: 500000,
    dailyTokens: 5000,
    price: 5,
    priceToman: 350000,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyTokens: 2000000,
    dailyTokens: 20000,
    price: 15,
    priceToman: 1050000,
  },
  unlimited: {
    id: "unlimited",
    name: "Unlimited",
    monthlyTokens: 10000000,
    dailyTokens: 50000,
    price: 40,
    priceToman: 2800000,
  },
};

// DEPRECATED: Use getCustomCreditPrice() from config/pricing-config instead
export const CUSTOM_CREDIT_PRICING = {
  pricePerHundredK: 1,
  priceTomanPerHundredK: 70000,
};

/**
 * Get user's available tokens
 */
export function getAvailableTokens(user: User): number {
  return Math.max(0, user.totalTokens + user.dailyTokens - user.usedTokens);
}

/**
 * PHASE 1 OPTIMIZATION: Lazy reset with background job
 *
 * Check and reset daily tokens if needed (OPTIMIZED)
 * OLD: This function did a DB WRITE on EVERY credit check (slow!)
 * NEW: Just flags user for reset, actual reset happens in background cron job
 */
export async function checkAndResetDailyTokens(userId: string): Promise<User> {
  const user = await pb.collection('users').getOne<User>(userId);
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check if user needs daily reset (READ-ONLY check)
  if (!user.lastDailyReset || new Date(user.lastDailyReset) < oneDayAgo) {
    // Instead of resetting immediately (expensive DB write),
    // just flag user for background reset (handled by cron job)

    // Only set flag if not already set (avoid unnecessary writes)
    if (!user.needsDailyReset) {
      try {
        await pb.collection('users').update<User>(userId, {
          needsDailyReset: true
        });
      } catch (error) {
        console.warn(`Failed to set needsDailyReset flag for user ${userId}:`, error);
        // Non-critical error, continue with stale data
      }
    }

    // Return user with current (potentially stale) daily tokens
    // The cron job will update it within the hour
    console.log(`[Credits] User ${userId} flagged for daily reset (cron will process)`);
  }

  return user;
}

/**
 * Consume tokens from user account
 */
export async function consumeTokens(
  userId: string,
  tokens: number,
  endpoint?: string,
  projectId?: string
): Promise<boolean> {
  try {
    // Get fresh user data
    const user = await checkAndResetDailyTokens(userId);
    const available = getAvailableTokens(user);

    if (available < tokens) {
      console.error(`Insufficient tokens: need ${tokens}, have ${available}`);
      return false;
    }

    // Update used tokens
    await pb.collection('users').update(userId, {
      usedTokens: user.usedTokens + tokens
    });

    // Log usage
    await pb.collection('token_usage').create({
      userId,
      tokensUsed: tokens,
      endpoint: endpoint || 'unknown',
      projectId: projectId || undefined
    });

    console.log(`✅ Consumed ${tokens} tokens for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to consume tokens:', error);
    return false;
  }
}

/**
 * Add tokens to user account
 */
export async function addTokens(
  userId: string,
  tokens: number,
  transactionId?: string,
  packageId?: string
): Promise<void> {
  const adminPb = await getAdminPb();
  const user = await adminPb.collection('users').getOne<User>(userId);

  await adminPb.collection('users').update(userId, {
    totalTokens: user.totalTokens + tokens
  });

  console.log(`✅ Added ${tokens} tokens to user ${userId}`);
}

/**
 * Activate package subscription
 * PHASE 2: Now uses centralized pricing config
 */
export async function activatePackage(userId: string, packageId: string): Promise<void> {
  // Use centralized config
  const pkg = getPackage(packageId);
  if (!pkg) {
    throw new Error(`Invalid package: ${packageId}`);
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const adminPb = await getAdminPb();
  const user = await adminPb.collection('users').getOne<User>(userId);

  await adminPb.collection('users').update(userId, {
    totalTokens: user.totalTokens + pkg.monthlyTokens,
    packageId: packageId,
    packageExpiry: expiry.toISOString(),
    dailyTokens: pkg.dailyTokens,
    lastDailyReset: now.toISOString(),
    needsDailyReset: false
  });

  console.log(`✅ Activated ${packageId} package for user ${userId}`);
}

/**
 * Create transaction record
 */
export async function createTransaction(
  userId: string,
  type: 'purchase' | 'subscription' | 'refund',
  amount: number,
  tokens: number,
  currency: string = "USD",
  packageId?: string,
  paymentProvider?: 'stripe' | 'paypal' | 'zibal' | 'zarinpal',
  paymentId?: string,
  verifyToken?: string  // 🔒 NEW: Token for secure payment callback verification
): Promise<string> {
  // Use admin client for server-side operations (bypasses permission checks)
  const adminPb = await getAdminPb();

  const transaction = await adminPb.collection('transactions').create<Transaction>({
    userId,
    type,
    amount,
    tokens,
    currency,
    packageId: packageId || undefined,
    paymentProvider: paymentProvider || undefined,
    paymentId: paymentId || undefined,
    verifyToken: verifyToken || undefined,  // 🔒 Store verify token
    status: 'pending'
  });

  console.log(`✅ Created transaction ${transaction.id} for user ${userId}`);
  return transaction.id;
}

/**
 * Get transaction by ID
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const adminPb = await getAdminPb();
    return await adminPb.collection('transactions').getOne<Transaction>(transactionId);
  } catch (error) {
    console.error('Transaction not found:', transactionId);
    return null;
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
): Promise<void> {
  const adminPb = await getAdminPb();
  await adminPb.collection('transactions').update(transactionId, { status });
  console.log(`✅ Updated transaction ${transactionId} status to ${status}`);
}

/**
 * Get user transactions
 */
export async function getUserTransactions(userId: string, limit: number = 10): Promise<Transaction[]> {
  return await pb.collection('transactions').getFullList<Transaction>({
    filter: `userId = "${userId}"`,
    sort: '-created',
    limit
  });
}

/**
 * Get user token usage history
 */
export async function getUserTokenUsage(userId: string, limit: number = 50): Promise<TokenUsage[]> {
  return await pb.collection('token_usage').getFullList<TokenUsage>({
    filter: `userId = "${userId}"`,
    sort: '-created',
    limit
  });
}
