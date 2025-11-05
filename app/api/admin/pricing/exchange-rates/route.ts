// app/api/admin/pricing/exchange-rates/route.ts
// Admin API for managing exchange rates
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-auth';
import { getPricingConfig } from '@/lib/config/pricing-config';
import { getAdminPb } from '@/lib/pocketbase-admin';

/**
 * PATCH /api/admin/pricing/exchange-rates
 * Update exchange rates
 */
export async function PATCH(req: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess(req);
    if (!adminCheck.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { USD_TO_IRT, USD_TO_RIALS } = await req.json();

    // Validate
    if (!USD_TO_IRT || !USD_TO_RIALS) {
      return NextResponse.json(
        { error: 'Both USD_TO_IRT and USD_TO_RIALS are required' },
        { status: 400 }
      );
    }

    // Build updated config
    const currentConfig = getPricingConfig();
    const newConfig = {
      ...currentConfig,
      currency: {
        ...currentConfig.currency,
        exchangeRates: {
          USD_TO_IRT: Number(USD_TO_IRT),
          USD_TO_RIALS: Number(USD_TO_RIALS),
        },
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
      message: 'Exchange rates updated',
      exchangeRates: newConfig.currency.exchangeRates,
      note: 'Set PRICING_CONFIG_JSON environment variable to activate changes',
      envVariable: JSON.stringify(newConfig),
    });
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    return NextResponse.json(
      {
        error: 'Failed to update exchange rates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
