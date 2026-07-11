import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { env } from "@/lib/env";
import type { EvidenceDossier } from "@/modules/research/schemas/evidence";
import {
  investmentReportBodySchema,
  investmentReportSchema,
  type InvestmentReport,
} from "@/modules/research/schemas/report";

import { buildHeuristicReport } from "./fallback";

type AnalysisResult = {
  report: InvestmentReport;
  provider: string;
  model: string | null;
  mode: "llm" | "heuristic";
};

function getModelConfig() {
  const apiKey = env.ai.geminiApiKey;
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: env.ai.geminiModel,
  };
}

function buildEvidenceBrief(evidence: EvidenceDossier) {
  return {
    annualFinancials: evidence.annualFinancials.slice(0, 4),
    company: evidence.company,
    news: evidence.news.slice(0, 6),
    quarterlyFinancials: evidence.quarterlyFinancials.slice(0, 4),
    snapshot: evidence.snapshot,
    sources: evidence.sources.map((source) => ({
      id: source.id,
      title: source.title,
      type: source.type,
      url: source.url,
    })),
  };
}

const SYSTEM_PROMPT = `You are an investment research analyst.

Use only the provided evidence.
Do not invent facts.
Do not predict stock prices.
This is not trading advice.

Return a structured screening report that:
- analyzes the business and its financial profile
- identifies strengths and weaknesses
- identifies concrete risks
- presents a bull case and a bear case
- ends with either INVEST or PASS

Rules:
- If evidence is incomplete or conflicting, be conservative.
- If valuation is stretched, mention it explicitly.
- Cite source IDs in every section.
- Use PASS when the downside, uncertainty, or valuation risk outweighs the evidence.
- Keep the language concise, analytical, and plain.`;

export async function generateInvestmentReport(
  evidence: EvidenceDossier,
): Promise<AnalysisResult> {
  const fallback = buildHeuristicReport(evidence);
  const modelConfig = getModelConfig();

  if (!modelConfig) {
    return {
      mode: "heuristic",
      model: null,
      provider: "internal-fallback",
      report: fallback,
    };
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: modelConfig.apiKey,
      maxRetries: 2,
      model: modelConfig.model,
      temperature: 0.2,
    }).withStructuredOutput(investmentReportBodySchema, {
      method: "jsonSchema",
      name: "investment_report",
    });

    const llmBody = await model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(
        `Evidence dossier JSON:\n${JSON.stringify(buildEvidenceBrief(evidence), null, 2)}`,
      ),
    ]);

    return {
      mode: "llm",
      model: modelConfig.model,
      provider: "Google Gemini",
      report: investmentReportSchema.parse({
        ...llmBody,
        companyName: evidence.company.name,
        generatedAt: new Date().toISOString(),
        generation: {
          mode: "llm",
          model: modelConfig.model,
          note: null,
          provider: "Google Gemini",
        },
        ticker: evidence.company.ticker,
      }),
    };
  } catch (error) {
    return {
      mode: "heuristic",
      model: modelConfig.model,
      provider: "internal-fallback",
      report: investmentReportSchema.parse({
        ...fallback,
        generation: {
          mode: "heuristic",
          model: modelConfig.model,
          note:
            error instanceof Error
              ? `Gemini analysis failed: ${error.message}`
              : "Gemini analysis failed.",
          provider: "internal-fallback",
        },
      }),
    };
  }
}
