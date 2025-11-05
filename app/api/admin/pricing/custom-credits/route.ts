// app/api/admin/pricing/custom-credits/route.ts
// Admin API for managing custom credit pricing
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-auth';
import { getPricingConfig } from '@/lib/config/pricing-config';
import { getAdminPb } from '@/lib/pocketbase-admin';

/**
 * PATCH /api/admin/pricing/custom-credits
 * Update custom credit pricing (per token pricing)
 */
export async function PATCH(req: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess(req);
    if (!adminCheck.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceUSD, priceIRT, unitSize } = await req.json();

    // Validate
    if (priceUSD === undefined || priceIRT === undefined) {
      return NextResponse.json(
        { error: 'Both priceUSD and priceIRT are required' },
        { status: 400 }
      );
    }

    // Build updated config
    const currentConfig = getPricingConfig();
    const newConfig = {
      ...currentConfig,
      customCredits: {
        ...currentConfig.customCredits,
        pricePerUnit: {
          USD: Number(priceUSD),
          IRT: Number(priceIRT),
        },
        ...(unitSize && { unitSize: Number(unitSize) }),
      },
      lastUpdated: new Date().toISOString(),
    };

    // Save to database
    const adminPb = await getAdminPb();
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
      message: 'Custom credit pricing updated',
      customCredits: newConfig.customCredits,
      note: 'Set PRICING_CONFIG_JSON environment variable to activate changes',
      envVariable: JSON.stringify(newConfig),
    });
  } catch (error) {
    console.error('Error updating custom credit pricing:', error);
    return NextResponse.json(
      {
        error: 'Failed to update custom credit pricing',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
