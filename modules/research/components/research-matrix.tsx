"use client";

import { useEffect, useRef, useState } from "react";
import {
  Columns3,
  ExternalLink,
  FilePlus2,
  Grid3x3,
  X,
  GripVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StockChart } from "@/components/stock-chart";
import { cn } from "@/lib/utils";
import type { EvidenceDossier, ResearchSource } from "@/modules/research/schemas/evidence";
import type { InvestmentReport } from "@/modules/research/schemas/report";

function formatDate(value: string | number | Date | null | undefined) {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(parsed);
}

function documentTypeLabel(type: ResearchSource["type"]) {
  switch (type) {
    case "profile":
      return "Company Profile";
    case "financial":
      return "Financials";
    case "news":
      return "News";
    default:
      return "Document";
  }
}

function documentTypeBadgeClass(type: ResearchSource["type"]) {
  switch (type) {
    case "profile":
      return "bg-primary/10 text-primary";
    case "financial":
      return "bg-amber-500/10 text-amber-600";
    case "news":
      return "bg-sky-500/10 text-sky-600";
    default:
      return "bg-muted text-muted-foreground";
  }
}

type CitedItem = {
  detail: string;
  title: string;
};

type MatrixColumn = {
  id: string;
  label: string;
  visible: boolean;
};

const DEFAULT_COLUMNS: MatrixColumn[] = [
  { id: "index", label: "#", visible: true },
  { id: "document", label: "Document", visible: true },
  { id: "date", label: "Date", visible: true },
  { id: "type", label: "Document Type", visible: true },
  { id: "risks", label: "Investment Risks", visible: true },
  { id: "market", label: "Market Considerations", visible: true },
];

function collectInsightsForSource(
  report: InvestmentReport,
  sourceId: string,
): { market: CitedItem[]; risks: CitedItem[] } {
  const risks: CitedItem[] = [];
  const market: CitedItem[] = [];

  for (const risk of report.risks) {
    if (risk.sourceIds.includes(sourceId)) {
      risks.push({ detail: risk.detail, title: risk.title });
    }
  }

  for (const weakness of report.weaknesses) {
    if (weakness.sourceIds.includes(sourceId)) {
      risks.push({ detail: weakness.detail, title: weakness.title });
    }
  }

  for (const strength of report.strengths) {
    if (strength.sourceIds.includes(sourceId)) {
      market.push({ detail: strength.detail, title: strength.title });
    }
  }

  for (const item of report.bullCase) {
    if (item.sourceIds.includes(sourceId)) {
      market.push({ detail: item.detail, title: item.title });
    }
  }

  const summaryBlocks = [
    report.executiveSummary,
    report.companySummary,
    report.financialAnalysis,
    report.newsSummary,
  ];

  for (const block of summaryBlocks) {
    if (block.sourceIds.includes(sourceId)) {
      market.push({ detail: block.text, title: "Summary insight" });
    }
  }

  return { market, risks };
}

function InsightList({
  columnLabel,
  documentTitle,
  items,
}: {
  columnLabel: string;
  documentTitle: string;
  items: CitedItem[];
}) {
  const [explanation, setExplanation] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <>
        <button
          className="text-left text-sm text-primary/80 underline-offset-2 transition hover:text-primary hover:underline"
          onClick={() =>
            setExplanation(
              `The Matrix Agent did not find ${columnLabel.toLowerCase()} directly cited in "${documentTitle}". This may mean the insight lives in another document, or the evidence was inferred from cross-document analysis.`,
            )
          }
          type="button"
        >
          Not in document, click to view explanation
        </button>
        {explanation ? (
          <div className="mt-2 rounded-md border border-border/70 bg-muted/30 p-2.5 text-xs leading-relaxed text-muted-foreground">
            {explanation}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`}>
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {item.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function DisplayMenu({
  columns,
  onToggleColumn,
}: {
  columns: MatrixColumn[];
  onToggleColumn: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        className="h-7 gap-1.5 text-xs"
        onClick={() => setOpen((current) => !current)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Grid3x3 className="size-3" />
        Display
      </Button>

      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-52 rounded-md border border-border bg-popover p-2 shadow-md">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Show columns
          </p>
          {columns
            .filter((column) => column.id !== "index" && column.id !== "document")
            .map((column) => (
              <label
                key={column.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
              >
                <input
                  checked={column.visible}
                  className="size-3.5 rounded border-border"
                  onChange={() => onToggleColumn(column.id)}
                  type="checkbox"
                />
                {column.label}
              </label>
            ))}
        </div>
      ) : null}
    </div>
  );
}

function ActionToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
      <span>{message}</span>
      <button
        className="text-muted-foreground transition hover:text-foreground"
        onClick={onClose}
        type="button"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

export function ResearchVerdictBanner({ report }: { report: InvestmentReport }) {
  const isInvest = report.decision.verdict === "INVEST";

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Investment Verdict
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {report.companyName}{" "}
            <span className="text-muted-foreground">({report.ticker})</span>
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            {report.decision.rationale}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide ${
              isInvest
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-rose-500/10 text-rose-700"
            }`}
          >
            {report.decision.verdict}
          </span>
          <span className="text-xs text-muted-foreground">
            {report.decision.confidence}% confidence ·{" "}
            {report.generation.mode === "llm" ? "Gemini" : "Heuristic fallback"}
          </span>
          <span className="text-xs text-muted-foreground">
            Generated {formatDate(report.generatedAt)}
          </span>
        </div>
      </div>
    </section>
  );
}

export function ResearchMatrix({
  report,
  evidence,
  variant = "card",
}: {
  report: InvestmentReport;
  evidence: EvidenceDossier;
  variant?: "card" | "pane";
}) {
  const [columns, setColumns] = useState<MatrixColumn[]>(DEFAULT_COLUMNS);
  const [toast, setToast] = useState<string | null>(null);
  const [tableChartRatio, setTableChartRatio] = useState(0.6);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const isPane = variant === "pane";

  const rows = evidence.sources.map((source, index) => {
    const insights = collectInsightsForSource(report, source.id);
    return {
      date: source.publishedAt ?? report.generatedAt,
      documentType: documentTypeLabel(source.type),
      index: index + 1,
      market: insights.market,
      risks: insights.risks,
      source,
    };
  });

  const ticker = evidence.company.ticker;

  const handleDragStart = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const container = dragRef.current?.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const relativeY = event.clientY - rect.top;
      const newRatio = relativeY / rect.height;

      // Clamp between 0.2 and 0.8
      const clampedRatio = Math.max(0.2, Math.min(0.8, newRatio));
      setTableChartRatio(clampedRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  function toggleColumn(id: string) {
    setColumns((current) =>
      current.map((column) =>
        column.id === id ? { ...column, visible: !column.visible } : column,
      ),
    );
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }

  const visibleColumns = columns.filter((column) => column.visible);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-card",
        isPane ? "border-0" : "rounded-lg border border-border shadow-sm",
      )}
      ref={dragRef}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <DisplayMenu columns={columns} onToggleColumn={toggleColumn} />
          <Button
            className="h-7 gap-1.5 text-xs"
            onClick={() =>
              showToast(
                "Document upload will connect to the evidence pipeline in a future release.",
              )
            }
            size="sm"
            type="button"
            variant="outline"
          >
            <FilePlus2 className="size-3" />
            Add documents
          </Button>
          <Button
            className="h-7 gap-1.5 text-xs"
            onClick={() =>
              showToast(
                "Custom column extraction will be available once follow-up chat is wired to the agent.",
              )
            }
            size="sm"
            type="button"
            variant="outline"
          >
            <Columns3 className="size-3" />
            Add columns
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {toast ? <ActionToast message={toast} onClose={() => setToast(null)} /> : null}
          <span className="text-xs text-muted-foreground">
            {rows.length} evidence documents
          </span>
        </div>
      </div>

      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        {/* Evidence Table Section */}
        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ flex: `${tableChartRatio} 1 0%` }}
        >
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.id}
                      className={cn(
                        "px-4 py-2.5 font-medium",
                        column.id === "index" && "w-12 text-center",
                        column.id === "document" && "min-w-[12rem]",
                        column.id === "date" && "min-w-[8rem]",
                        column.id === "type" && "min-w-[8rem]",
                        column.id === "risks" && "min-w-[14rem]",
                        column.id === "market" && "min-w-[14rem]",
                      )}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr
                    key={row.source.id}
                    className="align-top transition-colors hover:bg-muted/10"
                  >
                    {visibleColumns.map((column) => {
                      if (column.id === "index") {
                        return (
                          <td
                            key={column.id}
                            className="border-r border-border/50 px-4 py-3 text-center text-muted-foreground"
                          >
                            {row.index}
                          </td>
                        );
                      }

                      if (column.id === "document") {
                        return (
                          <td
                            key={column.id}
                            className="border-r border-border/50 px-4 py-3 font-medium"
                          >
                            <a
                              className="inline-flex items-center gap-1 hover:text-primary"
                              href={row.source.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {row.source.title}
                              <ExternalLink className="size-3 shrink-0" />
                            </a>
                          </td>
                        );
                      }

                      if (column.id === "date") {
                        return (
                          <td
                            key={column.id}
                            className="border-r border-border/50 px-4 py-3 text-muted-foreground"
                          >
                            {formatDate(row.date)}
                          </td>
                        );
                      }

                      if (column.id === "type") {
                        return (
                          <td
                            key={column.id}
                            className="border-r border-border/50 px-4 py-3"
                          >
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${documentTypeBadgeClass(row.source.type)}`}
                            >
                              {row.documentType}
                            </span>
                          </td>
                        );
                      }

                      if (column.id === "risks") {
                        return (
                          <td
                            key={column.id}
                            className="border-r border-border/50 px-4 py-3"
                          >
                            <InsightList
                              columnLabel="Investment Risks"
                              documentTitle={row.source.title}
                              items={row.risks}
                            />
                          </td>
                        );
                      }

                      return (
                        <td key={column.id} className="px-4 py-3">
                          <InsightList
                            columnLabel="Market Considerations"
                            documentTitle={row.source.title}
                            items={row.market}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dragger */}
        <button
          aria-label="Resize table and chart panes"
          className={cn(
            "group relative z-10 flex h-2 shrink-0 cursor-row-resize items-center justify-center border-y border-border bg-muted/40 transition-colors hover:bg-primary/10",
            isDragging && "bg-primary/15",
          )}
          onMouseDown={handleDragStart}
          type="button"
        >
          <GripVertical className="size-3 text-muted-foreground group-hover:text-foreground" />
        </button>

        {/* Stock Chart Section */}
        <div
          className="flex flex-col min-h-0 overflow-hidden border-t border-border bg-background"
          style={{ flex: `${1 - tableChartRatio} 1 0%` }}
        >
          <div className="flex-1 overflow-auto p-4">
            <StockChart symbol={ticker} />
          </div>
        </div>
      </div>
    </div>
  );
}
