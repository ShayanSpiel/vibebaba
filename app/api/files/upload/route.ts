import { type NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { getAuthenticatedUser } from '@/lib/database/pocketbase-middleware';
import { RateLimiter, sanitizeError } from '@/lib/database/pocketbase-utils';

// Rate limiter: 20 file uploads per minute per user
const uploadRateLimiter = new RateLimiter(60000, 20);

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Allowed file types and their max sizes
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    if (!uploadRateLimiter.checkLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const purpose = (formData.get('purpose') as string) || 'pending';

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // projectId is optional for homepage/session uploads
    // If not provided, file will be stored temporarily

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: images (JPEG, PNG, GIF, WebP, SVG) and PDF' },
        { status: 400 }
      );
    }

    // Validate purpose
    const validPurposes = ['asset', 'design-reference', 'both', 'pending'];
    if (!validPurposes.includes(purpose)) {
      return NextResponse.json(
        { error: 'Invalid purpose. Must be one of: asset, design-reference, both, pending' },
        { status: 400 }
      );
    }

    // Initialize PocketBase
    const pb = new PocketBase(POCKETBASE_URL);

    // Authenticate with PocketBase using the user's auth token from the request
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        // Extract token from "Bearer {json}" format
        const authData = JSON.parse(authHeader.replace('Bearer ', ''));
        if (authData.token) {
          pb.authStore.save(authData.token, authData.model || user);
        }
      } catch (e) {
        console.warn('[Upload] Failed to parse auth header, continuing without PB auth:', e);
      }
    }

    // Create the uploaded file record
    const uploadFormData = new FormData();
    uploadFormData.append('userId', user.id);
    uploadFormData.append('fileName', file.name);
    uploadFormData.append('fileType', file.type);
    uploadFormData.append('purpose', purpose);
    uploadFormData.append('file', file);

    // projectId is optional - only add if provided
    if (projectId && projectId.trim().length > 0) {
      uploadFormData.append('projectId', projectId);
    }

    console.log('[Upload] Creating record for user:', user.id, 'projectId:', projectId || 'none');
    console.log(
      '[Upload] PB auth valid:',
      pb.authStore.isValid,
      'token:',
      pb.authStore.token ? 'present' : 'missing'
    );

    const record = await pb.collection('uploaded_files').create(uploadFormData);

    console.log('[Upload] ✅ Record created:', record.id);

    // Get the file URL
    const fileUrl = pb.files.getUrl(record, record.file);

    // Return success response
    return NextResponse.json(
      {
        id: record.id,
        fileName: record.fileName,
        fileUrl: fileUrl,
        fileType: record.fileType,
        purpose: record.purpose,
        created: record.created,
        updated: record.updated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[File Upload] Error:', error);

    // Handle specific errors
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Collection not found. Please run database migrations.' },
        { status: 500 }
      );
    }

    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Permission denied. You do not have access to this project.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'File upload failed' },
      { status: error.status || 500 }
    );
  }
}
