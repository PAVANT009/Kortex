"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WatchlistItem = {
  id: string;
  companyName: string;
  ticker: string;
  notes: string | null;
  addedAt: string;
};

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const response = await fetch("/api/watchlist");
        if (!response.ok) throw new Error("Failed to fetch watchlist");
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      } catch {
        setError("Failed to load watchlist");
      } finally {
        setLoading(false);
      }
    }

    void fetchWatchlist();
  }, []);

  async function handleAddToWatchlist() {
    if (!newCompanyName || !newTicker) return;

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: newCompanyName,
          ticker: newTicker,
          notes: newNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add to watchlist");
      }

      const data = (await response.json()) as { watchlistItem: WatchlistItem };
      setWatchlist((previous) => {
        const withoutDuplicate = previous.filter(
          (item) => item.id !== data.watchlistItem.id,
        );
        return [data.watchlistItem, ...withoutDuplicate];
      });
      setNewTicker("");
      setNewCompanyName("");
      setNewNotes("");
      setShowAddForm(false);
    } catch (watchlistError) {
      setError(
        watchlistError instanceof Error
          ? watchlistError.message
          : "Failed to add to watchlist",
      );
    }
  }

  async function handleRemoveFromWatchlist(id: string) {
    try {
      const response = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove from watchlist");
      setWatchlist((previous) => previous.filter((item) => item.id !== id));
    } catch {
      setError("Failed to remove from watchlist");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading watchlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
          <p className="text-muted-foreground">
            {watchlist.length}{" "}
            {watchlist.length === 1 ? "company" : "companies"} tracked
          </p>
        </div>
        <Button onClick={() => setShowAddForm((current) => !current)}>
          <Plus className="mr-2 size-4" />
          Add Company
        </Button>
      </div>

      {showAddForm ? (
        <div className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">
            Add Company to Watchlist
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Company Name
              </label>
              <Input
                placeholder="e.g., Apple Inc."
                value={newCompanyName}
                onChange={(event) => setNewCompanyName(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Ticker Symbol
              </label>
              <Input
                placeholder="e.g., AAPL"
                value={newTicker}
                onChange={(event) =>
                  setNewTicker(event.target.value.toUpperCase())
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Notes (optional)
              </label>
              <Input
                placeholder="Add any notes about this company"
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void handleAddToWatchlist()}>
                Add to Watchlist
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {watchlist.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <Star className="mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Watchlist is empty</h3>
          <p className="mb-4 text-muted-foreground">
            Add companies to your watchlist to track them
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 size-4" />
            Add Company
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border/70 bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <Link
                      className="text-lg font-semibold transition-colors hover:text-primary"
                      href={`/research?company=${item.ticker}`}
                    >
                      {item.companyName}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      ({item.ticker})
                    </span>
                  </div>

                  {item.notes ? (
                    <p className="mb-3 text-sm text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/research?company=${item.ticker}`}>
                      <Search className="mr-2 size-4" />
                      Research
                    </Link>
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => void handleRemoveFromWatchlist(item.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
