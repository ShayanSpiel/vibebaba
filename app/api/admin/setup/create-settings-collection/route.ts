// app/api/admin/setup/create-settings-collection/route.ts
// One-time setup endpoint to create settings collection
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/admin-auth';
import { getAdminPb } from '@/lib/pocketbase-admin';

/**
 * POST /api/admin/setup/create-settings-collection
 * Creates the settings collection in PocketBase
 */
export async function POST(req: NextRequest) {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess(req);
    if (!adminCheck.allowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminPb = await getAdminPb();

    // Check if collection already exists
    try {
      await adminPb.collection('settings').getList(1, 1);
      return NextResponse.json({
        success: true,
        message: 'Settings collection already exists',
        alreadyExists: true,
      });
    } catch (error) {
      // Collection doesn't exist, continue to create it
    }

    // Create the collection using PocketBase API
    const collection = await adminPb.collections.create({
      name: 'settings',
      type: 'base',
      schema: [
        {
          name: 'key',
          type: 'text',
          required: true,
          options: {
            min: 1,
            max: 255,
          },
        },
        {
          name: 'value',
          type: 'json',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
          required: false,
          options: {
            max: 500,
          },
        },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_settings_key ON settings (key)',
      ],
      listRule: null, // Only admins can list
      viewRule: null, // Only admins can view
      createRule: null, // Only admins can create
      updateRule: null, // Only admins can update
      deleteRule: null, // Only admins can delete
    });

    return NextResponse.json({
      success: true,
      message: 'Settings collection created successfully',
      collection: {
        name: collection.name,
        type: collection.type,
        id: collection.id,
      },
    });
  } catch (error: any) {
    console.error('Error creating settings collection:', error);
    return NextResponse.json(
      {
        error: 'Failed to create settings collection',
        details: error.message || 'Unknown error',
        hint: 'You can also create it manually in PocketBase admin UI',
      },
      { status: 500 }
    );
  }
}
