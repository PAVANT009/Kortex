"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Folder,
  LayoutDashboard,
  Menu,
  Orbit,
  Search,
  Settings,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";
import type { RecentResearchRun } from "@/modules/research/server/repository";

import { UserAccountMenu } from "./user-account-menu";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    email: string;
    id: string;
    image?: string | null;
    name: string;
  };
};

const navigationItems = [
  {
    description: "Overview and quick links",
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    description: "Run company research",
    href: "/research",
    icon: Search,
    label: "Research",
  },
  {
    description: "Past reports and verdicts",
    href: "/history",
    icon: Clock3,
    label: "History",
  },
  {
    description: "Bookmarked memos",
    href: "/saved",
    icon: Bookmark,
    label: "Saved",
  },
  {
    description: "Tracked companies",
    href: "/watchlist",
    icon: Star,
    label: "Watchlist",
  },
  {
    description: "Account preferences",
    href: "/settings",
    icon: Settings,
    label: "Settings",
  },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getHeaderTitle(pathname: string) {
  if (pathname.startsWith("/research/")) return "Research Report";
  if (pathname.startsWith("/research")) return "Research Workspace";
  if (pathname.startsWith("/history")) return "Research History";
  if (pathname.startsWith("/saved")) return "Saved Reports";
  if (pathname.startsWith("/watchlist")) return "Watchlist";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/profile")) return "Profile";
  return "Dashboard";
}

function groupRunsByDate(runs: RecentResearchRun[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayRuns: RecentResearchRun[] = [];
  const yesterdayRuns: RecentResearchRun[] = [];
  const olderRuns: RecentResearchRun[] = [];

  for (const run of runs) {
    const created = new Date(run.createdAt);
    created.setHours(0, 0, 0, 0);
    if (created.getTime() === today.getTime()) todayRuns.push(run);
    else if (created.getTime() === yesterday.getTime()) yesterdayRuns.push(run);
    else olderRuns.push(run);
  }

  return { olderRuns, todayRuns, yesterdayRuns };
}

function groupRunsByCompany(runs: RecentResearchRun[]) {
  const groups = new Map<string, RecentResearchRun[]>();

  for (const run of runs) {
    const company = run.resolvedCompanyName ?? run.companyQuery;
    const existing = groups.get(company) ?? [];
    existing.push(run);
    groups.set(company, existing);
  }

  return Array.from(groups.entries())
    .map(([company, companyRuns]) => ({
      company,
      runs: companyRuns.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }))
    .sort((a, b) => b.runs.length - a.runs.length);
}

function RecentRunLink({
  active,
  run,
}: {
  active: boolean;
  run: RecentResearchRun;
}) {
  const label = run.resolvedCompanyName ?? run.companyQuery;
  return (
    <Link
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
      href={`/research/${run.id}`}
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ProjectGroup({
  company,
  pathname,
  runs,
}: {
  company: string;
  pathname: string;
  runs: RecentResearchRun[];
}) {
  const hasActive = runs.some((run) => pathname === `/research/${run.id}`);
  const [expanded, setExpanded] = useState(hasActive || runs.length <= 2);

  return (
    <div className="space-y-0.5">
      <button
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
        <Folder className="size-3.5 shrink-0" />
        <span className="truncate font-medium">{company}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {runs.length}
        </span>
      </button>

      {expanded ? (
        <div className="ml-5 space-y-0.5 border-l border-border/60 pl-2">
          {runs.map((run) => (
            <RecentRunLink
              key={run.id}
              active={pathname === `/research/${run.id}`}
              run={run}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarRunGroups({
  pathname,
  runs,
}: {
  pathname: string;
  runs: RecentResearchRun[];
}) {
  const { olderRuns, todayRuns, yesterdayRuns } = groupRunsByDate(runs);
  const projectGroups = useMemo(() => groupRunsByCompany(runs), [runs]);

  if (runs.length === 0) {
    return (
      <div className="mb-6 px-3">
        <p className="px-2 text-xs text-muted-foreground">
          No research runs yet. Start one from Research.
        </p>
      </div>
    );
  }

  return (
    <>
      {todayRuns.length > 0 ? (
        <div className="mb-5 px-3">
          <h3 className="mb-1 px-2 text-xs font-medium text-muted-foreground">
            Today
          </h3>
          <div className="space-y-0.5">
            {todayRuns.map((run) => (
              <RecentRunLink
                key={run.id}
                active={pathname === `/research/${run.id}`}
                run={run}
              />
            ))}
          </div>
        </div>
      ) : null}

      {yesterdayRuns.length > 0 ? (
        <div className="mb-5 px-3">
          <h3 className="mb-1 px-2 text-xs font-medium text-muted-foreground">
            Yesterday
          </h3>
          <div className="space-y-0.5">
            {yesterdayRuns.map((run) => (
              <RecentRunLink
                key={run.id}
                active={pathname === `/research/${run.id}`}
                run={run}
              />
            ))}
          </div>
        </div>
      ) : null}

      {olderRuns.length > 0 ? (
        <div className="mb-5 px-3">
          <h3 className="mb-1 px-2 text-xs font-medium text-muted-foreground">
            Earlier
          </h3>
          <div className="space-y-0.5">
            {olderRuns.map((run) => (
              <RecentRunLink
                key={run.id}
                active={pathname === `/research/${run.id}`}
                run={run}
              />
            ))}
          </div>
        </div>
      ) : null}

      {projectGroups.length > 1 ? (
        <div className="mb-6 px-3">
          <h3 className="mb-1 px-2 text-xs font-medium text-muted-foreground">
            Projects
          </h3>
          <div className="space-y-1">
            {projectGroups.map((group) => (
              <ProjectGroup
                key={group.company}
                company={group.company}
                pathname={pathname}
                runs={group.runs}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function DesktopNav({
  isCollapsed,
  pathname,
}: {
  isCollapsed: boolean;
  pathname: string;
}) {
  if (isCollapsed) {
    return (
      <nav className="mb-4 space-y-1 px-2">
        {navigationItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              className={cn(
                "flex size-9 items-center justify-center rounded-md transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
              href={item.href}
              title={item.label}
            >
              <Icon className="size-4" />
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="mb-4 space-y-0.5 px-3">
      {navigationItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
            href={item.href}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RecentResearchRun[]>([]);
  const isResearchWorkspace =
    pathname === "/research" || pathname.startsWith("/research/");

  useEffect(() => {
    let cancelled = false;

    async function loadRecentRuns() {
      try {
        const response = await fetch("/api/research", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (!cancelled && Array.isArray(payload.recentRuns)) {
          setRecentRuns(payload.recentRuns);
        }
      } catch {
        // Sidebar stays empty if the fetch fails.
      }
    }

    void loadRecentRuns();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "hidden border-r border-border bg-sidebar lg:flex lg:flex-col",
            isCollapsed ? "lg:w-16" : "lg:w-[260px]",
          )}
        >
          <div className="flex h-14 items-center justify-between px-4 py-4">
            <Link
              className={cn(
                "flex min-w-0 items-center gap-2 text-primary",
                isCollapsed && "justify-center",
              )}
              href="/dashboard"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Orbit className="size-5" />
              </div>
              {!isCollapsed ? (
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  Hebbia
                </span>
              ) : null}
            </Link>

            {!isCollapsed ? (
              <Button
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsCollapsed(true)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ChevronLeft className="size-4" />
              </Button>
            ) : null}
          </div>

          <div
            className="flex-1 overflow-y-auto py-2"
            onClick={() => isCollapsed && setIsCollapsed(false)}
          >
            <DesktopNav isCollapsed={isCollapsed} pathname={pathname} />

            {!isCollapsed ? (
              <SidebarRunGroups pathname={pathname} runs={recentRuns} />
            ) : null}
          </div>

          <div className="border-t border-border p-3">
            <UserAccountMenu compact={isCollapsed} user={user} />
          </div>
        </aside>

        {isMobileOpen ? (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden">
            <button
              aria-label="Close navigation drawer"
              className="absolute inset-0"
              onClick={() => setIsMobileOpen(false)}
              type="button"
            />
            <aside className="relative flex h-full w-[88vw] max-w-sm flex-col border-r border-border/70 bg-background p-4 shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
                <Link
                  className="flex items-center gap-3"
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <Orbit className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em]">
                      Hebbia
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Investment research workspace
                    </p>
                  </div>
                </Link>

                <Button
                  onClick={() => setIsMobileOpen(false)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto py-4">
                {navigationItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-[1.4rem] border border-transparent px-3 py-3 text-sm transition",
                        active
                          ? "border-border/70 bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground",
                      )}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/40",
                          active && "bg-primary text-primary-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{item.label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-border/70 pt-4">
                <UserAccountMenu user={user} />
              </div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 sm:px-6">
            <Button
              className="lg:hidden"
              onClick={() => setIsMobileOpen(true)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Menu className="size-4" />
            </Button>

            <div className="flex flex-1 items-center gap-4 text-sm font-medium text-muted-foreground">
              <span className="text-foreground">{getHeaderTitle(pathname)}</span>
            </div>

            <div className="flex items-center gap-2">
              <AnimatedThemeToggler />
              <UserAccountMenu align="right" compact user={user} />
            </div>
          </header>

          <main
            className={cn(
              "flex-1 bg-background/50",
              isResearchWorkspace ? "overflow-hidden p-0" : "overflow-auto p-4 sm:p-6",
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
