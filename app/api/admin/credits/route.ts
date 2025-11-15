import { type NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { requireAdmin } from '@/lib/auth/admin-middleware';
import { loadUserCreditsPage } from '@/lib/credits/batch-operations';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

/**
 * PHASE 1 OPTIMIZATION: Paginated admin credits API
 *
 * OLD: Loaded 500 users at once (slow, memory intensive)
 * NEW: Paginated loading (50 users per page, fast)
 */
export async function GET(req: NextRequest) {
  return requireAdmin(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const searchTerm = searchParams.get('search') || '';

      const pb = new PocketBase(PB_URL);

      // Use optimized batch loading
      const result = await loadUserCreditsPage(page, limit, pb, searchTerm);

      return NextResponse.json({
        users: result.users,
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      });
    } catch (error: any) {
      console.error('Error loading credit data:', error);
      return NextResponse.json({ error: 'Failed to load credit data' }, { status: 500 });
    }
  });
}
