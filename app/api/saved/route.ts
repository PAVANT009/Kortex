import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { db } from "@/db";
import { savedReport, researchReport, researchRun } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const savedReports = await db
      .select({
        id: savedReport.id,
        reportId: savedReport.reportId,
        runId: savedReport.runId,
        companyName: savedReport.companyName,
        ticker: savedReport.ticker,
        decision: savedReport.decision,
        savedAt: savedReport.savedAt,
        reportJson: researchReport.reportJson,
        createdAt: researchReport.createdAt,
      })
      .from(savedReport)
      .leftJoin(researchReport, eq(savedReport.reportId, researchReport.id))
      .where(eq(savedReport.userId, session.user.id))
      .orderBy(desc(savedReport.savedAt));

    return NextResponse.json({ savedReports });
  } catch (error) {
    console.error("Error fetching saved reports:", error);
    return NextResponse.json({ error: "Failed to fetch saved reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { reportId, runId, companyName, ticker, decision } = body;

    if (!reportId || !runId || !companyName || !ticker || !decision) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if already saved
    const existing = await db
      .select()
      .from(savedReport)
      .where(eq(savedReport.reportId, reportId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Report already saved" }, { status: 409 });
    }

    const saved = await db
      .insert(savedReport)
      .values({
        id: nanoid(),
        userId: session.user.id,
        reportId,
        runId,
        companyName,
        ticker,
        decision,
      })
      .returning();

    return NextResponse.json({ savedReport: saved[0] }, { status: 201 });
  } catch (error) {
    console.error("Error saving report:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
