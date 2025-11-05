// app/api/admin/credits/stats/route.ts
// Admin API for credit system statistics and monitoring
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-auth';
import { getAdminPb } from '@/lib/pocketbase-admin';

/**
 * GET /api/admin/credits/stats
 * Get comprehensive credit system statistics
 */
export async function GET(req: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess(req);
    if (!adminCheck.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminPb = await getAdminPb();

    // Get all users with credits
    const users = await adminPb.collection('users').getFullList({
      fields: 'id,email,totalTokens,usedTokens,dailyTokens,packageId,packageExpiry',
    });

    // Calculate statistics
    const totalUsers = users.length;
    const totalTokensPurchased = users.reduce((sum, u) => sum + (u.totalTokens || 0), 0);
    const totalTokensUsed = users.reduce((sum, u) => sum + (u.usedTokens || 0), 0);
    const totalDailyTokens = users.reduce((sum, u) => sum + (u.dailyTokens || 0), 0);
    const totalAvailable = totalTokensPurchased + totalDailyTokens - totalTokensUsed;

    // Active subscriptions
    const now = new Date();
    const activeSubscribers = users.filter(
      (u) => u.packageId && u.packageExpiry && new Date(u.packageExpiry) > now
    ).length;

    // Get token usage for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsage = await adminPb.collection('token_usage').getList(1, 1000, {
      filter: `created >= "${thirtyDaysAgo.toISOString()}"`,
      sort: '-created',
    });

    // Usage by endpoint
    const usageByEndpoint: Record<string, number> = {};
    recentUsage.items.forEach((usage: any) => {
      const endpoint = usage.endpoint || 'unknown';
      usageByEndpoint[endpoint] = (usageByEndpoint[endpoint] || 0) + usage.tokensUsed;
    });

    // Get transactions for last 30 days
    const recentTransactions = await adminPb.collection('transactions').getList(1, 1000, {
      filter: `created >= "${thirtyDaysAgo.toISOString()}"`,
      sort: '-created',
    });

    // Calculate revenue
    const revenueUSD = recentTransactions.items
      .filter((t: any) => t.status === 'completed' && t.currency === 'USD')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    const revenueIRT = recentTransactions.items
      .filter((t: any) => t.status === 'completed' && t.currency === 'IRT')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    // Package distribution
    const packageDistribution: Record<string, number> = {};
    users.forEach((u) => {
      if (u.packageId) {
        packageDistribution[u.packageId] = (packageDistribution[u.packageId] || 0) + 1;
      }
    });

    // Users by credit range
    const creditRanges = {
      '0-10K': 0,
      '10K-100K': 0,
      '100K-1M': 0,
      '1M-10M': 0,
      '10M+': 0,
    };

    users.forEach((u) => {
      const available = (u.totalTokens || 0) + (u.dailyTokens || 0) - (u.usedTokens || 0);
      if (available <= 10000) creditRanges['0-10K']++;
      else if (available <= 100000) creditRanges['10K-100K']++;
      else if (available <= 1000000) creditRanges['100K-1M']++;
      else if (available <= 10000000) creditRanges['1M-10M']++;
      else creditRanges['10M+']++;
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        activeSubscribers,
        totalTokensPurchased,
        totalTokensUsed,
        totalDailyTokens,
        totalAvailable,
        utilizationRate: totalTokensPurchased > 0
          ? ((totalTokensUsed / totalTokensPurchased) * 100).toFixed(2) + '%'
          : '0%',
      },
      revenue: {
        last30Days: {
          USD: revenueUSD,
          IRT: revenueIRT,
        },
        transactionCount: recentTransactions.items.filter((t: any) => t.status === 'completed').length,
      },
      usage: {
        last30Days: recentUsage.totalItems,
        byEndpoint: usageByEndpoint,
      },
      distribution: {
        byPackage: packageDistribution,
        byCreditRange: creditRanges,
      },
    });
  } catch (error) {
    console.error('Error fetching credit stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch credit statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
