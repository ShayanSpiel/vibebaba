import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { PRICING_PACKAGES } from '@/lib/pocketbase-credits';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

/**
 * PHASE 1: Smart Daily Reset Cron Job
 *
 * This endpoint is called hourly by Vercel Cron to reset daily tokens
 * for users who need it. This replaces the old approach of checking
 * and writing on EVERY credit check (massive performance improvement).
 *
 * OLD: Write on every credit check (100% write rate) 🐌
 * NEW: Background job resets only users who need it ⚡
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      console.error('[Cron] Unauthorized daily reset attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting smart daily reset...');
    const startTime = Date.now();

    // Initialize PocketBase with admin auth
    const pb = new PocketBase(PB_URL);
    await pb.admins.authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    // Find all users who need daily reset
    // This is MUCH faster than checking every user on every request
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const usersToReset = await pb.collection('users').getFullList({
      filter: `lastDailyReset < "${oneDayAgo.toISOString()}" || lastDailyReset = ""`,
      fields: 'id,email,packageId,packageExpiry,lastDailyReset',
      sort: 'lastDailyReset'
    });

    console.log(`[Cron] Found ${usersToReset.length} users needing daily reset`);

    if (usersToReset.length === 0) {
      return NextResponse.json({
        success: true,
        resetCount: 0,
        duration: Date.now() - startTime,
        message: 'No users need daily reset'
      });
    }

    // Process resets in batches for better performance
    const BATCH_SIZE = 50;
    let resetCount = 0;
    let errorCount = 0;

    for (let i = 0; i < usersToReset.length; i += BATCH_SIZE) {
      const batch = usersToReset.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (user) => {
        try {
          // Calculate daily tokens based on package
          let dailyAmount = 0;

          if (user.packageId && user.packageExpiry) {
            const packageExpiry = new Date(user.packageExpiry);

            // Only give daily tokens if package is still active
            if (packageExpiry > now) {
              const pkg = PRICING_PACKAGES[user.packageId as keyof typeof PRICING_PACKAGES];
              if (pkg) {
                dailyAmount = pkg.dailyTokens;
              }
            }
          }

          // Update user with new daily tokens
          await pb.collection('users').update(user.id, {
            dailyTokens: dailyAmount,
            lastDailyReset: now.toISOString(),
            needsDailyReset: false // Clear the flag
          });

          resetCount++;

          if (resetCount % 100 === 0) {
            console.log(`[Cron] Progress: ${resetCount}/${usersToReset.length} users reset`);
          }
        } catch (error) {
          console.error(`[Cron] Failed to reset user ${user.email}:`, error);
          errorCount++;
        }
      });

      await Promise.all(batchPromises);
    }

    const duration = Date.now() - startTime;

    console.log(`[Cron] Daily reset completed:`);
    console.log(`  - Reset: ${resetCount} users`);
    console.log(`  - Errors: ${errorCount}`);
    console.log(`  - Duration: ${duration}ms`);

    return NextResponse.json({
      success: true,
      resetCount,
      errorCount,
      duration,
      message: `Successfully reset ${resetCount} users in ${duration}ms`
    });

  } catch (error: any) {
    console.error('[Cron] Daily reset failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}
