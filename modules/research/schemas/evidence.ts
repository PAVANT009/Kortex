import { z } from "zod";

export const researchSourceSchema = z.object({
  id: z.string(),
  type: z.enum(["profile", "financial", "news"]),
  provider: z.string(),
  title: z.string(),
  url: z.string(),
  publishedAt: z.string().nullable().default(null),
  retrievedAt: z.string(),
  excerpt: z.string().default(""),
});

export const resolvedCompanySchema = z.object({
  query: z.string(),
  symbol: z.string(),
  shortName: z.string(),
  longName: z.string().nullable().default(null),
  exchange: z.string().nullable().default(null),
  quoteType: z.string().nullable().default(null),
  sector: z.string().nullable().default(null),
  industry: z.string().nullable().default(null),
  score: z.number(),
});

export const financialPointSchema = z.object({
  date: z.string(),
  periodType: z.string(),
  revenue: z.number().nullable().default(null),
  netIncome: z.number().nullable().default(null),
  operatingCashFlow: z.number().nullable().default(null),
  freeCashFlow: z.number().nullable().default(null),
  totalAssets: z.number().nullable().default(null),
  totalDebt: z.number().nullable().default(null),
  cashAndCashEquivalents: z.number().nullable().default(null),
  stockholdersEquity: z.number().nullable().default(null),
  currentAssets: z.number().nullable().default(null),
  currentLiabilities: z.number().nullable().default(null),
});

export const newsArticleSchema = z.object({
  sourceId: z.string(),
  title: z.string(),
  publisher: z.string(),
  link: z.string(),
  publishedAt: z.string().nullable().default(null),
  summary: z.string(),
  relatedTickers: z.array(z.string()).default([]),
});

export const companySnapshotSchema = z.object({
  currency: z.string().nullable().default(null),
  regularMarketPrice: z.number().nullable().default(null),
  marketCap: z.number().nullable().default(null),
  trailingPE: z.number().nullable().default(null),
  forwardPE: z.number().nullable().default(null),
  dividendYield: z.number().nullable().default(null),
  revenueGrowth: z.number().nullable().default(null),
  profitMargins: z.number().nullable().default(null),
  operatingMargins: z.number().nullable().default(null),
  currentRatio: z.number().nullable().default(null),
  debtToEquity: z.number().nullable().default(null),
  returnOnEquity: z.number().nullable().default(null),
  freeCashflow: z.number().nullable().default(null),
  operatingCashflow: z.number().nullable().default(null),
  totalCash: z.number().nullable().default(null),
  totalDebt: z.number().nullable().default(null),
  totalRevenue: z.number().nullable().default(null),
  grossMargins: z.number().nullable().default(null),
  recommendationKey: z.string().nullable().default(null),
  recommendationMean: z.number().nullable().default(null),
});

export const evidenceDossierSchema = z.object({
  company: z.object({
    query: z.string(),
    name: z.string(),
    ticker: z.string(),
    exchange: z.string().nullable().default(null),
    currency: z.string().nullable().default(null),
    sector: z.string().nullable().default(null),
    industry: z.string().nullable().default(null),
    website: z.string().nullable().default(null),
    employees: z.number().nullable().default(null),
    country: z.string().nullable().default(null),
    longBusinessSummary: z.string().nullable().default(null),
  }),
  snapshot: companySnapshotSchema,
  annualFinancials: z.array(financialPointSchema),
  quarterlyFinancials: z.array(financialPointSchema),
  news: z.array(newsArticleSchema),
  sources: z.array(researchSourceSchema),
});

export type ResearchSource = z.infer<typeof researchSourceSchema>;
export type ResolvedCompany = z.infer<typeof resolvedCompanySchema>;
export type FinancialPoint = z.infer<typeof financialPointSchema>;
export type NewsArticle = z.infer<typeof newsArticleSchema>;
export type CompanySnapshot = z.infer<typeof companySnapshotSchema>;
export type EvidenceDossier = z.infer<typeof evidenceDossierSchema>;
