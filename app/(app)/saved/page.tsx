"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bookmark,
  ExternalLink,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SavedReport = {
  id: string;
  runId: string;
  companyName: string;
  ticker: string;
  decision: "INVEST" | "PASS";
  savedAt: string;
  createdAt: string | null;
};

export default function SavedPage() {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSavedReports() {
      try {
        const response = await fetch("/api/saved");
        if (!response.ok) throw new Error("Failed to fetch saved reports");
        const data = await response.json();
        setSavedReports(data.savedReports || []);
      } catch {
        setError("Failed to load saved reports");
      } finally {
        setLoading(false);
      }
    }

    void fetchSavedReports();
  }, []);

  async function handleUnsave(id: string) {
    try {
      const response = await fetch(`/api/saved/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to unsave");
      setSavedReports((previous) =>
        previous.filter((report) => report.id !== id),
      );
    } catch {
      setError("Failed to unsave report");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading saved reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (savedReports.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <Bookmark className="mb-4 size-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No saved reports yet</h3>
        <p className="mb-4 text-muted-foreground">
          Save research reports to view them here later
        </p>
        <Button asChild>
          <Link href="/research">Create a Report</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Saved Reports
          </h1>
          <p className="text-muted-foreground">
            {savedReports.length}{" "}
            {savedReports.length === 1 ? "report" : "reports"} saved
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {savedReports.map((report) => (
          <div
            key={report.id}
            className="rounded-xl border border-border/70 bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <Link
                    className="text-lg font-semibold transition-colors hover:text-primary"
                    href={`/research/${report.runId}`}
                  >
                    {report.companyName}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    ({report.ticker})
                  </span>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                      report.decision === "INVEST"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400",
                    )}
                  >
                    {report.decision === "INVEST" ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {report.decision}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Saved {new Date(report.savedAt).toLocaleDateString()}
                  </span>
                  <span>|</span>
                  <span>
                    Created{" "}
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/research/${report.runId}`}>
                    <ExternalLink className="mr-2 size-4" />
                    View
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => void handleUnsave(report.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
