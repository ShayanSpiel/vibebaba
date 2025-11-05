import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

export async function GET(req: NextRequest) {
  return requireAdmin(req, async () => {
    try {
      const pb = new PocketBase(PB_URL);

      // Total users
      const usersResult = await pb.collection('users').getList(1, 1);
      const totalUsers = usersResult.totalItems;

      // New users today
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const newUsersTodayResult = await pb.collection('users').getList(1, 1, {
        filter: `created >= "${oneDayAgo.toISOString()}"`
      });
      const newUsersToday = newUsersTodayResult.totalItems;

      // Total revenue from transactions
      const completedTransactionsResult = await pb.collection('transactions').getList(1, 500, {
        filter: 'status = "completed"',
        fields: 'amount'
      });
      const totalRevenue = completedTransactionsResult.items.reduce((sum, t: any) => sum + (t.amount || 0), 0);

      // Revenue this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      const monthTransactionsResult = await pb.collection('transactions').getList(1, 500, {
        filter: `status = "completed" && created >= "${firstDayOfMonth.toISOString()}"`,
        fields: 'amount'
      });
      const revenueThisMonth = monthTransactionsResult.items.reduce((sum, t: any) => sum + (t.amount || 0), 0);

      // Total API calls (token usage)
      const tokenUsageResult = await pb.collection('token_usage').getList(1, 1);
      const totalApiCalls = tokenUsageResult.totalItems;

      // API calls today
      const apiCallsTodayResult = await pb.collection('token_usage').getList(1, 1, {
        filter: `created >= "${oneDayAgo.toISOString()}"`
      });
      const apiCallsToday = apiCallsTodayResult.totalItems;

      // Active projects
      const activeProjectsResult = await pb.collection('projects').getList(1, 1, {
        filter: '(stage = "planning" || stage = "building")'
      });
      const activeProjects = activeProjectsResult.totalItems;

      // Recent users (last 5)
      const recentUsersResult = await pb.collection('users').getList(1, 5, {
        sort: '-created',
        fields: 'id,email,name,username,created'
      });
      const recentUsers = recentUsersResult.items.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name || user.username || '',
        createdAt: new Date(user.created).getTime()
      }));

      // Recent transactions (last 5)
      const recentTransactionsResult = await pb.collection('transactions').getList(1, 5, {
        sort: '-created',
        expand: 'userId',
        fields: 'id,userId,amount,tokens,status,created'
      });
      const recentTransactions = recentTransactionsResult.items.map((tx: any) => ({
        id: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        tokens: tx.tokens,
        status: tx.status,
        createdAt: new Date(tx.created).getTime()
      }));

      return NextResponse.json({
        totalUsers,
        newUsersToday,
        totalRevenue,
        revenueThisMonth,
        totalApiCalls,
        apiCallsToday,
        activeProjects,
        recentUsers,
        recentTransactions,
      });
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      return NextResponse.json(
        { error: 'Failed to load dashboard stats' },
        { status: 500 }
      );
    }
  });
}
