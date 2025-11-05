import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/pocketbase-middleware';
import PocketBase from 'pocketbase';
import { sanitizeError } from '@/lib/pocketbase-utils';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

/**
 * GET /api/files/list/[projectId]
 * List all files for a specific project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // Initialize PocketBase
    const pb = new PocketBase(POCKETBASE_URL);

    // Authenticate with PocketBase
    const authToken = request.headers.get('authorization')?.split(' ')[1];
    if (authToken) {
      pb.authStore.save(authToken, user);
    }

    // First, verify the user owns this project
    try {
      const project = await pb.collection('projects').getOne(projectId);
      if (project.userId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You do not own this project' },
          { status: 403 }
        );
      }
    } catch (error: any) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get all files for this project
    const files = await pb.collection('uploaded_files').getFullList({
      filter: `projectId = "${projectId}"`,
      sort: '-created'
    });

    // Map to include file URLs
    const filesWithUrls = files.map(file => ({
      id: file.id,
      fileName: file.fileName,
      fileUrl: pb.files.getUrl(file, file.file),
      fileType: file.fileType,
      purpose: file.purpose,
      designAnalysis: file.designAnalysis,
      created: file.created,
      updated: file.updated
    }));

    return NextResponse.json({
      files: filesWithUrls,
      count: filesWithUrls.length
    });

  } catch (error: any) {
    console.error('[File List] Error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: error.status || 500 }
    );
  }
}
