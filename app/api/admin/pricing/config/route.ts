// app/api/admin/pricing/config/route.ts
// Admin API for managing pricing configuration
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth/admin-auth';
import { getPricingConfig, reloadPricingConfig } from '@/lib/config/pricing-config';
import { getAdminPb } from '@/lib/database/pocketbase-admin';

/**
 * GET /api/admin/pricing/config
 * Get current pricing configuration
 */
export async function GET(req: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess(req);
    if (!adminCheck.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getPricingConfig();

    // Also check if there's a stored config in database
    const adminPb = await getAdminPb();
    let storedConfig = null;
    try {
      const setting = await adminPb
        .collection('settings')
        .getFirstListItem('key="pricing_config"');
      if (setting?.value) {
        storedConfig = JSON.parse(setting.value);
      }
    } catch (error) {
      // No stored config yet
    }

    return NextResponse.json({
      currentConfig: config,
      storedConfig: storedConfig,
      source: process.env.PRICING_CONFIG_JSON ? 'environment' : 'default',
      hasEnvOverride: !!process.env.PRICING_CONFIG_JSON,
    });
  } catch (error) {
    console.error('Error fetching pricing config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing config' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pricing/config
 * Update pricing configuration (saves to database)
 */
export async function POST(req: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess(req);
    if (!adminCheck.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();

    // Validate the updates
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Invalid configuration format' },
        { status: 400 }
      );
    }

    // Save to database
    const adminPb = await getAdminPb();

    // Check if settings collection exists and create pricing_config entry
    try {
      const existing = await adminPb
        .collection('settings')
        .getFirstListItem('key="pricing_config"');

      // Update existing
      await adminPb.collection('settings').update(existing.id, {
        value: JSON.stringify(updates),
        updated: new Date().toISOString(),
      });
    } catch (error) {
      // Create new
      await adminPb.collection('settings').create({
        key: 'pricing_config',
        value: JSON.stringify(updates),
        description: 'Pricing configuration override',
      });
    }

    // Reload configuration from environment/default
    // Note: Database config is just for backup/reference
    // Active config comes from environment variable or default
    reloadPricingConfig();

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration saved to database',
      note: 'To activate, set PRICING_CONFIG_JSON environment variable or restart server',
      updatedConfig: updates,
    });
  } catch (error) {
    console.error('Error updating pricing config:', error);
    return NextResponse.json(
      {
        error: 'Failed to update pricing config',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pricing/config/reload
 * Force reload pricing configuration
 */
export async function PUT(req: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess(req);
    if (!adminCheck.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newConfig = reloadPricingConfig();

    return NextResponse.json({
      success: true,
      message: 'Pricing configuration reloaded',
      config: newConfig,
    });
  } catch (error) {
    console.error('Error reloading pricing config:', error);
    return NextResponse.json(
      { error: 'Failed to reload pricing config' },
      { status: 500 }
    );
  }
}
