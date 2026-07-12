"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink, Trash2, TrendingUp, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SavedReport = {
  id: string;
  reportId: string;
  runId: string;
  companyName: string;
  ticker: string;
  decision: "INVEST" | "PASS";
  savedAt: string;
  createdAt: string;
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
      } catch (err) {
        setError("Failed to load saved reports");
      } finally {
        setLoading(false);
      }
    }

    fetchSavedReports();
  }, []);

  async function handleUnsave(id: string) {
    try {
      const response = await fetch(`/api/saved/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to unsave");
      setSavedReports((prev) => prev.filter((report) => report.id !== id));
    } catch (err) {
      setError("Failed to unsave report");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading saved reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (savedReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Bookmark className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No saved reports yet</h3>
        <p className="text-muted-foreground mb-4">
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
          <h1 className="text-2xl font-semibold tracking-tight">Saved Reports</h1>
          <p className="text-muted-foreground">
            {savedReports.length} {savedReports.length === 1 ? "report" : "reports"} saved
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
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    className="text-lg font-semibold hover:text-primary transition-colors"
                    href={`/research/${report.runId}`}
                  >
                    {report.companyName}
                  </Link>
                  <span className="text-sm text-muted-foreground">({report.ticker})</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
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
                  <span>Saved {new Date(report.savedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Created {new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                >
                  <Link href={`/research/${report.runId}`}>
                    <ExternalLink className="size-4 mr-2" />
                    View
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleUnsave(report.id)}
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
