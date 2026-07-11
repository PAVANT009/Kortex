"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BarChart3, LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

type DashboardNavbarProps = {
  user: {
    email: string;
    name: string;
  };
};

const NAV_LINKS = [
  { href: "/dashboard", label: "Research" },
  { href: "/dashboard#decision", label: "Verdict" },
  { href: "/dashboard#sources", label: "Sources" },
  { href: "/", label: "Public Demo" },
];

export function DashboardNavbar({ user }: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Top bar: logo + user controls ── */}
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="size-3.5" />
            </div>
            <div>
              <Link
                className="text-sm font-semibold tracking-tight text-foreground"
                href="/dashboard"
              >
                Meridian
              </Link>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                Investment Research
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <AnimatedThemeToggler />
            <Button
              className="h-8 gap-1.5 text-xs"
              disabled={isPending}
              onClick={handleSignOut}
              variant="outline"
              size="sm"
            >
              <LogOut className="size-3" />
              {isPending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>

        {/* ── Bottom tab navigation ── */}
        <nav className="flex items-center gap-0 -mb-px">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2.5 text-sm border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {error ? (
        <div className="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive text-center">
          {error}
        </div>
      ) : null}
    </header>
  );
}
