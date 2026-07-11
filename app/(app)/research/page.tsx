import { getSession } from "@/lib/get-session";
import { ResearchWorkspace } from "@/modules/research/components/research-workspace";
import { getRecentCompletedRuns } from "@/modules/research/server/repository";

export const dynamic = "force-dynamic";

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    company?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const recentRuns = await getRecentCompletedRuns(
    8,
    session?.user.id ?? null,
  ).catch(() => []);
  const initialCompanyQuery = Array.isArray(params.company)
    ? params.company[0] ?? ""
    : params.company ?? "";
  const firstName = session?.user.name?.split(" ")[0] ?? null;

  return (
    <ResearchWorkspace
      initialCompanyQuery={initialCompanyQuery}
      initialRecentRuns={recentRuns}
      mode="dashboard"
      viewerName={firstName}
    />
  );
}
