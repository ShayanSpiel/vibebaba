import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin-middleware';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

/**
 * Process refund for a transaction
 * POST /api/admin/payments/refund
 */
export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req, admin) => {
    try {
      const { transactionId, removeTokens } = await req.json();

      if (!transactionId) {
        return NextResponse.json(
          { error: 'transactionId is required' },
          { status: 400 }
        );
      }

      const pb = new PocketBase(PB_URL);

      // Get transaction
      const transaction = await pb.collection('transactions').getOne(transactionId);

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }

      if (transaction.status !== 'completed') {
        return NextResponse.json(
          { error: 'Can only refund completed transactions' },
          { status: 400 }
        );
      }

      // Update transaction status
      await pb.collection('transactions').update(transactionId, {
        status: 'refunded',
      });

      // Optionally remove tokens from user
      if (removeTokens) {
        const user = await pb.collection('users').getOne(transaction.userId);
        const currentUsedTokens = user.usedTokens || 0;

        // Increase used tokens (effectively removing available tokens)
        await pb.collection('users').update(transaction.userId, {
          usedTokens: currentUsedTokens + (transaction.tokens || 0),
        });
      }

      // Create refund transaction record
      await pb.collection('transactions').create({
        userId: transaction.userId,
        type: 'refund',
        amount: -Math.abs(transaction.amount),
        tokens: -(transaction.tokens || 0),
        currency: transaction.currency,
        packageId: transaction.packageId,
        paymentProvider: transaction.paymentProvider,
        paymentId: transaction.paymentId,
        status: 'completed',
      });

      // Log admin action
      await logAdminAction(
        admin.id,
        'refund_payment',
        'transaction',
        transactionId,
        {
          originalAmount: transaction.amount,
          tokens: transaction.tokens,
          removeTokens,
          userId: transaction.userId,
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Refund processed successfully',
        transactionId,
        refundedAmount: transaction.amount,
        tokensRemoved: removeTokens ? transaction.tokens : 0,
      });
    } catch (error: any) {
      console.error('Error processing refund:', error);
      return NextResponse.json(
        { error: 'Failed to process refund' },
        { status: 500 }
      );
    }
  });
}
