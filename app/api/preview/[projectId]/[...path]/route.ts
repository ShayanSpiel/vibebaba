import { NextRequest, NextResponse } from "next/server";

/**
 * Virtual file server for project previews
 * Serves files from localStorage-stored project files
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; path: string[] }> }
) {
  try {
    const { projectId, path } = await params;
    const filePath = path.join('/') || 'index.html';

    // Get project data from localStorage (via client)
    // Since this is a server route, we'll return a response that the client can intercept

    // For now, redirect to a client-side handler
    return NextResponse.json({
      error: "This endpoint requires client-side file fetching",
      projectId,
      filePath
    }, { status: 400 });

  } catch (error) {
    console.error("Error serving preview file:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
