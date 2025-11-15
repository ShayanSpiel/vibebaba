import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-middleware';

export async function GET(req: NextRequest) {
  // Debug logging
  console.log('[Check Access] Request received');
  console.log('[Check Access] All cookies:', req.cookies.getAll());
  console.log('[Check Access] pb_auth cookie:', req.cookies.get('pb_auth'));

  return requireAdmin(req, async (req, user) => {
    console.log('[Check Access] Admin verified:', user);
    return NextResponse.json({
      authorized: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  });
}
