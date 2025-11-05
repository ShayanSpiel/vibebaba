// app/api/memory/project-settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/pocketbase-middleware';
import { pb } from '@/lib/pocketbase';

/**
 * Store project settings in LangChain memory
 *
 * POST /api/memory/project-settings
 * Body: {
 *   projectId: string;
 *   projectName: string;
 *   prompt: string;
 *   stylingConfig: any;
 *   timestamp: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, projectName, prompt, stylingConfig, timestamp } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Store project settings in memory collection
    try {
      // Check if settings already exist for this project
      const existing = await pb.collection('project_settings_memory').getFullList({
        filter: `projectId = "${projectId}"`
      });

      const data = {
        projectId,
        userId: user.id,
        projectName: projectName || '',
        initialPrompt: prompt || '',
        stylingConfig: stylingConfig ? JSON.stringify(stylingConfig) : '{}',
        timestamp: timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existing.length > 0) {
        // Update existing record
        await pb.collection('project_settings_memory').update(existing[0].id, data);
        console.log(`[Memory] ✅ Updated project settings for ${projectId}`);
      } else {
        // Create new record
        await pb.collection('project_settings_memory').create(data);
        console.log(`[Memory] ✅ Created project settings for ${projectId}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Project settings stored successfully'
      });
    } catch (error: any) {
      console.error('[Memory] Failed to store project settings:', error);
      return NextResponse.json(
        { error: 'Failed to store project settings', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Memory] Project settings API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Retrieve project settings from LangChain memory
 *
 * GET /api/memory/project-settings?projectId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    try {
      console.log('[Memory] 🔍 Fetching settings for projectId:', projectId, 'userId:', user.id);

      const records = await pb.collection('project_settings_memory').getFullList({
        filter: `projectId = "${projectId}" && userId = "${user.id}"`
      });

      console.log('[Memory] 📦 Found', records.length, 'record(s)');

      if (records.length === 0) {
        // Return 200 with null data instead of 404 to avoid error logs
        // 404 is semantically correct, but causes unnecessary error spam in logs
        console.log('[Memory] ℹ️ No settings found for this project');
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No settings found for this project'
        });
      }

      const record = records[0];
      console.log('[Memory] 📄 Record found, parsing stylingConfig...');

      // Safely parse stylingConfig
      let parsedStylingConfig = {};
      try {
        if (typeof record.stylingConfig === 'string') {
          parsedStylingConfig = JSON.parse(record.stylingConfig);
        } else if (typeof record.stylingConfig === 'object') {
          parsedStylingConfig = record.stylingConfig || {};
        }
        console.log('[Memory] ✅ stylingConfig parsed successfully, keys:', Object.keys(parsedStylingConfig));
      } catch (parseError: any) {
        console.error('[Memory] ❌ Failed to parse stylingConfig:', parseError.message);
        console.error('[Memory] Raw stylingConfig type:', typeof record.stylingConfig);
        // Return empty config instead of failing
        parsedStylingConfig = {};
      }

      return NextResponse.json({
        success: true,
        data: {
          projectId: record.projectId,
          projectName: record.projectName,
          initialPrompt: record.initialPrompt,
          stylingConfig: parsedStylingConfig,
          timestamp: record.timestamp,
          updatedAt: record.updatedAt
        }
      });
    } catch (error: any) {
      console.error('[Memory] ❌ Failed to retrieve project settings:', error);
      console.error('[Memory] Error name:', error.name);
      console.error('[Memory] Error message:', error.message);
      console.error('[Memory] Error stack:', error.stack);
      return NextResponse.json(
        { error: 'Failed to retrieve project settings', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Memory] Project settings API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
