import { type NextRequest, NextResponse } from 'next/server';
import { pb } from '@/lib/database/pocketbase';
import { isReservedSubdomain, isValidSubdomain } from '@/lib/generate-project-name';

/**
 * Check if a subdomain is available
 * GET /api/subdomains/check?subdomain=my-app
 */
export async function GET(req: NextRequest) {
  try {
    const subdomain = req.nextUrl.searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain parameter is required' }, { status: 400 });
    }

    // Validate subdomain format
    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json(
        {
          available: false,
          error:
            'Invalid subdomain format. Must be 3-63 characters, lowercase letters, numbers, and hyphens only.',
        },
        { status: 200 }
      );
    }

    // Check if reserved
    if (isReservedSubdomain(subdomain)) {
      return NextResponse.json(
        {
          available: false,
          error: 'This subdomain is reserved and cannot be used.',
        },
        { status: 200 }
      );
    }

    // Check if already taken by another project
    try {
      const existingProject = await pb
        .collection('projects')
        .getFirstListItem(`subdomain="${subdomain}"`);

      // Subdomain is taken
      return NextResponse.json({
        available: false,
        error: 'This subdomain is already taken.',
      });
    } catch (error: any) {
      // 404 means subdomain is available
      if (error?.status === 404) {
        return NextResponse.json({
          available: true,
          subdomain,
        });
      }

      // Other errors
      throw error;
    }
  } catch (error: any) {
    console.error('Error checking subdomain availability:', error);
    return NextResponse.json(
      { error: 'Failed to check subdomain availability', details: error.message },
      { status: 500 }
    );
  }
}
