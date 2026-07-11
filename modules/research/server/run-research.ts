import { investmentResearchGraph } from "./graph/investment-research.graph";

export async function runInvestmentResearch(input: {
  companyQuery: string;
  runId: string;
}) {
  const result = await investmentResearchGraph.invoke({
    companyQuery: input.companyQuery,
    runId: input.runId,
  });

  return {
    evidence: result.evidence,
    report: result.report,
    runId: result.runId,
  };
}
