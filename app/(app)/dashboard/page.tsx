import Link from "next/link";
import {
  ArrowRight,
  Search,
  Settings,
  Sparkles,
  Star,
  UserRound,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/get-session";

const quickLinks = [
  {
    description: "Run a new company screen and generate a structured recommendation memo.",
    href: "/research",
    icon: Search,
    title: "Start New Research",
  },
  {
    description: "Review completed runs and prepare the reporting experience for sorting and filters.",
    href: "/history",
    icon: Sparkles,
    title: "Research History",
  },
  {
    description: "Keep strong memos close at hand and evolve a saved-report workflow.",
    href: "/saved",
    icon: Star,
    title: "Saved Reports",
  },
  {
    description: "Track companies worth revisiting once watchlist persistence is added.",
    href: "/watchlist",
    icon: WalletCards,
    title: "Watchlist",
  },
  {
    description: "Review identity details and account-level research ownership.",
    href: "/profile",
    icon: UserRound,
    title: "Profile",
  },
  {
    description: "Configure appearance and the preference model that will guide future prompts.",
    href: "/settings",
    icon: Settings,
    title: "Settings",
  },
] as const;

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(244,114,35,0.08),rgba(15,118,110,0.06),transparent_70%)] px-6 py-8 shadow-sm sm:px-8">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
          Workspace
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, {firstName}.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          The authenticated shell is now in place: protected routes, app-wide
          navigation, a mobile drawer, and private research entrypoints all live
          under the same SaaS layout. The next build phases will connect
          user-scoped metrics, saved reports, watchlists, and follow-up chat.
        </p>

        <div className="mt-6">
          <Button asChild className="rounded-full px-4">
            <Link href="/research">
              Open Research Workspace
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {quickLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="rounded-[1.75rem] border border-border/70 bg-background/90 p-6 shadow-sm transition hover:border-foreground/20 hover:bg-background"
              href={item.href}
              key={item.href}
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/45 text-foreground">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
