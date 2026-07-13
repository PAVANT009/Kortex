import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ZodError } from "zod";

import { getSession } from "@/lib/get-session";
import { db } from "@/db";
import { savedReport, researchReport, researchRun } from "@/db/schema";
import { savedReportRequestSchema } from "@/modules/research/schemas/input";

export async function GET(request: NextRequest) {
  void request;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const savedReports = await db
      .select({
        id: savedReport.id,
        runId: savedReport.runId,
        companyName: savedReport.companyName,
        ticker: savedReport.ticker,
        decision: savedReport.decision,
        savedAt: savedReport.savedAt,
        reportJson: researchReport.reportJson,
        createdAt: researchReport.createdAt,
      })
      .from(savedReport)
      .leftJoin(researchReport, eq(savedReport.runId, researchReport.runId))
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
    const payload = savedReportRequestSchema.parse(body);

    const reportRows = await db
      .select({
        companyName: researchReport.companyName,
        decision: researchReport.decision,
        runId: researchRun.id,
        ticker: researchReport.ticker,
      })
      .from(researchRun)
      .innerJoin(researchReport, eq(researchReport.runId, researchRun.id))
      .where(
        and(
          eq(researchRun.id, payload.runId),
          eq(researchRun.userId, session.user.id),
          eq(researchRun.status, "completed"),
        ),
      )
      .limit(1);

    const reportRow = reportRows[0];
    if (!reportRow) {
      return NextResponse.json(
        { error: "Research run not found" },
        { status: 404 },
      );
    }

    const existingRows = await db
      .select()
      .from(savedReport)
      .where(
        and(
          eq(savedReport.userId, session.user.id),
          eq(savedReport.runId, payload.runId),
        ),
      )
      .limit(1);

    const existing = existingRows[0];
    if (existing) {
      return NextResponse.json({ savedReport: existing });
    }

    const inserted = await db
      .insert(savedReport)
      .values({
        id: nanoid(),
        userId: session.user.id,
        runId: reportRow.runId,
        companyName: reportRow.companyName,
        ticker: reportRow.ticker,
        decision: reportRow.decision,
      })
      .onConflictDoNothing({
        target: [savedReport.userId, savedReport.runId],
      })
      .returning();

    const saved = inserted[0];
    if (saved) {
      return NextResponse.json({ savedReport: saved }, { status: 201 });
    }

    const duplicateRows = await db
      .select()
      .from(savedReport)
      .where(
        and(
          eq(savedReport.userId, session.user.id),
          eq(savedReport.runId, payload.runId),
        ),
      )
      .limit(1);

    const duplicate = duplicateRows[0];
    if (duplicate) {
      return NextResponse.json({ savedReport: duplicate });
    }

    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 500 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid research run." },
        { status: 400 },
      );
    }

    console.error("Error saving report:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
