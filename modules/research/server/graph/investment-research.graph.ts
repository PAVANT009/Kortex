import { END, START, StateGraph } from "@langchain/langgraph";

import { researchRequestSchema } from "@/modules/research/schemas/input";

import { generateInvestmentReport } from "../analysis/llm";
import { completeResearchRun, saveResearchReport } from "../repository";
import { fetchEvidence } from "../tools/fetch-evidence.tool";
import { resolveCompany } from "../tools/resolve-company.tool";
import { ResearchGraphState, type ResearchGraphStateType } from "./state";

async function validateInputNode(state: ResearchGraphStateType) {
  const parsed = researchRequestSchema.parse({
    company: state.companyQuery,
  });

  return {
    companyQuery: parsed.company,
  };
}

async function resolveCompanyNode(state: ResearchGraphStateType) {
  const resolution = await resolveCompany(state.companyQuery);
  return { resolution };
}

async function fetchEvidenceNode(state: ResearchGraphStateType) {
  const evidence = await fetchEvidence(state.resolution);
  return { evidence };
}

async function analyzeEvidenceNode(state: ResearchGraphStateType) {
  const analysis = await generateInvestmentReport(state.evidence);
  return {
    llmModel: analysis.model,
    llmProvider: analysis.provider,
    report: analysis.report,
  };
}

async function persistNode(state: ResearchGraphStateType) {
  await saveResearchReport({
    evidence: state.evidence,
    report: state.report,
    runId: state.runId,
    sources: state.evidence.sources,
  });

  await completeResearchRun({
    companyName: state.report.companyName,
    llmModel: state.llmModel,
    llmProvider: state.llmProvider,
    runId: state.runId,
    ticker: state.report.ticker,
  });

  return state;
}

export const investmentResearchGraph = new StateGraph(ResearchGraphState)
  .addNode("validateInput", validateInputNode)
  .addNode("resolveCompany", resolveCompanyNode)
  .addNode("fetchEvidence", fetchEvidenceNode)
  .addNode("analyzeEvidence", analyzeEvidenceNode)
  .addNode("persist", persistNode)
  .addEdge(START, "validateInput")
  .addEdge("validateInput", "resolveCompany")
  .addEdge("resolveCompany", "fetchEvidence")
  .addEdge("fetchEvidence", "analyzeEvidence")
  .addEdge("analyzeEvidence", "persist")
  .addEdge("persist", END)
  .compile();
