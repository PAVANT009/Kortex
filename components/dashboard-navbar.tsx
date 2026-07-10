"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LineChart, LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

type DashboardNavbarProps = {
  user: {
    email: string;
    name: string;
  };
};

export function DashboardNavbar({ user }: DashboardNavbarProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    setError(null);

    startTransition(() => {
      void authClient.signOut(undefined, {
        onError: ({ error }: { error: { message: string } }) => {
          setError(error.message);
        },
        onSuccess: () => {
          router.replace("/sign-in");
          router.refresh();
        },
      });
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <LineChart className="size-5" />
            </div>
            <div>
              <Link
                className="text-sm font-semibold tracking-[0.2em] uppercase"
                href="/dashboard"
              >
                AI Finance Agent
              </Link>
              <p className="text-sm text-muted-foreground">
                Secure workspace for authenticated users
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
              href="/dashboard"
            >
              Overview
            </Link>
            <Link
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
              href="/dashboard#market-snapshot"
            >
              Snapshot
            </Link>
            <Link
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
              href="/dashboard#watchlist"
            >
              Watchlist
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AnimatedThemeToggler />
            <Button
              className="gap-2"
              disabled={isPending}
              onClick={handleSignOut}
              variant="outline"
            >
              <LogOut className="size-4" />
              {isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </header>
  );
}
