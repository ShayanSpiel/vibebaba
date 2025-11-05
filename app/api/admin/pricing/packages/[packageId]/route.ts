// app/api/admin/pricing/packages/[packageId]/route.ts
// Admin API for updating individual package pricing
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-auth';
import { getPricingConfig, reloadPricingConfig } from '@/lib/config/pricing-config';
import { getAdminPb } from '@/lib/pocketbase-admin';

/**
 * PATCH /api/admin/pricing/packages/[packageId]
 * Update specific package pricing
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess(req);
    if (!adminCheck.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId } = await params;
    const updates = await req.json();

    // Validate packageId
    const currentConfig = getPricingConfig();
    if (!currentConfig.packages[packageId]) {
      return NextResponse.json(
        { error: `Package ${packageId} not found` },
        { status: 404 }
      );
    }

    // Build updated config
    const newConfig = {
      ...currentConfig,
      packages: {
        ...currentConfig.packages,
        [packageId]: {
          ...currentConfig.packages[packageId],
          ...updates,
        },
      },
      lastUpdated: new Date().toISOString(),
    };

    // Save to database
    const adminPb = await getAdminPb();

    // Check if settings collection exists
    try {
      await adminPb.collection('settings').getList(1, 1);
    } catch (collectionError: any) {
      console.error('Settings collection does not exist:', collectionError);
      return NextResponse.json(
        {
          error: 'Settings collection does not exist in PocketBase',
          details: 'Please create the "settings" collection first. See ADMIN_SETUP_GUIDE.md for instructions.',
        },
        { status: 500 }
      );
    }

    try {
      const existing = await adminPb
        .collection('settings')
        .getFirstListItem('key="pricing_config"');

      await adminPb.collection('settings').update(existing.id, {
        value: JSON.stringify(newConfig),
        updated: new Date().toISOString(),
      });
    } catch (error) {
      // Create new
      await adminPb.collection('settings').create({
        key: 'pricing_config',
        value: JSON.stringify(newConfig),
        description: 'Pricing configuration override',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Package ${packageId} updated`,
      package: newConfig.packages[packageId],
      note: 'Set PRICING_CONFIG_JSON environment variable to activate changes',
      envVariable: JSON.stringify(newConfig),
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      {
        error: 'Failed to update package',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
