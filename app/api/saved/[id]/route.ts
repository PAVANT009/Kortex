import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { db } from "@/db";
import { savedReport } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await db
      .delete(savedReport)
      .where(eq(savedReport.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsaving report:", error);
    return NextResponse.json({ error: "Failed to unsave report" }, { status: 500 });
  }
}
