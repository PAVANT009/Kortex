import Link from "next/link";
import { ArrowRight, BarChart3, LockKeyhole } from "lucide-react";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/get-session";
import { ResearchWorkspace } from "@/modules/research/components/research-workspace";
import { getRecentCompletedRuns } from "@/modules/research/server/repository";

export const dynamic = "force-dynamic";

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    company?: string | string[];
    run?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const [session, recentRuns] = await Promise.all([
    getSession().catch(() => null),
    getRecentCompletedRuns(6).catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full flex-col">
        {/* ── Professional top navigation bar ── */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="size-6" />
            <span className="font-bold text-xl tracking-tight text-foreground">
              Meridian
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AnimatedThemeToggler />
            {session ? (
              <Button asChild size="sm">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">
                  <LockKeyhole className="size-3.5" />
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-hidden bg-background/50 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto h-full w-full max-w-7xl">
            <ResearchWorkspace
              initialCompanyQuery={getFirstValue(params.company) ?? ""}
              initialRecentRuns={recentRuns}
              initialRunId={getFirstValue(params.run)}
              mode="public"
            />
          </div>
        </main>

        <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          Meridian · Research screener, not financial advice · Data via Yahoo Finance
        </footer>
      </div>
    </div>
  );
}
