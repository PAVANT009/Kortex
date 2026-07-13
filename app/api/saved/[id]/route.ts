import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { savedReport } from "@/db/schema";
import { getSession } from "@/lib/get-session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  void request;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const deleted = await db
      .delete(savedReport)
      .where(
        and(
          eq(savedReport.id, id),
          eq(savedReport.userId, session.user.id),
        ),
      )
      .returning({ id: savedReport.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Saved report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsaving report:", error);
    return NextResponse.json({ error: "Failed to unsave report" }, { status: 500 });
  }
}
