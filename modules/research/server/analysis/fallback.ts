import type { EvidenceDossier, ResearchSource } from "@/modules/research/schemas/evidence";
import {
  investmentReportSchema,
  type InvestmentDecision,
  type InvestmentReport,
} from "@/modules/research/schemas/report";

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  const normalized = Math.abs(value) > 1 ? value / 100 : value;
  return `${(normalized * 100).toFixed(1)}%`;
}

function latestSourceIdsByType(
  sources: ResearchSource[],
  type: ResearchSource["type"],
  limit = 2,
) {
  return sources
    .filter((source) => source.type === type)
    .slice(0, limit)
    .map((source) => source.id);
}

function clamp(number: number, min: number, max: number) {
  return Math.max(min, Math.min(max, number));
}

function createStrengths(evidence: EvidenceDossier) {
  const snapshot = evidence.snapshot;
  const sourceIds = latestSourceIdsByType(evidence.sources, "financial");
  const strengths = [];

  if ((snapshot.revenueGrowth ?? 0) > 0.1) {
    strengths.push({
      detail: `Revenue growth is running at ${formatPercent(snapshot.revenueGrowth)}, which supports the case that the business is still compounding rather than relying purely on cost control.`,
      sourceIds,
      title: "Healthy top-line growth",
    });
  }

  if ((snapshot.profitMargins ?? 0) > 0.12 || (snapshot.operatingMargins ?? 0) > 0.15) {
    strengths.push({
      detail: `The company is operating with attractive margin structure, suggesting that it has pricing power or a favorable operating model.`,
      sourceIds,
      title: "Attractive profitability",
    });
  }

  if ((snapshot.freeCashflow ?? 0) > 0 || (snapshot.operatingCashflow ?? 0) > 0) {
    strengths.push({
      detail: `Cash generation is positive, which gives management more room to invest, defend the balance sheet, and handle weaker markets.`,
      sourceIds,
      title: "Positive cash generation",
    });
  }

  if ((snapshot.totalCash ?? 0) >= (snapshot.totalDebt ?? Number.MAX_SAFE_INTEGER)) {
    strengths.push({
      detail: `Cash appears to cover debt, which lowers refinancing pressure and gives the company more optionality in a downturn.`,
      sourceIds,
      title: "Balance sheet cushion",
    });
  }

  if ((snapshot.returnOnEquity ?? 0) > 0.12) {
    strengths.push({
      detail: `Return on equity is solid, which suggests the business is turning shareholder capital into earnings efficiently.`,
      sourceIds,
      title: "Efficient capital deployment",
    });
  }

  return strengths.slice(0, 4);
}

function createWeaknesses(evidence: EvidenceDossier) {
  const snapshot = evidence.snapshot;
  const sourceIds = latestSourceIdsByType(evidence.sources, "financial");
  const weaknesses = [];

  if ((snapshot.trailingPE ?? 0) > 35 || (snapshot.forwardPE ?? 0) > 30) {
    weaknesses.push({
      detail: "The valuation is demanding, so even good operating execution may already be priced in.",
      sourceIds,
      title: "Premium valuation",
    });
  }

  if ((snapshot.revenueGrowth ?? 0) < 0.05) {
    weaknesses.push({
      detail: "Revenue growth is modest, which makes multiple expansion and sentiment more important than business momentum.",
      sourceIds,
      title: "Growth is not especially strong",
    });
  }

  if ((snapshot.profitMargins ?? 0) < 0.08 && (snapshot.operatingMargins ?? 0) < 0.1) {
    weaknesses.push({
      detail: "Margins do not leave much room for error if demand softens or costs rise.",
      sourceIds,
      title: "Limited margin buffer",
    });
  }

  if ((snapshot.debtToEquity ?? 0) > 120 || (snapshot.totalDebt ?? 0) > (snapshot.totalCash ?? 0) * 1.5) {
    weaknesses.push({
      detail: "Leverage looks meaningful relative to cash resources, which can amplify downside if execution slips.",
      sourceIds,
      title: "Leverage pressure",
    });
  }

  if ((snapshot.currentRatio ?? 2) < 1) {
    weaknesses.push({
      detail: "Current assets do not clearly exceed current liabilities, which can tighten short-term flexibility.",
      sourceIds,
      title: "Short-term liquidity is tight",
    });
  }

  if (weaknesses.length < 2) {
    weaknesses.push({
      detail: "The current dataset is strong on snapshots but lighter on management guidance and competitive positioning, so conviction should stay measured.",
      sourceIds,
      title: "Evidence is still incomplete",
    });
  }

  return weaknesses.slice(0, 4);
}

function createRisks(evidence: EvidenceDossier) {
  const snapshot = evidence.snapshot;
  const financialSourceIds = latestSourceIdsByType(evidence.sources, "financial");
  const newsSourceIds = latestSourceIdsByType(evidence.sources, "news", 3);
  const risks = [];

  risks.push({
    detail: "Even solid businesses can underperform if bought at rich multiples. That matters here if market expectations stay elevated.",
    severity:
      (snapshot.trailingPE ?? 0) > 35 || (snapshot.forwardPE ?? 0) > 30
        ? "high"
        : "medium",
    sourceIds: financialSourceIds,
    title: "Valuation compression risk",
  });

  risks.push({
    detail: "The investment case depends on the company maintaining current profitability and revenue momentum. Any slowdown would weaken the bull case quickly.",
    severity:
      (snapshot.revenueGrowth ?? 0) < 0.05 || (snapshot.profitMargins ?? 0) < 0.08
        ? "high"
        : "medium",
    sourceIds: financialSourceIds,
    title: "Execution risk",
  });

  if (newsSourceIds.length > 0) {
    risks.push({
      detail: "Recent headlines can shift sentiment quickly. Investors should watch whether the latest news flow points to demand pressure, regulation, or strategic uncertainty.",
      severity: "medium",
      sourceIds: newsSourceIds,
      title: "Headline and sentiment risk",
    });
  }

  risks.push({
    detail: "This report uses Yahoo Finance data and headline-level news summaries. It is useful for screening but should be complemented with filings and management commentary before a real investment decision.",
    severity: "medium",
    sourceIds: evidence.sources.slice(0, 2).map((source) => source.id),
    title: "Evidence-quality risk",
  });

  return risks.slice(0, 4);
}

function createNewsSummary(evidence: EvidenceDossier) {
  const sourceIds = latestSourceIdsByType(evidence.sources, "news", 3);
  const headlines = evidence.news.slice(0, 3).map((item) => item.title);

  if (headlines.length === 0) {
    return {
      sourceIds,
      text: "Yahoo Finance did not return recent news headlines for this company, so the decision leans more heavily on financial evidence than near-term narrative flow.",
    };
  }

  return {
    sourceIds,
    text: `Recent coverage is centered on ${headlines
      .map((headline) => `"${headline}"`)
      .join(", ")}. The immediate read is useful for sentiment, but headline flow should not outweigh the underlying financial picture.`,
  };
}

export function buildHeuristicReport(evidence: EvidenceDossier): InvestmentReport {
  const strengths = createStrengths(evidence);
  const weaknesses = createWeaknesses(evidence);
  const risks = createRisks(evidence);
  const financialSourceIds = latestSourceIdsByType(evidence.sources, "financial");
  const profileSourceIds = latestSourceIdsByType(evidence.sources, "profile");
  const sourceIds = [...new Set([...financialSourceIds, ...profileSourceIds])];

  let score = 0;
  score += strengths.length * 1.3;
  score -= weaknesses.length * 1.1;
  score -= risks.filter((risk) => risk.severity === "high").length * 1.5;
  score += (evidence.snapshot.recommendationMean ?? 3) < 2.2 ? 0.5 : 0;

  const verdict: InvestmentDecision = score >= 0.8 ? "INVEST" : "PASS";
  const confidence = clamp(Math.round(60 + Math.abs(score) * 7), 55, 84);

  const bullCase = strengths.slice(0, 3).map((item) => ({
    detail: item.detail,
    sourceIds: item.sourceIds,
    title: item.title,
  }));

  const bearCase = [...weaknesses, ...risks]
    .slice(0, 3)
    .map((item) => ({
      detail: item.detail,
      sourceIds: item.sourceIds,
      title: item.title,
    }));

  const latestNewsSummary = createNewsSummary(evidence);
  const companyName = evidence.company.name;
  const ticker = evidence.company.ticker;

  return investmentReportSchema.parse({
    bearCase,
    bullCase,
    companyName,
    companySummary: {
      sourceIds: profileSourceIds,
      text: `${companyName} operates in ${evidence.company.sector ?? "its reported sector"} and is described by Yahoo Finance as ${evidence.company.longBusinessSummary ?? "a listed company with limited profile data available"}.`,
    },
    decision: {
      confidence,
      rationale:
        verdict === "INVEST"
          ? "The business shows enough growth, profitability, or balance-sheet resilience to justify a positive screen, even after accounting for valuation and execution risks."
          : "The available evidence does not create enough upside-adjusted conviction. The business may still be good, but the current risk, valuation, or evidence-quality profile is not strong enough for an invest call.",
      sourceIds: sourceIds.length > 0 ? sourceIds : evidence.sources.map((source) => source.id).slice(0, 2),
      verdict,
    },
    executiveSummary: {
      sourceIds,
      text:
        verdict === "INVEST"
          ? `${companyName} screens as an INVEST candidate because the current evidence points to a business with tangible financial support behind the narrative, although the call still needs standard diligence on valuation and execution.`
          : `${companyName} screens as a PASS candidate because the current evidence leaves too much risk, too much valuation pressure, or too little conviction to justify a positive call.`,
    },
    financialAnalysis: {
      sourceIds: financialSourceIds,
      text: `Key financial signals include revenue growth of ${formatPercent(evidence.snapshot.revenueGrowth) ?? "not available"}, profit margin of ${formatPercent(evidence.snapshot.profitMargins) ?? "not available"}, operating margin of ${formatPercent(evidence.snapshot.operatingMargins) ?? "not available"}, and debt-to-equity of ${evidence.snapshot.debtToEquity?.toFixed(1) ?? "not available"}. Taken together, the financial profile is ${verdict === "INVEST" ? "supportive of the bull case" : "not strong enough to override the risks"}.`,
    },
    followUpQuestions: [
      "How does management guidance compare with the recent headline narrative?",
      "What would need to improve or deteriorate over the next two quarters to change the verdict?",
      "Is the current valuation still justified relative to peers and expected growth?",
    ],
    generatedAt: new Date().toISOString(),
    generation: {
      mode: "heuristic",
      model: null,
      note: "Gemini analysis was unavailable, so the report used a deterministic scoring fallback.",
      provider: "internal-fallback",
    },
    newsSummary: latestNewsSummary,
    risks,
    strengths,
    ticker,
    weaknesses,
  });
}
