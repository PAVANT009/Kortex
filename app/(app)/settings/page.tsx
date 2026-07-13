"use client";

import { Palette, ShieldCheck, SlidersHorizontal, Moon, Sun, Monitor } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "system";
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
    return savedTheme;
  }

  return "system";
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [riskTolerance, setRiskTolerance] = useState("moderate");
  const [investmentHorizon, setInvestmentHorizon] = useState("medium");
  const [marketFocus, setMarketFocus] = useState("us");
  const [aiDetailLevel, setAiDetailLevel] = useState("balanced");

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "system") {
      localStorage.removeItem("theme");
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="space-y-8">
      {/* Appearance Section */}
      <section className="rounded-[1.8rem] border border-border/70 bg-background/90 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted/45 text-foreground">
            <Palette className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Appearance</h2>
            <p className="text-sm text-muted-foreground">Customize your visual experience</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light", icon: Sun, label: "Light" },
                { value: "dark", icon: Moon, label: "Dark" },
                { value: "system", icon: Monitor, label: "System" },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value as Theme)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                      theme === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/50",
                    )}
                    type="button"
                  >
                    <Icon className="size-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Research Preferences Section */}
      <section className="rounded-[1.8rem] border border-border/70 bg-background/90 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted/45 text-foreground">
            <SlidersHorizontal className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Research Preferences</h2>
            <p className="text-sm text-muted-foreground">Configure your investment research settings</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Risk Tolerance</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "conservative", label: "Conservative" },
                { value: "moderate", label: "Moderate" },
                { value: "aggressive", label: "Aggressive" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRiskTolerance(option.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    riskTolerance === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/50",
                  )}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Investment Horizon</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "short", label: "Short-term (< 1yr)" },
                { value: "medium", label: "Medium-term (1-3yr)" },
                { value: "long", label: "Long-term (3+ yr)" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setInvestmentHorizon(option.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    investmentHorizon === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/50",
                  )}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Market Focus</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "us", label: "US Markets" },
                { value: "global", label: "Global Markets" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMarketFocus(option.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    marketFocus === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/50",
                  )}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">AI Detail Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "concise", label: "Concise" },
                { value: "balanced", label: "Balanced" },
                { value: "detailed", label: "Detailed" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAiDetailLevel(option.value)}
                  className={cn(
                    "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    aiDetailLevel === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/50",
                  )}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Account Controls Section */}
      <section className="rounded-[1.8rem] border border-border/70 bg-background/90 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted/45 text-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Account Controls</h2>
            <p className="text-sm text-muted-foreground">Manage your account and data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Data Providers</p>
              <p className="text-xs text-muted-foreground">Manage connected data sources</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Export Data</p>
              <p className="text-xs text-muted-foreground">Download your research history</p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium text-destructive">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button className="rounded-2xl">Save Changes</Button>
      </div>
    </div>
  );
}
