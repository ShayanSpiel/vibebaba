import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Get authenticated user from PocketBase session
 */
async function getAuthenticatedUser(req: NextRequest): Promise<AdminUser | null> {
  try {
    // Get PocketBase auth cookie
    const pbAuthCookie = req.cookies.get('pb_auth')?.value;

    console.log('[Admin Middleware] Checking auth cookie...');

    if (!pbAuthCookie) {
      console.log('[Admin Middleware] No pb_auth cookie found');
      return null;
    }

    // Parse PocketBase auth data
    const authData = JSON.parse(pbAuthCookie);

    if (!authData.token || !authData.model) {
      console.log('[Admin Middleware] Invalid auth data - missing token or model');
      return null;
    }

    // Get user from PocketBase model
    const pbUser = authData.model;

    // Check if user has a role field in PocketBase
    const role = pbUser.role || 'user';

    console.log('[Admin Middleware] User authenticated:', {
      email: pbUser.email,
      role: role,
      hasRoleField: !!pbUser.role
    });

    return {
      id: pbUser.id,
      email: pbUser.email,
      name: pbUser.name || pbUser.username || '',
      role: role
    };
  } catch (error) {
    console.error('[Admin Middleware] Auth error:', error);
    return null;
  }
}

/**
 * Check if user is an admin using PocketBase
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const pb = new PocketBase(PB_URL);
    const user = await pb.collection('users').getOne(userId);
    return user.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Require admin middleware
 * Returns 403 if user is not an admin
 */
export async function requireAdmin(
  req: NextRequest,
  handler: (req: NextRequest, user: AdminUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  return handler(req, user);
}

/**
 * Log admin action to audit trail in PocketBase
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const pb = new PocketBase(PB_URL);

    // Create audit log record
    await pb.collection('audit_logs').create({
      adminId,
      action,
      targetType: targetType || '',
      targetId: targetId || '',
      metadata: metadata ? JSON.stringify(metadata) : ''
    });

    console.log(`[Audit] Admin ${adminId} performed action: ${action}`);
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}
