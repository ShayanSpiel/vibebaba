import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin-middleware';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req, admin) => {
    try {
      const { userId, tokens, action } = await req.json();

      if (!userId || !tokens || !action) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      if (action !== 'add' && action !== 'remove') {
        return NextResponse.json(
          { error: 'Invalid action. Must be "add" or "remove"' },
          { status: 400 }
        );
      }

      const pb = new PocketBase(PB_URL);

      // Get current user
      const user = await pb.collection('users').getOne(userId);

      // Update tokens
      const currentTotalTokens = user.totalTokens || 0;
      const currentUsedTokens = user.usedTokens || 0;

      if (action === 'add') {
        await pb.collection('users').update(userId, {
          totalTokens: currentTotalTokens + tokens
        });
      } else {
        // Remove tokens (increase usedTokens)
        await pb.collection('users').update(userId, {
          usedTokens: currentUsedTokens + tokens
        });
      }

      // Log admin action
      await logAdminAction(
        admin.id,
        action === 'add' ? 'add_tokens' : 'remove_tokens',
        'user',
        userId,
        { tokens, action }
      );

      return NextResponse.json({
        success: true,
        message: `Successfully ${action === 'add' ? 'added' : 'removed'} ${tokens} tokens`,
      });
    } catch (error: any) {
      console.error('Error adjusting credits:', error);
      return NextResponse.json(
        { error: 'Failed to adjust credits' },
        { status: 500 }
      );
    }
  });
}
