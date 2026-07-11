import { UserRound } from "lucide-react";

import { getSession } from "@/lib/get-session";

function formatDate(value: unknown) {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(parsed);
}

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const createdAt =
    "createdAt" in session.user ? session.user.createdAt : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section className="rounded-[2rem] border border-border/70 bg-background/90 p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-[1.75rem] bg-muted/50 text-foreground">
            <UserRound className="size-7" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {session.user.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-border/70 bg-muted/35 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              User ID
            </p>
            <p className="mt-2 text-sm font-medium">{session.user.id}</p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-muted/35 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Account Created
            </p>
            <p className="mt-2 text-sm font-medium">{formatDate(createdAt)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-background/90 p-6 shadow-sm sm:p-7">
        <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
          Next Phase
        </p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight">
          Profile analytics will be added here.
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          This page is ready for report counts, saved report totals, watchlist
          totals, recent activity, and account management actions once those
          user-owned tables and queries are added.
        </p>
      </section>
    </div>
  );
}
