import { type NextRequest, NextResponse } from 'next/server';
import { pb } from '@/lib/database/pocketbase';
import { buildPublishUrl, getDeploymentServerUrl } from '@/lib/domain-config';
import { isReservedSubdomain, isValidSubdomain } from '@/lib/generate-project-name';

/**
 * Publish a project to a subdomain
 * POST /api/subdomains/publish
 * Body: { projectId, subdomain, customDomain? }
 */
export async function POST(req: NextRequest) {
  try {
    const { projectId, subdomain, customDomain } = await req.json();

    // Validate required fields
    if (!projectId || !subdomain) {
      return NextResponse.json({ error: 'projectId and subdomain are required' }, { status: 400 });
    }

    // Validate subdomain format
    if (!isValidSubdomain(subdomain)) {
      return NextResponse.json(
        {
          error:
            'Invalid subdomain format. Must be 3-63 characters, lowercase letters, numbers, and hyphens only.',
        },
        { status: 400 }
      );
    }

    // Check if reserved
    if (isReservedSubdomain(subdomain)) {
      return NextResponse.json(
        { error: 'This subdomain is reserved and cannot be used.' },
        { status: 400 }
      );
    }

    // Check if subdomain is already taken by another project
    try {
      const existingProject = await pb
        .collection('projects')
        .getFirstListItem(`subdomain="${subdomain}" && id!="${projectId}"`);

      if (existingProject) {
        return NextResponse.json(
          { error: 'Subdomain is already taken by another project' },
          { status: 409 }
        );
      }
    } catch (error: any) {
      // 404 is expected when subdomain is available
      if (error?.status !== 404) {
        throw error;
      }
    }

    // Update project with publish information
    await pb.collection('projects').update(projectId, {
      subdomain,
      customDomain: customDomain || '',
      isPublished: true,
      publishedAt: new Date().toISOString(),
    });

    // Notify deployment server about the new subdomain
    try {
      const deploymentServerUrl = getDeploymentServerUrl();
      const response = await fetch(`${deploymentServerUrl}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, subdomain }),
      });

      if (!response.ok) {
        console.error('Failed to notify deployment server:', await response.text());
        // Don't fail the whole request if deployment server notification fails
      }
    } catch (error) {
      console.error('Error notifying deployment server:', error);
      // Continue anyway - the publish was successful in the database
    }

    // Build response URLs using environment-aware configuration
    const subdomainUrl = buildPublishUrl(subdomain, projectId);
    const customUrl = customDomain ? `https://${customDomain}` : null;

    return NextResponse.json({
      success: true,
      url: subdomainUrl,
      customUrl,
      subdomain,
      customDomain: customDomain || null,
      dnsInstructions: customDomain
        ? {
            records: [
              { type: 'A', name: '@', value: '[YOUR_SERVER_IP]' },
              { type: 'CNAME', name: 'www', value: 'vibebaba.com' },
            ],
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error publishing project:', error);
    return NextResponse.json(
      { error: 'Failed to publish project', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Unpublish a project
 * DELETE /api/subdomains/publish?projectId=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId parameter is required' }, { status: 400 });
    }

    // Update project to unpublish
    await pb.collection('projects').update(projectId, {
      isPublished: false,
      publishedAt: null,
    });

    // Notify deployment server to remove subdomain routing
    try {
      const deploymentServerUrl = getDeploymentServerUrl();
      const response = await fetch(`${deploymentServerUrl}/unpublish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        console.error('Failed to notify deployment server:', await response.text());
      }
    } catch (error) {
      console.error('Error notifying deployment server:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Project unpublished successfully',
    });
  } catch (error: any) {
    console.error('Error unpublishing project:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish project', details: error.message },
      { status: 500 }
    );
  }
}
