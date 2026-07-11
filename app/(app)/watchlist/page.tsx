import { AppEmptyState } from "@/components/layout/app-empty-state";

export default function WatchlistPage() {
  return (
    <AppEmptyState
      actionHref="/research"
      actionLabel="Research a Company"
      description="The watchlist route is live and sits in the new app shell. The next phase will add watchlist storage, latest available quote summaries, and relaunch actions for existing companies."
      eyebrow="Watchlist"
      title="Watchlist support is scaffolded."
    />
  );
}
