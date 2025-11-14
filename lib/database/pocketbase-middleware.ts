import { NextRequest, NextResponse } from 'next/server';
import { pb, User } from './pocketbase';

/**
 * Get authenticated user from request
 * Checks both Authorization header and cookies
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<User | null> {
  try {
    // Try to get auth from cookie first
    const pbAuthCookie = req.cookies.get('pb_auth')?.value;

    if (pbAuthCookie) {
      try {
        const authData = JSON.parse(pbAuthCookie);
        pb.authStore.save(authData.token, authData.model);

        if (pb.authStore.isValid && pb.authStore.model) {
          return pb.authStore.model as User;
        }
      } catch (e) {
        // Invalid cookie format
      }
    }

    // Try Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      pb.authStore.save(token, null);

      // Verify token by trying to get current user
      try {
        const user = await pb.collection('users').authRefresh();
        return user.record as User;
      } catch (e) {
        // Invalid token
      }
    }

    return null;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 * Returns 401 if not authenticated
 */
export async function requireAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: User) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return handler(req, user);
}
