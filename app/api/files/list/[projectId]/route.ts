import { type NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { Collections, config } from '@/lib/config';
import { getAuthenticatedUser } from '@/lib/database/pocketbase-middleware';
import { sanitizeError } from '@/lib/database/pocketbase-utils';
import { log } from '@/lib/logger';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    log.info('Fetching file list', { projectId, userId: user.id });

    // Initialize PocketBase
    const pb = new PocketBase(config.POCKETBASE_URL);

    // Authenticate with PocketBase
    const authToken = request.headers.get('authorization')?.split(' ')[1];
    if (authToken) {
      pb.authStore.save(authToken, user);
    }

    // First, verify the user owns this project
    try {
      const project = await pb.collection(Collections.PROJECTS).getOne(projectId);
      if (project.userId !== user.id) {
        log.warn('User does not own project', {
          projectId,
          userId: user.id,
          ownerId: project.userId,
        });
        return NextResponse.json(
          { error: 'Forbidden: You do not own this project' },
          { status: 403 }
        );
      }
    } catch (error: any) {
      if (error.status === 404) {
        log.warn('Project not found', { projectId, userId: user.id });
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      log.error('Error fetching project', { projectId, userId: user.id }, error);
      throw error;
    }

    // Get all files for this project
    const files = await pb.collection(Collections.UPLOADED_FILES).getFullList({
      filter: `projectId = "${projectId}"`,
      sort: '-created',
    });

    log.info('Files fetched successfully', { projectId, count: files.length });

    // Map to include file URLs
    const filesWithUrls = files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileUrl: pb.files.getUrl(file, file.file),
      fileType: file.fileType,
      purpose: file.purpose,
      designAnalysis: file.designAnalysis,
      created: file.created,
      updated: file.updated,
    }));

    return NextResponse.json({
      files: filesWithUrls,
      count: filesWithUrls.length,
    });
  } catch (error: any) {
    log.error('Failed to list files', { projectId: (await params).projectId }, error);

    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: error.status || 500 }
    );
  }
}
