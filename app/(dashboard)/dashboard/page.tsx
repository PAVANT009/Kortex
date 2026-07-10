import { TrendingUp, Wallet, Zap } from "lucide-react";

import { getSession } from "@/lib/get-session";

const cards = [
  {
    description: "Access your portfolio workflows and AI finance tools.",
    icon: Wallet,
    title: "Portfolio Center",
  },
  {
    description: "Track the parts of your assistant that are ready for action.",
    icon: Zap,
    title: "Automation Status",
  },
  {
    description: "Use the dashboard as the entry point for research and execution.",
    icon: TrendingUp,
    title: "Market Readiness",
  },
];

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-border/70 bg-background px-6 py-8 shadow-sm sm:px-8">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Your authentication flow is active. Use this workspace as the starting
          point for portfolio reviews, watchlists, and agent-driven finance
          tasks.
        </p>
      </section>

      <section
        id="market-snapshot"
        className="grid gap-4 md:grid-cols-3"
      >
        {cards.map(({ description, icon: Icon, title }) => (
          <article
            key={title}
            className="rounded-3xl border border-border/70 bg-background p-6 shadow-sm"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Icon className="size-5" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </article>
        ))}
      </section>

      <section
        id="watchlist"
        className="rounded-3xl border border-dashed border-border bg-background/70 p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Next step</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Connect the rest of the finance features to this authenticated
          dashboard and keep protected pages under the same dashboard group.
        </p>
      </section>
    </div>
  );
}
