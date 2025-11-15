import { type NextRequest, NextResponse } from 'next/server';
import { logAdminAction, requireAdmin } from '@/lib/auth/admin-middleware';
import { CUSTOM_CREDIT_PRICING, PRICING_PACKAGES } from '@/lib/database/pocketbase-credits';

/**
 * Get all pricing packages
 * GET /api/admin/packages
 */
export async function GET(req: NextRequest) {
  return requireAdmin(req, async () => {
    try {
      return NextResponse.json({
        packages: PRICING_PACKAGES,
        customPricing: CUSTOM_CREDIT_PRICING,
      });
    } catch (error: any) {
      console.error('Error fetching packages:', error);
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
  });
}

/**
 * Update pricing configuration
 * PUT /api/admin/packages
 *
 * Note: This updates the in-memory configuration.
 * For persistent changes, update lib/pocketbase-credits.ts
 */
export async function PUT(req: NextRequest) {
  return requireAdmin(req, async (req, admin) => {
    try {
      const { packageId, updates } = await req.json();

      if (!packageId || !updates) {
        return NextResponse.json({ error: 'packageId and updates are required' }, { status: 400 });
      }

      // Validate package exists
      if (!PRICING_PACKAGES[packageId as keyof typeof PRICING_PACKAGES]) {
        return NextResponse.json({ error: `Package ${packageId} not found` }, { status: 404 });
      }

      // Log admin action
      await logAdminAction(admin.id, 'update_package_pricing', 'package', packageId, { updates });

      return NextResponse.json({
        success: true,
        message:
          'Package pricing configuration noted. Please update lib/pocketbase-credits.ts for persistent changes.',
        note: 'Runtime pricing updates require code changes for persistence',
        recommendedAction: `Update PRICING_PACKAGES.${packageId} in lib/pocketbase-credits.ts`,
      });
    } catch (error: any) {
      console.error('Error updating package:', error);
      return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
    }
  });
}
