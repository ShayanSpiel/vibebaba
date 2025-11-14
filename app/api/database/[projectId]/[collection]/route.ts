import { NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/database/pocketbase";
import { escapeFilterValue, sanitizeError, validateCollectionName } from "@/lib/database/pocketbase-utils";

/**
 * GET /api/database/[projectId]/[collection]
 *
 * Fetch all records from a collection for a specific project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; collection: string }> }
) {
  const { projectId, collection } = await params;
  try {
    // Validate collection name to prevent injection
    validateCollectionName(collection);

    // Verify project exists
    try {
      await pb.collection('projects').getOne(projectId);
    } catch (error) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get all records from collection for this project with escaped filter
    const records = await pb.collection(collection).getFullList({
      filter: `projectId = "${escapeFilterValue(projectId)}"`,
      sort: '-created'
    });

    return NextResponse.json({ items: records });

  } catch (error: any) {
    console.error(`[Database API] Error fetching ${collection}:`, error);

    return NextResponse.json(
      {
        error: sanitizeError(error),
        collection
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/database/[projectId]/[collection]
 *
 * Create a new record in a collection
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; collection: string }> }
) {
  const { projectId, collection } = await params;
  try {
    // Validate collection name to prevent injection
    validateCollectionName(collection);

    const data = await req.json();

    // Verify project exists
    try {
      await pb.collection('projects').getOne(projectId);
    } catch (error) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Add projectId to record
    const record = await pb.collection(collection).create({
      ...data,
      projectId
    });

    console.log(`[Database API] Created record in ${collection}:`, record.id);

    return NextResponse.json(record);

  } catch (error: any) {
    console.error(`[Database API] Error creating record in ${collection}:`, error);

    return NextResponse.json(
      {
        error: sanitizeError(error),
        collection
      },
      { status: 500 }
    );
  }
}
