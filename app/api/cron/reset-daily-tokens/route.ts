import { type NextRequest, NextResponse } from 'next/server';
import { PRICING_PACKAGES } from '@/lib/credits';
import { pb } from '@/lib/database/pocketbase';

export async function GET(req: NextRequest) {
  try {
    // Optional: Add authorization header check for cron jobs
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all users with active packages that need daily reset
    const usersNeedingReset = await pb.collection('users').getFullList({
      filter: `packageId != null && packageExpiry > "${now.toISOString()}" && (lastDailyReset = null || lastDailyReset < "${oneDayAgo.toISOString()}")`,
    });

    let resetCount = 0;

    for (const user of usersNeedingReset) {
      const pkg = PRICING_PACKAGES[user.packageId as keyof typeof PRICING_PACKAGES];
      if (pkg) {
        try {
          await pb.collection('users').update(user.id, {
            dailyTokens: pkg.dailyTokens,
            lastDailyReset: now.toISOString(),
          });
          resetCount++;
        } catch (updateError) {
          console.error(`Failed to reset tokens for user ${user.id}:`, updateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      resetCount,
      message: `Reset daily tokens for ${resetCount} users`,
    });
  } catch (error: any) {
    console.error('Error resetting daily tokens:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
