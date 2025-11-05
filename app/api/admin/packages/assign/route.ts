import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin-middleware';
import { activatePackage } from '@/lib/pocketbase-credits';

/**
 * Manually assign package to user (admin override)
 * POST /api/admin/packages/assign
 */
export async function POST(req: NextRequest) {
  return requireAdmin(req, async (req, admin) => {
    try {
      const { userId, packageId } = await req.json();

      if (!userId || !packageId) {
        return NextResponse.json(
          { error: 'userId and packageId are required' },
          { status: 400 }
        );
      }

      // Activate package for user
      await activatePackage(userId, packageId);

      // Log admin action
      await logAdminAction(
        admin.id,
        'assign_package',
        'user',
        userId,
        { packageId }
      );

      return NextResponse.json({
        success: true,
        message: `Package ${packageId} assigned to user ${userId}`,
      });
    } catch (error: any) {
      console.error('Error assigning package:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to assign package' },
        { status: 500 }
      );
    }
  });
}
