import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/auth/admin-middleware';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

/**
 * Bulk credit operations
 * POST /api/admin/credits/bulk
 */
export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req, admin) => {
    try {
      const { emails, tokens, action } = await req.json();

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return NextResponse.json(
          { error: 'emails array is required' },
          { status: 400 }
        );
      }

      if (!tokens || tokens <= 0) {
        return NextResponse.json(
          { error: 'tokens must be greater than 0' },
          { status: 400 }
        );
      }

      if (!action || (action !== 'add' && action !== 'remove')) {
        return NextResponse.json(
          { error: 'action must be "add" or "remove"' },
          { status: 400 }
        );
      }

      const pb = new PocketBase(PB_URL);

      const results = {
        success: [] as string[],
        failed: [] as { email: string; error: string }[],
      };

      // Process each email
      for (const email of emails) {
        try {
          // Find user by email
          const users = await pb.collection('users').getFullList({
            filter: `email = "${email}"`,
          });

          if (users.length === 0) {
            results.failed.push({ email, error: 'User not found' });
            continue;
          }

          const user = users[0];
          const currentTotalTokens = user.totalTokens || 0;
          const currentUsedTokens = user.usedTokens || 0;

          if (action === 'add') {
            await pb.collection('users').update(user.id, {
              totalTokens: currentTotalTokens + tokens,
            });
          } else {
            await pb.collection('users').update(user.id, {
              usedTokens: currentUsedTokens + tokens,
            });
          }

          results.success.push(email);
        } catch (error: any) {
          results.failed.push({ email, error: error.message });
        }
      }

      // Log admin action
      await logAdminAction(
        admin.id,
        'bulk_credit_operation',
        'users',
        '',
        {
          action,
          tokens,
          totalEmails: emails.length,
          successCount: results.success.length,
          failedCount: results.failed.length,
        }
      );

      return NextResponse.json({
        success: true,
        message: `Bulk operation completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
        results,
      });
    } catch (error: any) {
      console.error('Error in bulk credit operation:', error);
      return NextResponse.json(
        { error: 'Failed to process bulk operation' },
        { status: 500 }
      );
    }
  });
}
