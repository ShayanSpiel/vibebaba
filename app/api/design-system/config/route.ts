/**
 * Design System Configuration API
 *
 * GET /api/design-system/config - Get current configuration
 * POST /api/design-system/config - Update configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  COMPONENT_LIBRARIES,
  getActiveLibraries,
  getConfigSummary,
  toggleLibrary,
  toggleLibraryCategory,
  applyPreset,
  PRESETS,
} from '@/lib/components/component-library-config';

// GET - Get current configuration
export async function GET(request: NextRequest) {
  try {
    const activeLibraries = getActiveLibraries();
    const summary = getConfigSummary();

    return NextResponse.json({
      success: true,
      libraries: COMPONENT_LIBRARIES,
      activeLibraries: activeLibraries.map(lib => ({
        id: lib.id,
        name: lib.name,
        priority: lib.priority,
        enabled: lib.enabled,
        categories: lib.categories,
      })),
      summary,
      availablePresets: Object.keys(PRESETS),
    });
  } catch (error) {
    console.error('[DesignSystemAPI] Error getting config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Update configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, libraryId, category, enabled, preset } = body;

    switch (action) {
      case 'toggleLibrary':
        if (!libraryId) {
          return NextResponse.json(
            { success: false, error: 'libraryId is required' },
            { status: 400 }
          );
        }
        if (typeof enabled !== 'boolean') {
          return NextResponse.json(
            { success: false, error: 'enabled (boolean) is required' },
            { status: 400 }
          );
        }
        toggleLibrary(libraryId, enabled);
        break;

      case 'toggleCategory':
        if (!libraryId || !category) {
          return NextResponse.json(
            { success: false, error: 'libraryId and category are required' },
            { status: 400 }
          );
        }
        if (typeof enabled !== 'boolean') {
          return NextResponse.json(
            { success: false, error: 'enabled (boolean) is required' },
            { status: 400 }
          );
        }
        toggleLibraryCategory(libraryId, category, enabled);
        break;

      case 'applyPreset':
        if (!preset) {
          return NextResponse.json(
            { success: false, error: 'preset is required' },
            { status: 400 }
          );
        }
        if (!(preset in PRESETS)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid preset. Available: ${Object.keys(PRESETS).join(', ')}`,
            },
            { status: 400 }
          );
        }
        applyPreset(preset as keyof typeof PRESETS);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: toggleLibrary, toggleCategory, or applyPreset',
          },
          { status: 400 }
        );
    }

    // Return updated config
    const activeLibraries = getActiveLibraries();
    const summary = getConfigSummary();

    return NextResponse.json({
      success: true,
      message: `Action '${action}' completed successfully`,
      libraries: COMPONENT_LIBRARIES,
      activeLibraries: activeLibraries.map(lib => ({
        id: lib.id,
        name: lib.name,
        priority: lib.priority,
        enabled: lib.enabled,
        categories: lib.categories,
      })),
      summary,
    });
  } catch (error) {
    console.error('[DesignSystemAPI] Error updating config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
