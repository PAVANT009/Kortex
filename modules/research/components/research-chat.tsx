"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Paperclip,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { InvestmentReport } from "@/modules/research/schemas/report";

type ChatMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
  stepsCompleted?: number;
};

type ResearchChatProps = {
  companyName?: string;
  report: InvestmentReport | null;
  variant?: "card" | "pane";
};

const PRESET_PROMPTS = [
  "Draft key due diligence questions for a management meeting.",
  "Summarize the biggest risks from the evidence.",
  "What would change your mind on the invest/pass verdict?",
];

function buildDdQuestionsResponse(report: InvestmentReport) {
  const questions = report.followUpQuestions;
  const lines = questions.map((question, index) => `${index + 1}. ${question}`);
  return `**Key Questions for Meeting with ${report.companyName}**\n\n${lines.join("\n")}`;
}

function buildRiskSummaryResponse(report: InvestmentReport) {
  const risks = report.risks
    .slice(0, 4)
    .map(
      (risk, index) =>
        `${index + 1}. **${risk.title}** (${risk.severity}): ${risk.detail}`,
    );
  return `**Top risks from the evidence**\n\n${risks.join("\n\n")}`;
}

function buildVerdictResponse(report: InvestmentReport) {
  return `**Current verdict: ${report.decision.verdict}** (${report.decision.confidence}% confidence)\n\n${report.decision.rationale}\n\nBull case highlights:\n${report.bullCase.map((item) => `- ${item.title}: ${item.detail}`).join("\n")}\n\nBear case highlights:\n${report.bearCase.map((item) => `- ${item.title}: ${item.detail}`).join("\n")}`;
}

function buildAgentResponse(prompt: string, report: InvestmentReport) {
  const normalized = prompt.toLowerCase();

  if (
    normalized.includes("due diligence") ||
    normalized.includes("dd") ||
    normalized.includes("question") ||
    normalized.includes("ask") ||
    normalized.includes("meeting")
  ) {
    return buildDdQuestionsResponse(report);
  }

  if (
    normalized.includes("risk") ||
    normalized.includes("danger") ||
    normalized.includes("concern") ||
    normalized.includes("problem")
  ) {
    return buildRiskSummaryResponse(report);
  }

  if (
    normalized.includes("verdict") ||
    normalized.includes("invest") ||
    normalized.includes("pass") ||
    normalized.includes("change your mind") ||
    normalized.includes("decision") ||
    normalized.includes("recommendation")
  ) {
    return buildVerdictResponse(report);
  }

  if (
    normalized.includes("hello") ||
    normalized.includes("hi") ||
    normalized.includes("hey")
  ) {
    return `Hello! I'm here to help you analyze the research on ${report.companyName}. You can ask me about:\n\n• Key due diligence questions\n• Risks from the evidence\n• The invest/pass verdict and rationale\n\nWhat would you like to know?`;
  }

  if (
    normalized.includes("guidance") ||
    normalized.includes("management") ||
    normalized.includes("headline") ||
    normalized.includes("narrative")
  ) {
    return `**Management Guidance vs Headline Narrative**\n\nBased on the evidence, here's the comparison:\n\n${report.executiveSummary.text}\n\nThe key factors to consider are the alignment between management's forward-looking statements and the current market sentiment reflected in recent headlines.`;
  }

  if (
    normalized.includes("valuation") ||
    normalized.includes("price") ||
    normalized.includes("expensive") ||
    normalized.includes("cheap")
  ) {
    return `**Valuation Assessment**\n\n${report.financialAnalysis.text}\n\nThe current valuation should be evaluated relative to peers and expected growth rates. Consider the financial metrics and market positioning outlined in the analysis.`;
  }

  // Default response for other questions
  return `I can help you with questions about ${report.companyName}. Here are some things I can do:\n\n• Draft due diligence questions\n• Summarize risks\n• Explain the verdict\n• Discuss valuation\n\nTry asking about one of these topics, or use the preset prompts above.`;
}

function renderMarkdownish(text: string) {
  return text.split("\n").map((line, index) => {
    const content = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^\d+\.\s/, (match) => match);

    return (
      <p
        key={`${index}-${line}`}
        className="text-sm leading-7 text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: content || "&nbsp;" }}
      />
    );
  });
}

function StepsBadge({ steps }: { steps: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      className="inline-flex items-center gap-1 rounded border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:bg-muted"
      onClick={() => setExpanded((current) => !current)}
      type="button"
    >
      {steps} steps completed
      {expanded ? (
        <ChevronUp className="size-3" />
      ) : (
        <ChevronDown className="size-3" />
      )}
    </button>
  );
}

export function ResearchChat({
  companyName,
  report,
  variant = "card",
}: ResearchChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [seededReportId, setSeededReportId] = useState<string | null>(null);
  const isPane = variant === "pane";

  useEffect(() => {
    if (!report) {
      setSeededReportId(null);
      return;
    }

    const reportKey = `${report.companyName}-${report.generatedAt}`;
    if (seededReportId === reportKey) return;

    setMessages([
      {
        content: `We are screening ${report.companyName} (${report.ticker}). Draft key due diligence questions based on your assessment of the evidence documents.`,
        id: crypto.randomUUID(),
        role: "user",
      },
      {
        content: buildDdQuestionsResponse(report),
        id: crypto.randomUUID(),
        role: "agent",
        stepsCompleted: 12,
      },
    ]);
    setSeededReportId(reportKey);
  }, [report, seededReportId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isThinking]);

  async function handlePrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    if (!report) {
      setMessages((current) => [
        ...current,
        { content: trimmed, id: crypto.randomUUID(), role: "user" },
        {
          content:
            "Run a company through the research agent first. I can draft DD questions, summarize risks, and explain the verdict once the memo is ready.",
          id: crypto.randomUUID(),
          role: "agent",
        },
      ]);
      setInput("");
      return;
    }

    const userMessage: ChatMessage = {
      content: trimmed,
      id: crypto.randomUUID(),
      role: "user",
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsThinking(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const agentMessage: ChatMessage = {
      content: buildAgentResponse(trimmed, report),
      id: crypto.randomUUID(),
      role: "agent",
      stepsCompleted: 12,
    };

    setMessages((current) => [...current, agentMessage]);
    setIsThinking(false);
  }

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-card",
        isPane ? "border-0" : "rounded-xl border border-border shadow-sm",
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          <p className="text-sm font-medium text-foreground">Matrix Agent</p>
          {companyName ? (
            <span className="text-xs text-muted-foreground">
              · {companyName}
            </span>
          ) : null}
        </div>
        {report ? (
          <span className="text-[10px] text-muted-foreground">
            {report.generation.mode === "llm" ? "Gemini" : "Heuristic"} ·{" "}
            {report.decision.verdict}
          </span>
        ) : null}
      </div>

      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask follow-up questions about the research memo. Try a preset
              prompt or type your own.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-left text-xs text-muted-foreground transition hover:border-foreground/20 hover:bg-muted hover:text-foreground"
                  onClick={() => void handlePrompt(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-6 rounded-lg bg-muted/50 px-4 py-3 sm:ml-12"
                  : "mr-6 rounded-lg border border-border/70 bg-background px-4 py-3 sm:mr-12"
              }
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {message.role === "user" ? "You" : "Matrix Agent"}
                </p>
                {message.stepsCompleted ? (
                  <StepsBadge steps={message.stepsCompleted} />
                ) : null}
              </div>
              {renderMarkdownish(message.content)}
            </div>
          ))
        )}

        {isThinking ? (
          <div className="mr-6 flex items-center gap-2 rounded-lg border border-border/70 bg-background px-4 py-3 text-sm text-muted-foreground sm:mr-12">
            <LoaderCircle className="size-4 animate-spin" />
            Reviewing evidence and drafting a response...
          </div>
        ) : null}
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t border-border px-3 py-2.5 sm:px-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handlePrompt(input);
        }}
      >
        <button
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="Attach documents (coming soon)"
          type="button"
        >
          <Paperclip className="size-4" />
        </button>
        <Input
          className="h-9 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask anything..."
          value={input}
        />
        <Button
          className="size-8 shrink-0 rounded-lg p-0"
          disabled={isThinking || !input.trim()}
          size="sm"
          type="submit"
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </section>
  );
}
