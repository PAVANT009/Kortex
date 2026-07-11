import { getSession } from "@/lib/get-session";
import { ResearchWorkspace } from "@/modules/research/components/research-workspace";
import { getRecentCompletedRuns } from "@/modules/research/server/repository";

export const dynamic = "force-dynamic";

export default async function ResearchReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const session = await getSession();
  const recentRuns = await getRecentCompletedRuns(
    8,
    session?.user.id ?? null,
  ).catch(() => []);
  const firstName = session?.user.name?.split(" ")[0] ?? null;

  return (
    <ResearchWorkspace
      initialRecentRuns={recentRuns}
      initialRunId={reportId}
      mode="dashboard"
      viewerName={firstName}
    />
  );
}
