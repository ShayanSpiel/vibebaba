import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { getAdminPb } from '@/lib/database/pocketbase-admin';

export async function GET(req: NextRequest) {
  return requireAdmin(req, async () => {
    try {
      const pb = await getAdminPb();

      // Get all transactions with user email
      const transactionsResult = await pb.collection('transactions').getList(1, 500, {
        sort: '-created',
        expand: 'userId',
      });

      const transactions = transactionsResult.items.map((tx: any) => ({
        id: tx.id,
        userId: tx.userId,
        email: tx.expand?.userId?.email || '',
        type: tx.type,
        amount: tx.amount,
        tokens: tx.tokens,
        currency: tx.currency || 'USD',
        packageId: tx.packageId || null,
        paymentProvider: tx.paymentProvider || null,
        paymentId: tx.paymentId || null,
        status: tx.status,
        createdAt: new Date(tx.created).getTime(),
      }));

      return NextResponse.json({ transactions });
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
    }
  });
}
