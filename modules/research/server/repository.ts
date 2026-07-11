import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { researchReport, researchRun, researchSource } from "@/db/research-schema";
import type { EvidenceDossier, ResearchSource } from "@/modules/research/schemas/evidence";
import type { InvestmentDecision, InvestmentReport } from "@/modules/research/schemas/report";

export type RecentResearchRun = {
  id: string;
  companyQuery: string;
  resolvedCompanyName: string | null;
  status: "completed";
  ticker: string | null;
  createdAt: string;
};

export type ResearchHistoryItem = {
  id: string;
  companyQuery: string;
  resolvedCompanyName: string | null;
  ticker: string | null;
  decision: InvestmentDecision | null;
  confidence: number | null;
  createdAt: string;
  completedAt: string | null;
};

export async function createResearchRun(
  companyQuery: string,
  userId?: string | null,
) {
  const id = crypto.randomUUID();
  const normalizedUserId = userId?.trim() || null;

  await db.insert(researchRun).values({
    companyQuery,
    id,
    status: "pending",
    userId: normalizedUserId,
  });

  return { id };
}

export async function completeResearchRun(params: {
  runId: string;
  companyName: string;
  ticker: string;
  llmModel: string | null;
  llmProvider: string;
}) {
  await db
    .update(researchRun)
    .set({
      completedAt: new Date(),
      llmModel: params.llmModel,
      llmProvider: params.llmProvider,
      resolvedCompanyName: params.companyName,
      status: "completed",
      ticker: params.ticker,
      updatedAt: new Date(),
    })
    .where(eq(researchRun.id, params.runId));
}

export async function failResearchRun(runId: string, errorMessage: string) {
  await db
    .update(researchRun)
    .set({
      errorMessage,
      status: "failed",
      updatedAt: new Date(),
    })
    .where(eq(researchRun.id, runId));
}

export async function saveResearchReport(params: {
  runId: string;
  evidence: EvidenceDossier;
  report: InvestmentReport;
  sources: ResearchSource[];
}) {
  const reportId = crypto.randomUUID();

  await db.insert(researchReport).values({
    companyName: params.report.companyName,
    confidence: params.report.decision.confidence,
    createdAt: new Date(),
    decision: params.report.decision.verdict,
    evidenceJson: params.evidence,
    id: reportId,
    reportJson: params.report,
    runId: params.runId,
    ticker: params.report.ticker,
  });

  if (params.sources.length > 0) {
    await db.insert(researchSource).values(
      params.sources.map((source) => ({
        excerpt: source.excerpt,
        id: `${params.runId}:${source.id}`,
        provider: source.provider,
        publishedAt: source.publishedAt ? new Date(source.publishedAt) : null,
        retrievedAt: new Date(source.retrievedAt),
        runId: params.runId,
        sourceType: source.type,
        title: source.title,
        url: source.url,
      })),
    );
  }

  return { reportId };
}

export async function getResearchResultByRunId(runId: string) {
  const runRows = await db
    .select({
      reportJson: researchReport.reportJson,
      runId: researchRun.id,
      status: researchRun.status,
      evidenceJson: researchReport.evidenceJson,
    })
    .from(researchRun)
    .leftJoin(researchReport, eq(researchReport.runId, researchRun.id))
    .where(eq(researchRun.id, runId))
    .limit(1);

  const row = runRows[0];
  if (!row || !row.reportJson || !row.evidenceJson) {
    return null;
  }

  return {
    evidence: row.evidenceJson as EvidenceDossier,
    report: row.reportJson as InvestmentReport,
    runId: row.runId,
    status: row.status,
  };
}

export async function getRecentCompletedRuns(
  limit = 6,
  userId?: string | null,
) {
  const conditions = [eq(researchRun.status, "completed")];
  const normalizedUserId = userId?.trim();

  if (normalizedUserId) {
    conditions.push(eq(researchRun.userId, normalizedUserId));
  }

  const rows = await db
    .select({
      companyQuery: researchRun.companyQuery,
      createdAt: researchRun.createdAt,
      id: researchRun.id,
      resolvedCompanyName: researchRun.resolvedCompanyName,
      status: researchRun.status,
      ticker: researchRun.ticker,
    })
    .from(researchRun)
    .where(and(...conditions))
    .orderBy(desc(researchRun.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    companyQuery: row.companyQuery,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    resolvedCompanyName: row.resolvedCompanyName,
    status: row.status as "completed",
    ticker: row.ticker,
  }));
}

export async function getResearchHistory(
  limit = 20,
  userId?: string | null,
) {
  const conditions = [eq(researchRun.status, "completed")];
  const normalizedUserId = userId?.trim();

  if (normalizedUserId) {
    conditions.push(eq(researchRun.userId, normalizedUserId));
  }

  const rows = await db
    .select({
      companyQuery: researchRun.companyQuery,
      completedAt: researchRun.completedAt,
      createdAt: researchRun.createdAt,
      decision: researchReport.decision,
      confidence: researchReport.confidence,
      id: researchRun.id,
      resolvedCompanyName: researchRun.resolvedCompanyName,
      ticker: researchRun.ticker,
    })
    .from(researchRun)
    .leftJoin(researchReport, eq(researchReport.runId, researchRun.id))
    .where(and(...conditions))
    .orderBy(desc(researchRun.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    companyQuery: row.companyQuery,
    completedAt: row.completedAt?.toISOString() ?? null,
    confidence: row.confidence,
    createdAt: row.createdAt.toISOString(),
    decision: row.decision,
    id: row.id,
    resolvedCompanyName: row.resolvedCompanyName,
    ticker: row.ticker,
  })) satisfies ResearchHistoryItem[];
}
