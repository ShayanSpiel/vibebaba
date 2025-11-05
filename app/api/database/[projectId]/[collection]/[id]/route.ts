import { NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/pocketbase";

/**
 * PATCH /api/database/[projectId]/[collection]/[id]
 *
 * Update an existing record
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; collection: string; id: string }> }
) {
  const { projectId, collection, id } = await params;
  try {
    const updates = await req.json();

    // Verify project exists
    try {
      await pb.collection('projects').getOne(projectId);
    } catch (error) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Verify record exists and belongs to this project
    const existing = await pb.collection(collection).getOne(id);
    if (existing.projectId !== projectId) {
      return NextResponse.json(
        { error: "Record does not belong to this project" },
        { status: 403 }
      );
    }

    // Update the record
    const updated = await pb.collection(collection).update(id, updates);

    console.log(`[Database API] Updated record in ${collection}:`, id);

    return NextResponse.json(updated);

  } catch (error: any) {
    console.error(`[Database API] Error updating record in ${collection}:`, error);

    return NextResponse.json(
      {
        error: error.message || "Failed to update record",
        collection,
        id
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/database/[projectId]/[collection]/[id]
 *
 * Delete a record
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; collection: string; id: string }> }
) {
  const { projectId, collection, id } = await params;
  try {

    // Verify project exists
    try {
      await pb.collection('projects').getOne(projectId);
    } catch (error) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Verify record exists and belongs to this project
    const existing = await pb.collection(collection).getOne(id);
    if (existing.projectId !== projectId) {
      return NextResponse.json(
        { error: "Record does not belong to this project" },
        { status: 403 }
      );
    }

    // Delete the record
    await pb.collection(collection).delete(id);

    console.log(`[Database API] Deleted record from ${collection}:`, id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(`[Database API] Error deleting record from ${collection}:`, error);

    return NextResponse.json(
      {
        error: error.message || "Failed to delete record",
        collection,
        id
      },
      { status: 500 }
    );
  }
}
