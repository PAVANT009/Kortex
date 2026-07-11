import {
  companySnapshotSchema,
  evidenceDossierSchema,
  financialPointSchema,
  newsArticleSchema,
  researchSourceSchema,
  type EvidenceDossier,
  type FinancialPoint,
  type ResearchSource,
  type ResolvedCompany,
} from "@/modules/research/schemas/evidence";

import { yahooFinance } from "../providers/yahoo";

type FundamentalsPointLike = {
  date: Date;
  periodType: string;
  [key: string]: unknown;
};

function yahooQuoteUrl(symbol: string) {
  return `https://finance.yahoo.com/quote/${symbol}`;
}

function yahooFinancialsUrl(symbol: string) {
  return `https://finance.yahoo.com/quote/${symbol}/financials`;
}

function toIsoDate(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return null;
}

function normalizeFinancialPoint(
  point: FundamentalsPointLike,
): FinancialPoint {
  return financialPointSchema.parse({
    cashAndCashEquivalents:
      "cashAndCashEquivalents" in point ? point.cashAndCashEquivalents ?? null : null,
    currentAssets: "currentAssets" in point ? point.currentAssets ?? null : null,
    currentLiabilities:
      "currentLiabilities" in point ? point.currentLiabilities ?? null : null,
    date: point.date.toISOString(),
    freeCashFlow: "freeCashFlow" in point ? point.freeCashFlow ?? null : null,
    netIncome: "netIncome" in point ? point.netIncome ?? null : null,
    operatingCashFlow:
      "operatingCashFlow" in point ? point.operatingCashFlow ?? null : null,
    periodType: point.periodType,
    revenue: "totalRevenue" in point ? point.totalRevenue ?? null : null,
    stockholdersEquity:
      "stockholdersEquity" in point ? point.stockholdersEquity ?? null : null,
    totalAssets: "totalAssets" in point ? point.totalAssets ?? null : null,
    totalDebt: "totalDebt" in point ? point.totalDebt ?? null : null,
  });
}

function normalizeNews(
  symbol: string,
  rawNews: Array<{
    link: string;
    providerPublishTime?: Date;
    publisher: string;
    relatedTickers?: string[];
    title: string;
    uuid: string;
  }>,
) {
  return rawNews.map((article, index) =>
    newsArticleSchema.parse({
      link: article.link,
      publishedAt: toIsoDate(article.providerPublishTime),
      publisher: article.publisher,
      relatedTickers: article.relatedTickers ?? [symbol],
      sourceId: `news-${index + 1}`,
      summary: article.title,
      title: article.title,
    }),
  );
}

function buildSources(
  symbol: string,
  news: ReturnType<typeof normalizeNews>,
): ResearchSource[] {
  const retrievedAt = new Date().toISOString();
  const sources: ResearchSource[] = [
    researchSourceSchema.parse({
      excerpt: "Yahoo Finance quote summary data for company profile, market data, and valuation fields.",
      id: "profile-1",
      provider: "Yahoo Finance",
      publishedAt: null,
      retrievedAt,
      title: `Yahoo Finance profile for ${symbol}`,
      type: "profile",
      url: yahooQuoteUrl(symbol),
    }),
    researchSourceSchema.parse({
      excerpt: "Yahoo Finance fundamentals time series covering annual and quarterly financial statement data.",
      id: "financial-1",
      provider: "Yahoo Finance",
      publishedAt: null,
      retrievedAt,
      title: `Yahoo Finance fundamentals for ${symbol}`,
      type: "financial",
      url: yahooFinancialsUrl(symbol),
    }),
  ];

  for (const article of news) {
    sources.push(
      researchSourceSchema.parse({
        excerpt: article.summary,
        id: article.sourceId,
        provider: article.publisher,
        publishedAt: article.publishedAt,
        retrievedAt,
        title: article.title,
        type: "news",
        url: article.link,
      }),
    );
  }

  return sources;
}

function sortNewestFirst(points: FinancialPoint[]) {
  return [...points].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function fetchEvidence(
  resolution: ResolvedCompany,
): Promise<EvidenceDossier> {
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - 4);

  const [quoteSummary, annualFinancials, quarterlyFinancials, newsSearch] =
    await Promise.all([
      yahooFinance.quoteSummary(resolution.symbol, {
        modules: [
          "assetProfile",
          "defaultKeyStatistics",
          "financialData",
          "price",
          "summaryDetail",
        ],
      }),
      yahooFinance.fundamentalsTimeSeries(resolution.symbol, {
        module: "all",
        period1,
        type: "annual",
      }),
      yahooFinance.fundamentalsTimeSeries(resolution.symbol, {
        module: "all",
        period1,
        type: "quarterly",
      }),
      yahooFinance.search(resolution.symbol, {
        newsCount: 6,
        quotesCount: 1,
      }),
    ]);

  const normalizedNews = normalizeNews(resolution.symbol, newsSearch.news);
  const sources = buildSources(resolution.symbol, normalizedNews);
  const assetProfile = quoteSummary.assetProfile;
  const financialData = quoteSummary.financialData;
  const price = quoteSummary.price;
  const summaryDetail = quoteSummary.summaryDetail;

  const snapshot = companySnapshotSchema.parse({
    currency: price?.currency ?? null,
    currentRatio: financialData?.currentRatio ?? null,
    debtToEquity: financialData?.debtToEquity ?? null,
    dividendYield: summaryDetail?.dividendYield ?? null,
    forwardPE: summaryDetail?.forwardPE ?? null,
    freeCashflow: financialData?.freeCashflow ?? null,
    grossMargins: financialData?.grossMargins ?? null,
    marketCap: price?.marketCap ?? summaryDetail?.marketCap ?? null,
    operatingCashflow: financialData?.operatingCashflow ?? null,
    operatingMargins: financialData?.operatingMargins ?? null,
    profitMargins: financialData?.profitMargins ?? null,
    recommendationKey: financialData?.recommendationKey ?? null,
    recommendationMean: financialData?.recommendationMean ?? null,
    regularMarketPrice: price?.regularMarketPrice ?? null,
    returnOnEquity: financialData?.returnOnEquity ?? null,
    revenueGrowth: financialData?.revenueGrowth ?? null,
    totalCash: financialData?.totalCash ?? null,
    totalDebt: financialData?.totalDebt ?? null,
    totalRevenue: financialData?.totalRevenue ?? null,
    trailingPE: summaryDetail?.trailingPE ?? null,
  });

  return evidenceDossierSchema.parse({
    annualFinancials: sortNewestFirst(
      annualFinancials.map((point) =>
        normalizeFinancialPoint(point as FundamentalsPointLike),
      ),
    ),
    company: {
      country: assetProfile?.country ?? null,
      currency: snapshot.currency,
      employees: assetProfile?.fullTimeEmployees ?? null,
      exchange: resolution.exchange,
      industry: assetProfile?.industry ?? resolution.industry,
      longBusinessSummary:
        assetProfile?.longBusinessSummary ??
        resolution.longName ??
        resolution.shortName,
      name: resolution.longName ?? resolution.shortName,
      query: resolution.query,
      sector: assetProfile?.sector ?? resolution.sector,
      ticker: resolution.symbol,
      website: assetProfile?.website ?? null,
    },
    news: normalizedNews,
    quarterlyFinancials: sortNewestFirst(
      quarterlyFinancials.map((point) =>
        normalizeFinancialPoint(point as FundamentalsPointLike),
      ),
    ),
    snapshot,
    sources,
  });
}
