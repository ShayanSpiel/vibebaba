import { type NextRequest, NextResponse } from 'next/server';
import { ensureAuth, pb } from '@/lib/database/pocketbase';

// Helper to get file path
const getFilePath = (collection: string) => `database/${collection}.json`;

/**
 * PATCH /api/db/[projectId]/[collection]/[id]
 * Update a specific record in a collection
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; collection: string; id: string }> }
) {
  try {
    const params = await context.params;
    const { projectId, collection, id } = params;
    const updates = await req.json();

    console.log(`[DB API] 🔄 PATCH ${projectId}/${collection}/${id}`, updates);

    // Try to load auth, but don't fail if not available (iframe access)
    try {
      ensureAuth();
      console.log(`[DB API] ✅ Auth loaded successfully`);
    } catch (e) {
      console.log(`[DB API] ⚠️  No auth (iframe mode) - proceeding anyway`);
    }

    const filePath = getFilePath(collection);

    // Get existing data
    try {
      const files = await pb.collection('project_files').getFullList({
        filter: `projectId = "${projectId}" && path = "${filePath}"`,
      });

      if (files.length === 0) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }

      const data = JSON.parse(files[0].content);

      // Find and update the record
      const index = data.findIndex((r: any) => r.id === id);
      if (index === -1) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      // Update the record
      data[index] = { ...data[index], ...updates };
      const updatedRecord = data[index];

      // Save back to PocketBase
      const content = JSON.stringify(data);
      const updated = await pb.collection('project_files').update(files[0].id, {
        content: content,
        size: content.length,
      });

      console.log(`[DB API] ✅ Updated record ${id} in ${collection} - PocketBase ID:`, updated.id);
      console.log(`[DB API] 📡 PocketBase should broadcast this change via WebSocket`);
      return NextResponse.json(updatedRecord);
    } catch (pbError) {
      console.error('[DB API] PocketBase error:', pbError);
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[DB API] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/db/[projectId]/[collection]/[id]
 * Delete a specific record from a collection
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ projectId: string; collection: string; id: string }> }
) {
  try {
    const params = await context.params;
    const { projectId, collection, id } = params;

    console.log(`[DB API] 🗑️  DELETE ${projectId}/${collection}/${id}`);

    // Try to load auth, but don't fail if not available (iframe access)
    try {
      ensureAuth();
      console.log(`[DB API] ✅ Auth loaded successfully`);
    } catch (e) {
      console.log(`[DB API] ⚠️  No auth (iframe mode) - proceeding anyway`);
    }

    const filePath = getFilePath(collection);

    // Get existing data
    try {
      const files = await pb.collection('project_files').getFullList({
        filter: `projectId = "${projectId}" && path = "${filePath}"`,
      });

      if (files.length === 0) {
        return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
      }

      let data = JSON.parse(files[0].content);

      // Filter out the record
      const originalLength = data.length;
      data = data.filter((r: any) => r.id !== id);

      if (data.length === originalLength) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      // Save back to PocketBase
      const content = JSON.stringify(data);
      const updated = await pb.collection('project_files').update(files[0].id, {
        content: content,
        size: content.length,
      });

      console.log(
        `[DB API] ✅ Deleted record ${id} from ${collection} - PocketBase ID:`,
        updated.id
      );
      console.log(`[DB API] 📡 PocketBase should broadcast this change via WebSocket`);
      return NextResponse.json({ success: true });
    } catch (pbError) {
      console.error('[DB API] PocketBase error:', pbError);
      return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[DB API] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
