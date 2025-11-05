import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin-middleware';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

/**
 * Reset user credits
 * POST /api/admin/credits/reset
 */
export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req, admin) => {
    try {
      const { userId, resetType } = await req.json();

      if (!userId || !resetType) {
        return NextResponse.json(
          { error: 'userId and resetType are required' },
          { status: 400 }
        );
      }

      const pb = new PocketBase(PB_URL);

      // Get current user
      const user = await pb.collection('users').getOne(userId);

      let updateData: any = {};
      let description = '';

      switch (resetType) {
        case 'all':
          // Reset all credits to 0
          updateData = {
            totalTokens: 0,
            usedTokens: 0,
            dailyTokens: 0,
            packageId: null,
            packageExpiry: null,
            lastDailyReset: null,
          };
          description = 'Reset all credits to 0';
          break;

        case 'used':
          // Reset only used tokens
          updateData = {
            usedTokens: 0,
          };
          description = 'Reset used tokens to 0';
          break;

        case 'package':
          // Remove package subscription
          updateData = {
            packageId: null,
            packageExpiry: null,
            dailyTokens: 0,
            lastDailyReset: null,
          };
          description = 'Removed package subscription';
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid resetType. Use: all, used, or package' },
            { status: 400 }
          );
      }

      // Update user
      await pb.collection('users').update(userId, updateData);

      // Log admin action
      await logAdminAction(
        admin.id,
        `reset_credits_${resetType}`,
        'user',
        userId,
        {
          resetType,
          previousState: {
            totalTokens: user.totalTokens,
            usedTokens: user.usedTokens,
            dailyTokens: user.dailyTokens,
            packageId: user.packageId,
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: description,
        userId,
      });
    } catch (error: any) {
      console.error('Error resetting credits:', error);
      return NextResponse.json(
        { error: 'Failed to reset credits' },
        { status: 500 }
      );
    }
  });
}
