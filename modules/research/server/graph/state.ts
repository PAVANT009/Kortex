import { Annotation } from "@langchain/langgraph";

import type { EvidenceDossier, ResolvedCompany } from "@/modules/research/schemas/evidence";
import type { InvestmentReport } from "@/modules/research/schemas/report";

export const ResearchGraphState = Annotation.Root({
  companyQuery: Annotation<string>,
  evidence: Annotation<EvidenceDossier>(),
  llmModel: Annotation<string | null>(),
  llmProvider: Annotation<string>(),
  report: Annotation<InvestmentReport>(),
  resolution: Annotation<ResolvedCompany>(),
  runId: Annotation<string>(),
});

export type ResearchGraphStateType = typeof ResearchGraphState.State;
