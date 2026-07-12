"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bookmark,
  CircleAlert,
  LoaderCircle,
  Search,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { researchResponseSchema, type ResearchResponse } from "@/modules/research/schemas/report";
import type { RecentResearchRun } from "@/modules/research/server/repository";
import { ResearchChat } from "./research-chat";
import { ResearchMatrix } from "./research-matrix";

type ResearchWorkspaceProps = {
  initialCompanyQuery?: string;
  initialRecentRuns: RecentResearchRun[];
  initialRunId?: string;
  mode: "public" | "dashboard";
  viewerName?: string | null;
};

const QUICK_QUERIES = ["Microsoft", "NVIDIA", "Costco", "Tesla"];
const DEFAULT_CHAT_RATIO = 0.42;
const MIN_CHAT_RATIO = 0.2;
const MAX_CHAT_RATIO = 0.7;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong while generating the report.";
}

function VerdictPill({ verdict, confidence }: { verdict: string; confidence: number }) {
  const isInvest = verdict === "INVEST";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        isInvest
          ? "bg-emerald-500/10 text-emerald-700"
          : "bg-rose-500/10 text-rose-700",
      )}
    >
      {verdict} · {confidence}%
    </span>
  );
}

export function ResearchWorkspace({
  initialCompanyQuery = "",
  initialRecentRuns,
  initialRunId,
  mode,
  viewerName,
}: ResearchWorkspaceProps) {
  const router = useRouter();
  const splitRef = useRef<HTMLDivElement>(null);
  const [company, setCompany] = useState(initialCompanyQuery);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [recentRuns, setRecentRuns] = useState(initialRecentRuns);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [chatRatio, setChatRatio] = useState(DEFAULT_CHAT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistItemId, setWatchlistItemId] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ symbol: string; name: string; type: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const busy = isSubmitting || isHydrating;

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (company.length >= 2) {
        try {
          const response = await fetch(`/api/company-search?q=${encodeURIComponent(company)}`);
          if (response.ok) {
            const data = await response.json();
            console.log("Suggestions response:", data);
            setSearchSuggestions(data.results || []);
            setShowSuggestions(true);
            console.log("Show suggestions set to true, results:", data.results);
          }
        } catch (err) {
          console.error("Failed to fetch suggestions:", err);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [company]);

  function handleSelectSuggestion(suggestion: { symbol: string; name: string }) {
    setCompany(suggestion.name);
    setShowSuggestions(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('form')) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function buildRunHref(runId: string, companyQuery?: string) {
    if (mode === "dashboard") return `/research/${runId}`;
    const params = new URLSearchParams();
    if (companyQuery) params.set("company", companyQuery);
    params.set("run", runId);
    return `/?${params.toString()}`;
  }

  const handleSplitterMove = useCallback((clientY: number) => {
    const container = splitRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const ratio = (clientY - rect.top) / rect.height;
    setChatRatio(Math.min(MAX_CHAT_RATIO, Math.max(MIN_CHAT_RATIO, ratio)));
  }, []);

  async function handleSaveReport() {
    if (!result) return;

    try {
      console.log("Saving report with runId:", result.runId);
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: result.runId,
          companyName: result.report.companyName,
          ticker: result.report.ticker,
          decision: result.report.decision.verdict,
        }),
      });

      console.log("Save response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Save response data:", data);
        setIsSaved(true);
        setSavedReportId(data.savedReport.id);
      } else if (response.status === 409) {
        console.log("Report already saved");
        setIsSaved(true);
      } else {
        const errorData = await response.json();
        console.error("Save failed:", errorData);
      }
    } catch (err) {
      console.error("Failed to save report:", err);
    }
  }

  async function handleUnsaveReport() {
    if (!savedReportId) return;

    try {
      const response = await fetch(`/api/saved/${savedReportId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsSaved(false);
        setSavedReportId(null);
      }
    } catch (err) {
      console.error("Failed to unsave report:", err);
    }
  }

  async function handleAddToWatchlist() {
    if (!result) return;

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: result.report.companyName,
          ticker: result.report.ticker,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsInWatchlist(true);
        setWatchlistItemId(data.watchlistItem.id);
      } else if (response.status === 409) {
        setIsInWatchlist(true);
      }
    } catch (err) {
      console.error("Failed to add to watchlist:", err);
    }
  }

  async function handleRemoveFromWatchlist() {
    if (!watchlistItemId) return;

    try {
      const response = await fetch(`/api/watchlist/${watchlistItemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsInWatchlist(false);
        setWatchlistItemId(null);
      }
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
    }
  }

  useEffect(() => {
    if (!isDragging) return;

    function onMouseMove(event: MouseEvent) {
      handleSplitterMove(event.clientY);
    }

    function onMouseUp() {
      setIsDragging(false);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleSplitterMove, isDragging]);

  useEffect(() => {
    if (!result) return;

    async function checkSaveStatus() {
      try {
        const response = await fetch("/api/saved");
        if (response.ok) {
          const data = await response.json();
          const saved = data.savedReports?.find((r: any) => r.reportId === result.runId);
          setIsSaved(!!saved);
          setSavedReportId(saved?.id || null);
        }
      } catch (err) {
        console.error("Failed to check save status:", err);
      }
    }

    async function checkWatchlistStatus() {
      try {
        const response = await fetch("/api/watchlist");
        if (response.ok) {
          const data = await response.json();
          const inWatchlist = data.watchlist?.find((w: any) => w.ticker === result.report.ticker);
          setIsInWatchlist(!!inWatchlist);
          setWatchlistItemId(inWatchlist?.id || null);
        }
      } catch (err) {
        console.error("Failed to check watchlist status:", err);
      }
    }

    checkSaveStatus();
    checkWatchlistStatus();
  }, [result]);

  useEffect(() => {
    if (!initialRunId) return;
    const runId = initialRunId;
    if (result?.runId === initialRunId) return;
    let cancelled = false;

    async function loadSavedRun() {
      setIsHydrating(true);
      setError(null);
      try {
        const response = await fetch(`/api/research/${encodeURIComponent(runId)}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to load the saved report.");
        const parsed = researchResponseSchema.parse(payload);
        if (!cancelled) {
          setCompany((current) => current || parsed.report.companyName);
          setResult(parsed);
        }
      } catch (loadError) {
        if (!cancelled) setError(getErrorMessage(loadError));
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    }
    void loadSavedRun();
    return () => { cancelled = true; };
  }, [initialRunId, result?.runId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("handleSubmit called, company:", company);
    const trimmedCompany = company.trim();
    if (!trimmedCompany) {
      setError("Enter a company name to start the research run.");
      return;
    }
    console.log("Submitting research for:", trimmedCompany);
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/research", {
        body: JSON.stringify({ company: trimmedCompany }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();
      console.log("Research response:", response.status);
      if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Unable to complete the research run.");
      const parsed = researchResponseSchema.parse(payload);
      setResult(parsed);
      setRecentRuns((current) => {
        const next = [
          {
            companyQuery: trimmedCompany,
            createdAt: new Date().toISOString(),
            id: parsed.runId,
            resolvedCompanyName: parsed.report.companyName,
            status: "completed" as const,
            ticker: parsed.report.ticker,
          },
          ...current.filter((item) => item.id !== parsed.runId),
        ];
        return next.slice(0, 8);
      });
      router.replace(buildRunHref(parsed.runId, trimmedCompany), { scroll: false });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const report = result?.report ?? null;
  const evidence = result?.evidence ?? null;
  const hasMatrix = Boolean(report && evidence);

  return (
    <div
      className={cn(
        "flex flex-col",
        mode === "dashboard"
          ? "h-[calc(100vh-3.5rem)]"
          : "min-h-[calc(100vh-8rem)]",
      )}
    >
      {/* Compact command bar */}
      <div className="shrink-0 border-b border-border bg-background px-4 py-2.5 sm:px-5">
        {report ? (
          <div className="mb-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">
              {report.companyName}
            </h1>
            <span className="text-xs text-muted-foreground">
              Saved at {new Date(report.generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </span>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={handleSubmit}>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoComplete="off"
                className="h-8 rounded-md border-border/80 bg-muted/30 pr-24 pl-8 text-sm"
                id={`${mode}-company`}
                onChange={(event) => setCompany(event.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder={
                  mode === "dashboard"
                    ? "Screen a company..."
                    : "e.g. Microsoft, Costco"
                }
                value={company}
              />
              <Button
                className="absolute top-1/2 right-1 h-6 -translate-y-1/2 rounded px-2.5 text-xs"
                disabled={busy}
                size="sm"
                type="submit"
              >
                {busy ? (
                  <LoaderCircle className="size-3 animate-spin" />
                ) : (
                  "Analyze"
                )}
              </Button>

              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.symbol}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(suggestion);
                      }}
                      type="button"
                    >
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-xs text-muted-foreground">{suggestion.symbol}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          {report ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {report.companyName}
              </span>
              <span>({report.ticker})</span>
              <VerdictPill
                confidence={report.decision.confidence}
                verdict={report.decision.verdict}
              />
              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={isSaved ? handleUnsaveReport : handleSaveReport}
                  title={isSaved ? "Unsave report" : "Save report"}
                >
                  <Bookmark className={cn("size-4", isSaved && "fill-primary text-primary")} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={isInWatchlist ? handleRemoveFromWatchlist : handleAddToWatchlist}
                  title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                >
                  <Star className={cn("size-4", isInWatchlist && "fill-primary text-primary")} />
                </Button>
              </div>
            </div>
          ) : (
            <p className="hidden text-xs text-muted-foreground sm:block">
              {mode === "dashboard"
                ? `Screen companies faster${viewerName ? `, ${viewerName}` : ""}`
                : "Research a company and get an invest-or-pass verdict"}
            </p>
          )}
        </div>

        {!report && recentRuns.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent:
            </span>
            {recentRuns.slice(0, 5).map((run) => (
              <Link
                key={run.id}
                className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
                href={buildRunHref(run.id, run.companyQuery)}
              >
                {run.resolvedCompanyName ?? run.companyQuery}
              </Link>
            ))}
          </div>
        ) : null}

        {!report ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {QUICK_QUERIES.map((query) => (
              <button
                key={query}
                className="rounded border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
                onClick={() => setCompany(query)}
                type="button"
              >
                {query}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}
      </div>

      {/* Split workspace: chat (top) + matrix (bottom) */}
      <div className="flex min-h-0 flex-1 flex-col" ref={splitRef}>
        <div
          className="flex min-h-0 flex-col overflow-hidden"
          style={{ flex: `${chatRatio} 1 0%` }}
        >
          <ResearchChat
            companyName={report?.companyName}
            report={report}
            variant="pane"
          />
        </div>

        <button
          aria-label="Resize chat and matrix panes"
          className={cn(
            "group relative z-10 flex h-2 shrink-0 cursor-row-resize items-center justify-center border-y border-border bg-muted/40 transition-colors hover:bg-primary/10",
            isDragging && "bg-primary/15",
          )}
          onMouseDown={() => setIsDragging(true)}
          type="button"
        >
          <span className="h-0.5 w-10 rounded-full bg-border transition-colors group-hover:bg-primary/40" />
        </button>

        <div
          className="flex min-h-0 flex-col overflow-hidden"
          style={{ flex: `${1 - chatRatio} 1 0%` }}
        >
          {hasMatrix ? (
            <ResearchMatrix evidence={evidence!} report={report!} variant="pane" />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-muted/10 text-center text-muted-foreground">
              <p className="text-sm font-medium">Research matrix</p>
              <p className="mt-1 max-w-sm text-xs">
                Run a company through the agent to populate the evidence matrix
                with documents, risks, and market considerations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
