"use client";

import { useState } from "react";
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
      setError("Unable to start Google sign-in.");
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="fixed right-4 top-4">
        <AnimatedThemeToggler />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card px-6 py-8 text-card-foreground shadow-lg shadow-black/5">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Continue with Google
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            This app uses Google as the only sign-in method. Your account is
            created automatically the first time you continue.
          </p>
        </div>

        <div className="mt-8">
          <Button
            className="w-full gap-2"
            disabled={loading}
            onClick={handleGoogleSignIn}
            size="lg"
            type="button"
          >
            <FaGoogle />
            {loading ? "Redirecting to Google..." : "Continue with Google"}
          </Button>
        </div>

        {error ? (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  );
};
