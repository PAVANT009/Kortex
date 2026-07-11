import { NextResponse } from "next/server";

import { getResearchResultByRunId } from "@/modules/research/server/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await getResearchResultByRunId(id);

  if (!result) {
    return NextResponse.json(
      {
        error: `No saved report was found for run "${id}".`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
