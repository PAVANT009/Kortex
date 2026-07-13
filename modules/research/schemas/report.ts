import { z } from "zod";

import { evidenceDossierSchema } from "./evidence";

export const investmentDecisionSchema = z.enum(["INVEST", "PASS"]);

export const citedTextBlockSchema = z.object({
  text: z.string().min(1),
  sourceIds: z.array(z.string()).default([]),
});

export const citedInsightSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  sourceIds: z.array(z.string()).default([]),
});

export const citedRiskSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  detail: z.string().min(1),
  sourceIds: z.array(z.string()).default([]),
});

export const investmentReportBodySchema = z.object({
  executiveSummary: citedTextBlockSchema,
  companySummary: citedTextBlockSchema,
  financialAnalysis: citedTextBlockSchema,
  newsSummary: citedTextBlockSchema,
  strengths: z.array(citedInsightSchema).min(2).max(5),
  weaknesses: z.array(citedInsightSchema).min(1).max(5),
  risks: z.array(citedRiskSchema).min(3).max(6),
  bullCase: z.array(citedInsightSchema).min(2).max(4),
  bearCase: z.array(citedInsightSchema).min(2).max(4),
  followUpQuestions: z.array(z.string().min(1)).min(2).max(4),
  decision: z.object({
    verdict: investmentDecisionSchema,
    confidence: z.number().int().min(0).max(100),
    rationale: z.string().min(1),
    sourceIds: z.array(z.string()).min(1),
  }),
});

export const reportGenerationSchema = z.object({
  mode: z.enum(["llm", "heuristic"]),
  provider: z.string(),
  model: z.string().nullable().default(null),
  note: z.string().nullable().default(null),
});

export const investmentReportSchema = investmentReportBodySchema.extend({
  companyName: z.string().min(1),
  ticker: z.string().min(1),
  generatedAt: z.string(),
  generation: reportGenerationSchema,
});

export const researchResponseSchema = z.object({
  runId: z.string(),
  report: investmentReportSchema,
  evidence: evidenceDossierSchema,
});

export type InvestmentDecision = z.infer<typeof investmentDecisionSchema>;
export type InvestmentReportBody = z.infer<typeof investmentReportBodySchema>;
export type InvestmentReport = z.infer<typeof investmentReportSchema>;
export type ResearchResponse = z.infer<typeof researchResponseSchema>;
