import { NextRequest, NextResponse } from 'next/server';
import { pb, ensureAuth } from '@/lib/database/pocketbase';

// Helper to get localStorage key (server-side can't access it, but we use PocketBase)
const getFilePath = (collection: string) => `database/${collection}.json`;

/**
 * GET /api/db/[projectId]/[collection]
 * Get all records from a collection
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; collection: string }> }
) {
  try {
    const params = await context.params;
    const { projectId, collection } = params;

    console.log(`[DB API] 📖 GET ${projectId}/${collection}`);

    // Try to load auth, but don't fail if not available (iframe access)
    try {
      ensureAuth();
      console.log(`[DB API] ✅ Auth loaded successfully`);
    } catch (e) {
      console.log(`[DB API] ⚠️  No auth (iframe mode) - proceeding anyway`);
    }

    // Get the file from PocketBase project_files collection
    const filePath = getFilePath(collection);

    try {
      const files = await pb.collection('project_files').getFullList({
        filter: `projectId = "${projectId}" && path = "${filePath}"`,
      });

      if (files.length > 0) {
        const data = JSON.parse(files[0].content);
        console.log(`[DB API] ✅ Found ${data.length} records in ${collection}`);
        return NextResponse.json(data);
      }

      // No data found, return empty array
      console.log(`[DB API] 📭 No data found for ${collection}, returning empty array`);
      return NextResponse.json([]);
    } catch (pbError) {
      console.error('[DB API] PocketBase error:', pbError);
      // Return empty array on error
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('[DB API] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/db/[projectId]/[collection]
 * Add a new record to a collection
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; collection: string }> }
) {
  try {
    const params = await context.params;
    const { projectId, collection } = params;
    const record = await req.json();

    console.log(`[DB API] ➕ POST ${projectId}/${collection}`, record);

    // Try to load auth, but don't fail if not available (iframe access)
    try {
      ensureAuth();
      console.log(`[DB API] ✅ Auth loaded successfully`);
    } catch (e) {
      console.log(`[DB API] ⚠️  No auth (iframe mode) - proceeding anyway`);
    }

    // Generate ID if not provided
    if (!record.id) {
      record.id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const filePath = getFilePath(collection);

    // Get existing data
    let data: any[] = [];
    try {
      const files = await pb.collection('project_files').getFullList({
        filter: `projectId = "${projectId}" && path = "${filePath}"`,
      });

      if (files.length > 0) {
        data = JSON.parse(files[0].content);
      }
    } catch (e) {
      // No existing data, start with empty array
      console.log('[DB API] No existing data, creating new collection');
    }

    // Add the new record
    data.push(record);

    // Save back to PocketBase
    try {
      const files = await pb.collection('project_files').getFullList({
        filter: `projectId = "${projectId}" && path = "${filePath}"`,
      });

      const content = JSON.stringify(data);

      if (files.length > 0) {
        // Update existing file
        const updated = await pb.collection('project_files').update(files[0].id, {
          content: content,
          size: content.length,
        });
        console.log(`[DB API] ✅ Updated ${collection} with new record - PocketBase ID:`, updated.id);
        console.log(`[DB API] 📡 PocketBase should broadcast this change via WebSocket`);
      } else {
        // Create new file
        const created = await pb.collection('project_files').create({
          projectId: projectId,
          path: filePath,
          content: content,
          encoding: 'utf-8',
          size: content.length,
        });
        console.log(`[DB API] ✅ Created ${collection} with first record - PocketBase ID:`, created.id);
        console.log(`[DB API] 📡 PocketBase should broadcast this change via WebSocket`);
      }

      return NextResponse.json(record);
    } catch (pbError) {
      console.error('[DB API] PocketBase save error:', pbError);
      return NextResponse.json({ error: 'Failed to save to database' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[DB API] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
