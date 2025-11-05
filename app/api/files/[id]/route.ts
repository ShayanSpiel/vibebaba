import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/pocketbase-middleware';
import PocketBase from 'pocketbase';
import { sanitizeError } from '@/lib/pocketbase-utils';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

/**
 * GET /api/files/[id]
 * Retrieve a file by ID (redirects to PocketBase file URL)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Initialize PocketBase
    const pb = new PocketBase(POCKETBASE_URL);

    // Authenticate with PocketBase
    const authToken = request.headers.get('authorization')?.split(' ')[1];
    if (authToken) {
      pb.authStore.save(authToken, user);
    }

    // Get the file record
    const record = await pb.collection('uploaded_files').getOne(id);

    // Check if user owns this file
    if (record.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this file' },
        { status: 403 }
      );
    }

    // Get file URL from PocketBase
    const fileUrl = pb.files.getUrl(record, record.file);

    // Redirect to the file URL
    return NextResponse.redirect(fileUrl);

  } catch (error: any) {
    console.error('[File GET] Error:', error);

    if (error.status === 404) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to retrieve file' },
      { status: error.status || 500 }
    );
  }
}

/**
 * PATCH /api/files/[id]
 * Update file metadata (e.g., purpose)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();

    // Initialize PocketBase
    const pb = new PocketBase(POCKETBASE_URL);

    // Authenticate with PocketBase
    const authToken = request.headers.get('authorization')?.split(' ')[1];
    if (authToken) {
      pb.authStore.save(authToken, user);
    }

    // Get the file record to verify ownership
    const record = await pb.collection('uploaded_files').getOne(id);

    // Check if user owns this file
    if (record.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this file' },
        { status: 403 }
      );
    }

    // Validate purpose if it's being updated
    if (body.purpose) {
      const validPurposes = ['asset', 'design-reference', 'both', 'pending'];
      if (!validPurposes.includes(body.purpose)) {
        return NextResponse.json(
          { error: 'Invalid purpose. Must be one of: asset, design-reference, both, pending' },
          { status: 400 }
        );
      }
    }

    // Update the record
    const updatedRecord = await pb.collection('uploaded_files').update(id, body);

    // Get the file URL
    const fileUrl = pb.files.getUrl(updatedRecord, updatedRecord.file);

    // Return updated record
    return NextResponse.json({
      id: updatedRecord.id,
      fileName: updatedRecord.fileName,
      fileUrl: fileUrl,
      fileType: updatedRecord.fileType,
      purpose: updatedRecord.purpose,
      designAnalysis: updatedRecord.designAnalysis,
      created: updatedRecord.created,
      updated: updatedRecord.updated
    });

  } catch (error: any) {
    console.error('[File PATCH] Error:', error);

    if (error.status === 404) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update file' },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE /api/files/[id]
 * Delete a file by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // Initialize PocketBase
    const pb = new PocketBase(POCKETBASE_URL);

    // Authenticate with PocketBase
    const authToken = request.headers.get('authorization')?.split(' ')[1];
    if (authToken) {
      pb.authStore.save(authToken, user);
    }

    // Get the file record to verify ownership
    const record = await pb.collection('uploaded_files').getOne(id);

    // Check if user owns this file
    if (record.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this file' },
        { status: 403 }
      );
    }

    // Delete the record (this will also delete the file)
    await pb.collection('uploaded_files').delete(id);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error: any) {
    console.error('[File DELETE] Error:', error);

    if (error.status === 404) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: error.status || 500 }
    );
  }
}
