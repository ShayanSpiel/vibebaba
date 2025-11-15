import { type NextRequest, NextResponse } from 'next/server';
import { logAdminAction, requireAdmin } from '@/lib/auth/admin-middleware';
import { getAdminPb } from '@/lib/database/pocketbase-admin';

/**
 * Add credits to user by email address
 * POST /api/admin/credits/add-by-email
 */
export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req, admin) => {
    try {
      const { email, tokens } = await req.json();

      if (!email || !tokens) {
        return NextResponse.json({ error: 'Email and tokens are required' }, { status: 400 });
      }

      if (tokens <= 0) {
        return NextResponse.json({ error: 'Tokens must be greater than 0' }, { status: 400 });
      }

      // Use admin-authenticated PocketBase client
      const pb = await getAdminPb();

      // Find user by email
      const users = await pb.collection('users').getFullList({
        filter: `email = "${email}"`,
      });

      if (users.length === 0) {
        return NextResponse.json({ error: `User with email ${email} not found` }, { status: 404 });
      }

      const user = users[0];
      const currentTotalTokens = user.totalTokens || 0;

      // Update tokens
      await pb.collection('users').update(user.id, {
        totalTokens: currentTotalTokens + tokens,
      });

      // Log admin action
      await logAdminAction(admin.id, 'add_tokens_by_email', 'user', user.id, {
        email,
        tokens,
        previousTotal: currentTotalTokens,
        newTotal: currentTotalTokens + tokens,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully added ${tokens} tokens to ${email}`,
        user: {
          id: user.id,
          email: user.email,
          previousTokens: currentTotalTokens,
          newTokens: currentTotalTokens + tokens,
        },
      });
    } catch (error: any) {
      console.error('Error adding credits by email:', error);
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }
  });
}
