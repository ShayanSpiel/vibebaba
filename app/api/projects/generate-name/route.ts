import { NextRequest, NextResponse } from 'next/server';
import { generateProjectName } from '@/lib/generate-project-name';

/**
 * Generate an AI-powered project name
 * POST /api/projects/generate-name
 * Body: { description: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const projectName = await generateProjectName(description);

    return NextResponse.json({
      success: true,
      name: projectName
    });
  } catch (error: any) {
    console.error('Error generating project name:', error);
    return NextResponse.json(
      { error: 'Failed to generate project name', details: error.message },
      { status: 500 }
    );
  }
}
