import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

/**
 * Get comprehensive payment analytics
 * GET /api/admin/payments/analytics
 */
export async function GET(req: NextRequest) {
  return requireAdmin(req, async () => {
    try {
      const pb = new PocketBase(PB_URL);

      // Get all transactions
      const transactions = await pb.collection('transactions').getFullList({
        sort: '-created',
        expand: 'userId',
      });

      // Calculate analytics
      const analytics = {
        overview: {
          totalTransactions: transactions.length,
          completedTransactions: transactions.filter(t => t.status === 'completed').length,
          pendingTransactions: transactions.filter(t => t.status === 'pending').length,
          failedTransactions: transactions.filter(t => t.status === 'failed').length,
          cancelledTransactions: transactions.filter(t => t.status === 'cancelled').length,
          refundedTransactions: transactions.filter(t => t.status === 'refunded').length,
        },
        revenue: {
          totalRevenue: transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => {
              // Convert to USD for unified reporting
              const amount = t.currency === 'IRT' ? t.amount / 70000 : t.amount;
              return sum + amount;
            }, 0),
          revenueByMonth: {} as Record<string, number>,
          revenueByPackage: {} as Record<string, number>,
        },
        tokens: {
          totalTokensSold: transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.tokens || 0), 0),
          tokensByPackage: {} as Record<string, number>,
        },
        users: {
          uniquePayingUsers: new Set(
            transactions
              .filter(t => t.status === 'completed')
              .map(t => t.userId)
          ).size,
          subscriptionUsers: transactions
            .filter(t => t.status === 'completed' && t.type === 'subscription')
            .length,
          oneTimePurchaseUsers: transactions
            .filter(t => t.status === 'completed' && t.type === 'purchase')
            .length,
        },
        currency: {
          usdTransactions: transactions.filter(t => t.currency === 'USD').length,
          irtTransactions: transactions.filter(t => t.currency === 'IRT').length,
        },
      };

      // Calculate revenue by month
      const completedTransactions = transactions.filter(t => t.status === 'completed');
      completedTransactions.forEach(t => {
        const date = new Date(t.created);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = t.currency === 'IRT' ? t.amount / 70000 : t.amount;
        analytics.revenue.revenueByMonth[monthKey] = (analytics.revenue.revenueByMonth[monthKey] || 0) + amount;
      });

      // Calculate revenue by package
      completedTransactions.forEach(t => {
        if (t.packageId) {
          const amount = t.currency === 'IRT' ? t.amount / 70000 : t.amount;
          analytics.revenue.revenueByPackage[t.packageId] = (analytics.revenue.revenueByPackage[t.packageId] || 0) + amount;
        } else {
          const amount = t.currency === 'IRT' ? t.amount / 70000 : t.amount;
          analytics.revenue.revenueByPackage['custom'] = (analytics.revenue.revenueByPackage['custom'] || 0) + amount;
        }
      });

      // Calculate tokens by package
      completedTransactions.forEach(t => {
        if (t.packageId) {
          analytics.tokens.tokensByPackage[t.packageId] = (analytics.tokens.tokensByPackage[t.packageId] || 0) + (t.tokens || 0);
        } else {
          analytics.tokens.tokensByPackage['custom'] = (analytics.tokens.tokensByPackage['custom'] || 0) + (t.tokens || 0);
        }
      });

      // Recent transactions (last 10)
      const recentTransactions = transactions.slice(0, 10).map((tx: any) => ({
        id: tx.id,
        userId: tx.userId,
        email: tx.expand?.userId?.email || 'N/A',
        type: tx.type,
        amount: tx.amount,
        tokens: tx.tokens,
        currency: tx.currency || 'USD',
        packageId: tx.packageId || null,
        status: tx.status,
        created: tx.created,
      }));

      return NextResponse.json({
        analytics,
        recentTransactions,
      });
    } catch (error: any) {
      console.error('Error fetching payment analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment analytics' },
        { status: 500 }
      );
    }
  });
}
