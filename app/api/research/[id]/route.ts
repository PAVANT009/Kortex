import { NextResponse } from "next/server";

import { getSession } from "@/lib/get-session";
import { getResearchResultByRunId } from "@/modules/research/server/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await getResearchResultByRunId(id, session.user.id);

  if (!result) {
    return NextResponse.json(
      {
        error: `No research report was found for run "${id}".`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
