import { NextResponse } from "next/server";

import { getSession } from "@/lib/get-session";
import { researchRequestSchema } from "@/modules/research/schemas/input";
import { researchResponseSchema } from "@/modules/research/schemas/report";
import {
  createResearchRun,
  failResearchRun,
  getRecentCompletedRuns,
} from "@/modules/research/server/repository";
import { runInvestmentResearch } from "@/modules/research/server/run-research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to complete research.";
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recentRuns = await getRecentCompletedRuns(
      8,
      session.user.id,
    );
    return NextResponse.json({ recentRuns });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let runId: string | null = null;

  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsedPayload = researchRequestSchema.safeParse(json);
    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Please enter a valid company name.",
          issues: parsedPayload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const payload = parsedPayload.data;
    const run = await createResearchRun(payload.company, session.user.id);

    runId = run.id;

    const result = await runInvestmentResearch({
      companyQuery: payload.company,
      runId,
    });

    return NextResponse.json(researchResponseSchema.parse(result));
  } catch (error) {
    if (runId) {
      await failResearchRun(runId, getErrorMessage(error));
    }

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
