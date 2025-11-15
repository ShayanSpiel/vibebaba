/**
 * PHASE 1: Batch Credit Operations
 *
 * Optimized utilities for batch credit calculations
 * Used primarily by admin dashboard for better performance
 */

import type PocketBase from 'pocketbase';
import { creditsCache } from '../credits-cache';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

export interface UserCreditSummary {
  id: string;
  userId: string;
  email: string;
  name: string;
  totalTokens: number;
  usedTokens: number;
  dailyTokens: number;
  availableTokens: number;
  packageId: string | null;
  packageExpiry: number | null;
}

/**
 * Calculate credits for multiple users at once
 * MUCH faster than individual queries (1 query vs N queries)
 */
export async function calculateCreditsForUsers(
  userIds: string[],
  pb: PocketBase
): Promise<Map<string, UserCreditSummary>> {
  const result = new Map<string, UserCreditSummary>();

  if (userIds.length === 0) {
    return result;
  }

  // Check cache first (batch get)
  const cacheKeys = userIds.map((id) => `credits:${id}`);
  const cached = creditsCache.getMany<UserCreditSummary>(cacheKeys);

  // Find which users we still need to fetch
  const uncachedIds = userIds.filter((id) => !cached.has(`credits:${id}`));

  if (uncachedIds.length > 0) {
    // Fetch uncached users in a single query
    const filter = uncachedIds.map((id) => `id="${id}"`).join(' || ');

    const users = await pb.collection('users').getFullList({
      filter,
      fields: 'id,email,name,username,totalTokens,usedTokens,dailyTokens,packageId,packageExpiry',
    });

    // Process and cache the results
    for (const user of users) {
      const summary: UserCreditSummary = {
        id: user.id,
        userId: user.id,
        email: user.email,
        name: user.name || user.username || '',
        totalTokens: user.totalTokens || 0,
        usedTokens: user.usedTokens || 0,
        dailyTokens: user.dailyTokens || 0,
        packageId: user.packageId || null,
        packageExpiry: user.packageExpiry ? new Date(user.packageExpiry).getTime() : null,
        availableTokens: (user.totalTokens || 0) + (user.dailyTokens || 0) - (user.usedTokens || 0),
      };

      result.set(user.id, summary);

      // Cache for future requests
      creditsCache.set(`credits:${user.id}`, summary);
    }
  }

  // Add cached results
  for (const [key, value] of cached.entries()) {
    const userId = key.replace('credits:', '');
    result.set(userId, value);
  }

  return result;
}

/**
 * Load users with pagination and caching
 */
export async function loadUserCreditsPage(
  page: number,
  limit: number,
  pb: PocketBase,
  searchTerm?: string
): Promise<{
  users: UserCreditSummary[];
  page: number;
  totalPages: number;
  total: number;
}> {
  // Build filter
  let filter = '';
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim();
    filter = `email ~ "${term}" || name ~ "${term}" || username ~ "${term}"`;
  }

  // Get paginated results
  const result = await pb.collection('users').getList(page, limit, {
    filter,
    sort: '-created',
    fields: 'id,email,name,username,totalTokens,usedTokens,dailyTokens,packageId,packageExpiry',
  });

  // Calculate available tokens for each user
  const users: UserCreditSummary[] = result.items.map((user: any) => ({
    id: user.id,
    userId: user.id,
    email: user.email,
    name: user.name || user.username || '',
    totalTokens: user.totalTokens || 0,
    usedTokens: user.usedTokens || 0,
    dailyTokens: user.dailyTokens || 0,
    packageId: user.packageId || null,
    packageExpiry: user.packageExpiry ? new Date(user.packageExpiry).getTime() : null,
    availableTokens: (user.totalTokens || 0) + (user.dailyTokens || 0) - (user.usedTokens || 0),
  }));

  // Cache the results
  const cacheEntries = new Map<string, UserCreditSummary>();
  users.forEach((user) => {
    cacheEntries.set(`credits:${user.id}`, user);
  });
  creditsCache.setMany(cacheEntries);

  return {
    users,
    page: result.page,
    totalPages: result.totalPages,
    total: result.totalItems,
  };
}

/**
 * Warm cache for active users
 * Call this during server startup or low-traffic periods
 */
export async function warmCacheForActiveUsers(pb: PocketBase, limit: number = 100): Promise<void> {
  console.log('[Cache] Warming cache for active users...');

  // Get recently active users (those who checked credits in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const activeUsers = await pb.collection('users').getFullList({
    filter: `updated >= "${sevenDaysAgo.toISOString()}"`,
    sort: '-updated',
    fields: 'id,email,name,username,totalTokens,usedTokens,dailyTokens,packageId,packageExpiry',
    limit,
  });

  console.log(`[Cache] Found ${activeUsers.length} active users`);

  // Load into cache
  const cacheEntries = new Map<string, UserCreditSummary>();
  activeUsers.forEach((user: any) => {
    const summary: UserCreditSummary = {
      id: user.id,
      userId: user.id,
      email: user.email,
      name: user.name || user.username || '',
      totalTokens: user.totalTokens || 0,
      usedTokens: user.usedTokens || 0,
      dailyTokens: user.dailyTokens || 0,
      packageId: user.packageId || null,
      packageExpiry: user.packageExpiry ? new Date(user.packageExpiry).getTime() : null,
      availableTokens: (user.totalTokens || 0) + (user.dailyTokens || 0) - (user.usedTokens || 0),
    };

    cacheEntries.set(`credits:${user.id}`, summary);
  });

  creditsCache.setMany(cacheEntries);

  console.log(`[Cache] Warmed cache with ${activeUsers.length} users`);
}
