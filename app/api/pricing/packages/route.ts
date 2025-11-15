// app/api/pricing/packages/route.ts
// PHASE 2: API endpoint for fetching pricing configuration
import { NextResponse } from 'next/server';
import { getAllPackages, getPricingConfig } from '@/lib/config/pricing-config';

export async function GET() {
  try {
    const packages = getAllPackages();
    const config = getPricingConfig();

    return NextResponse.json({
      packages,
      currency: config.currency,
      customCredits: config.customCredits,
      version: config.version,
      lastUpdated: config.lastUpdated,
    });
  } catch (error) {
    console.error('Error fetching pricing packages:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing packages' }, { status: 500 });
  }
}
