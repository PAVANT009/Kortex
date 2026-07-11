import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/get-session";
import { getResearchHistory } from "@/modules/research/server/repository";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function HistoryPage() {
  const session = await getSession();
  const history = await getResearchHistory(25, session?.user.id ?? null).catch(
    () => [],
  );

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          History
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Research history
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
          Completed research runs with verdicts, tickers, and quick links back to
          the full memo.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No completed research runs yet.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/research">
              Start a research run
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Ticker</th>
                  <th className="px-4 py-3 font-medium">Verdict</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10">
                    <td className="px-4 py-4 font-medium">
                      {item.resolvedCompanyName ?? item.companyQuery}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.ticker ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      {item.decision ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.decision === "INVEST"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-rose-500/10 text-rose-700"
                          }`}
                        >
                          {item.decision}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.confidence != null ? `${item.confidence}%` : "—"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDate(item.completedAt ?? item.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="text-sm font-medium text-primary hover:underline"
                        href={`/research/${item.id}`}
                      >
                        Open report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
