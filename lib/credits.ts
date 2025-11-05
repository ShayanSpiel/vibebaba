import { pb } from "./pocketbase";
import { creditsCache } from "./credits-cache";

// Pricing packages
export const PRICING_PACKAGES = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyTokens: 500000, // 500K tokens
    dailyTokens: 5000, // 5K daily bonus
    price: 5, // $5/month
    priceToman: 350000, // ~350K Toman
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyTokens: 2000000, // 2M tokens
    dailyTokens: 20000, // 20K daily bonus
    price: 15, // $15/month
    priceToman: 1050000, // ~1M Toman
  },
  unlimited: {
    id: "unlimited",
    name: "Unlimited",
    monthlyTokens: 10000000, // 10M tokens
    dailyTokens: 50000, // 50K daily bonus
    price: 40, // $40/month
    priceToman: 2800000, // ~2.8M Toman
  },
};

// Custom credit pricing (per 100K tokens)
export const CUSTOM_CREDIT_PRICING = {
  pricePerHundredK: 1, // $1 per 100K tokens
  priceTomanPerHundredK: 70000, // 70K Toman per 100K tokens
};

// Token pricing for calculations
export const TOKEN_PRICING = {
  inputCostPerMillion: 5.4, // $5.40 per 1M input tokens (with 80% margin)
  outputCostPerMillion: 27, // $27 per 1M output tokens (with 80% margin)
  averageCostPerMillion: 10, // Simplified average for user display
};

export interface UserCredits {
  id: string;
  userId: string;
  totalTokens: number;
  usedTokens: number;
  dailyTokens: number;
  lastDailyReset: string | null;
  packageId: string | null;
  packageExpiry: string | null;
  created: string;
  updated: string;
}

/**
 * Get user from PocketBase (this includes credit fields)
 */
async function getUser(userId: string) {
  try {
    const user = await pb.collection('users').getOne(userId);
    return user;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

/**
 * Get or create user credits (with caching for performance)
 * Note: Credits are stored directly in the user record in PocketBase
 */
export async function getUserCredits(userId: string): Promise<UserCredits> {
  // Try cache first (5 second TTL for ultra-fast reads)
  const cacheKey = `credits:${userId}`;
  const cached = creditsCache.get<UserCredits>(cacheKey);
  if (cached) {
    return cached;
  }

  const user = await getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const credits: UserCredits = {
    id: user.id,
    userId: user.id,
    totalTokens: user.totalTokens || 0,
    usedTokens: user.usedTokens || 0,
    dailyTokens: user.dailyTokens || 0,
    lastDailyReset: user.lastDailyReset || null,
    packageId: user.packageId || null,
    packageExpiry: user.packageExpiry || null,
    created: user.created,
    updated: user.updated,
  };

  // Cache for 5 seconds
  creditsCache.set(cacheKey, credits, 5000);
  return credits;
}

/**
 * Check and reset daily tokens if needed
 */
export async function checkAndResetDailyTokens(userId: string): Promise<UserCredits> {
  const credits = await getUserCredits(userId);
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Reset daily tokens if more than 24 hours passed
  const lastReset = credits.lastDailyReset ? new Date(credits.lastDailyReset) : null;
  if (!lastReset || lastReset < oneDayAgo) {
    let dailyAmount = 0;

    // Check if user has active package
    const packageExpiry = credits.packageExpiry ? new Date(credits.packageExpiry) : null;
    if (credits.packageId && packageExpiry && packageExpiry > now) {
      const pkg = PRICING_PACKAGES[credits.packageId as keyof typeof PRICING_PACKAGES];
      if (pkg) {
        dailyAmount = pkg.dailyTokens;
      }
    }

    try {
      await pb.collection('users').update(userId, {
        dailyTokens: dailyAmount,
        lastDailyReset: now.toISOString(),
      });

      // Invalidate cache
      creditsCache.invalidateUser(userId);

      return getUserCredits(userId);
    } catch (error) {
      console.error('Failed to reset daily tokens:', error);
    }
  }

  return credits;
}

/**
 * Get available tokens (total + daily - used) - OPTIMIZED with cache
 */
export async function getAvailableTokens(userId: string): Promise<number> {
  // Try cache first for ultra-fast reads
  const cacheKey = `available:${userId}`;
  const cached = creditsCache.get<number>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const credits = await checkAndResetDailyTokens(userId);
  const available = Math.max(0, credits.totalTokens + credits.dailyTokens - credits.usedTokens);

  // Cache for 5 seconds
  creditsCache.set(cacheKey, available, 5000);
  return available;
}

/**
 * Consume tokens (invalidates cache for instant UI updates)
 */
export async function consumeTokens(userId: string, tokens: number, endpoint?: string): Promise<boolean> {
  const available = await getAvailableTokens(userId);

  if (available < tokens) {
    return false; // Not enough tokens
  }

  try {
    // Get current user to calculate new usedTokens
    const user = await pb.collection('users').getOne(userId);
    const newUsedTokens = (user.usedTokens || 0) + tokens;

    // Update used tokens
    await pb.collection('users').update(userId, {
      usedTokens: newUsedTokens,
    });

    // Log usage in token_usage collection
    try {
      await pb.collection('token_usage').create({
        userId,
        tokensUsed: tokens,
        endpoint: endpoint || 'unknown',
      });
    } catch (usageError) {
      console.warn('Failed to log token usage:', usageError);
      // Don't fail the whole operation if logging fails
    }

    // Invalidate cache immediately for fresh data
    creditsCache.invalidateUser(userId);

    return true;
  } catch (error) {
    console.error('Failed to consume tokens:', error);
    return false;
  }
}

/**
 * Add tokens to user account (invalidates cache)
 */
export async function addTokens(
  userId: string,
  tokens: number,
  transactionId: string,
  packageId?: string
): Promise<void> {
  try {
    const user = await pb.collection('users').getOne(userId);
    const newTotalTokens = (user.totalTokens || 0) + tokens;

    await pb.collection('users').update(userId, {
      totalTokens: newTotalTokens,
    });

    // Invalidate cache immediately
    creditsCache.invalidateUser(userId);
  } catch (error) {
    console.error('Failed to add tokens:', error);
    throw new Error('Failed to add tokens');
  }
}

/**
 * Activate package subscription (invalidates cache)
 */
export async function activatePackage(userId: string, packageId: string): Promise<void> {
  const pkg = PRICING_PACKAGES[packageId as keyof typeof PRICING_PACKAGES];
  if (!pkg) throw new Error("Invalid package");

  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  try {
    const user = await pb.collection('users').getOne(userId);
    const newTotalTokens = (user.totalTokens || 0) + pkg.monthlyTokens;

    await pb.collection('users').update(userId, {
      totalTokens: newTotalTokens,
      packageId: packageId,
      packageExpiry: expiry.toISOString(),
      dailyTokens: pkg.dailyTokens,
      lastDailyReset: now.toISOString(),
    });

    // Invalidate cache immediately
    creditsCache.invalidateUser(userId);
  } catch (error) {
    console.error('Failed to activate package:', error);
    throw new Error('Failed to activate package');
  }
}

/**
 * Create transaction record
 */
export async function createTransaction(
  userId: string,
  type: string,
  amount: number,
  tokens: number,
  currency: string = "USD",
  packageId?: string,
  paymentProvider?: string,
  paymentId?: string
): Promise<string> {
  try {
    const transaction = await pb.collection('transactions').create({
      userId,
      type,
      amount,
      tokens,
      currency,
      packageId: packageId || null,
      paymentProvider: paymentProvider || null,
      paymentId: paymentId || null,
      status: 'pending',
    });

    return transaction.id;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    throw new Error('Failed to create transaction');
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(transactionId: string, status: string): Promise<void> {
  try {
    await pb.collection('transactions').update(transactionId, { status });
  } catch (error) {
    console.error('Failed to update transaction status:', error);
    throw new Error('Failed to update transaction status');
  }
}

/**
 * Get transaction
 */
export async function getTransaction(transactionId: string) {
  try {
    return await pb.collection('transactions').getOne(transactionId);
  } catch (error) {
    console.error('Failed to get transaction:', error);
    return null;
  }
}

/**
 * Get user transactions
 */
export async function getUserTransactions(userId: string, limit: number = 10) {
  try {
    return await pb.collection('transactions').getList(1, limit, {
      filter: `userId = "${userId}"`,
      sort: '-created',
    });
  } catch (error) {
    console.error('Failed to get user transactions:', error);
    return { items: [], page: 1, perPage: limit, totalItems: 0, totalPages: 0 };
  }
}
