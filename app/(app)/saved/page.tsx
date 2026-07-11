import { AppEmptyState } from "@/components/layout/app-empty-state";

export default function SavedPage() {
  return (
    <AppEmptyState
      actionHref="/research"
      actionLabel="Create a Report"
      description="Saved reports will land here once report persistence is extended with user-specific saved state. This page is now part of the authenticated product flow and ready for those data hooks."
      eyebrow="Saved"
      title="Saved reports are ready for data wiring."
    />
  );
}
