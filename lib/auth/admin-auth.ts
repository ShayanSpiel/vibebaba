// lib/admin-auth.ts
// Helper for admin authentication checks
import { NextRequest } from 'next/server';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Check admin access (non-throwing, returns result object)
 * Useful for endpoints that need to handle authorization differently
 */
export async function checkAdminAccess(req: NextRequest): Promise<{
  allowed: boolean;
  user?: AdminUser;
  error?: string;
}> {
  try {
    // Get PocketBase auth cookie
    const pbAuthCookie = req.cookies.get('pb_auth')?.value;

    if (!pbAuthCookie) {
      return {
        allowed: false,
        error: 'No authentication cookie found',
      };
    }

    // Parse PocketBase auth data
    const authData = JSON.parse(pbAuthCookie);

    if (!authData.token || !authData.model) {
      return {
        allowed: false,
        error: 'Invalid authentication data',
      };
    }

    const pbUser = authData.model;
    const role = pbUser.role || 'user';

    // Check admin role
    if (role !== 'admin') {
      return {
        allowed: false,
        error: 'Admin access required',
      };
    }

    return {
      allowed: true,
      user: {
        id: pbUser.id,
        email: pbUser.email,
        name: pbUser.name || pbUser.username || '',
        role: role,
      },
    };
  } catch (error) {
    console.error('[Admin Auth] Error checking admin access:', error);
    return {
      allowed: false,
      error: error instanceof Error ? error.message : 'Authentication error',
    };
  }
}

/**
 * Verify admin status from database
 */
export async function verifyAdminRole(userId: string): Promise<boolean> {
  try {
    const pb = new PocketBase(PB_URL);
    const user = await pb.collection('users').getOne(userId);
    return user.role === 'admin';
  } catch (error) {
    console.error('[Admin Auth] Error verifying admin role:', error);
    return false;
  }
}
