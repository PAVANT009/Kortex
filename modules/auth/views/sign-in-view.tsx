"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { FaGoogle } from "react-icons/fa";

import { authClient } from "@/lib/auth-client";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Button } from "@/components/ui/button";

export const SignInView = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await authClient.signIn.social({
        callbackURL: "/dashboard",
        provider: "google",
      });
    } catch {
      setLoading(false);
      setError("Unable to start Google sign-in. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background bg-dot-grid">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-border/60 bg-card p-12">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Meridian</span>
        </div>

        <div>
          <blockquote className="space-y-3">
            <p className="text-lg font-medium leading-8 text-foreground">
              "An investment in knowledge pays the best interest."
            </p>
            <footer className="text-sm text-muted-foreground">
              — Benjamin Franklin
            </footer>
          </blockquote>
        </div>

        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/60" />
            <span>Data Coverage</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-base font-semibold tabular-nums text-foreground">10k+</p>
              <p>Public Equities</p>
            </div>
            <div>
              <p className="text-base font-semibold tabular-nums text-foreground">Real-time</p>
              <p>Market Data</p>
            </div>
            <div>
              <p className="text-base font-semibold tabular-nums text-foreground">AI-Cited</p>
              <p>Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: sign-in form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="absolute right-4 top-4">
          <AnimatedThemeToggler />
        </div>

        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Meridian</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in to your workspace
            </h1>
            <p className="text-sm text-muted-foreground leading-6">
              Continue with your Google account. A workspace is created automatically on first sign-in.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full gap-2.5 h-10"
              disabled={loading}
              onClick={handleGoogleSignIn}
              type="button"
            >
              <FaGoogle className="size-3.5" />
              {loading ? "Redirecting to Google…" : "Continue with Google"}
            </Button>

            {error ? (
              <p className="text-center text-xs text-destructive">{error}</p>
            ) : null}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our terms of use.
            <br />
            This is a research screener, not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
};
