import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ZodError } from "zod";

import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { getSession } from "@/lib/get-session";
import { watchlistRequestSchema } from "@/modules/research/schemas/input";

export async function GET(request: NextRequest) {
  void request;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const watchlistItems = await db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, session.user.id))
      .orderBy(desc(watchlist.addedAt));

    return NextResponse.json({ watchlist: watchlistItems });
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json({ error: "Failed to fetch watchlist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = watchlistRequestSchema.parse(body);

    const existingRows = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.ticker, payload.ticker),
        ),
      )
      .limit(1);

    const existing = existingRows[0];
    if (existing) {
      return NextResponse.json({ watchlistItem: existing });
    }

    const inserted = await db
      .insert(watchlist)
      .values({
        id: nanoid(),
        userId: session.user.id,
        companyName: payload.companyName,
        ticker: payload.ticker,
        notes: payload.notes,
      })
      .onConflictDoNothing({
        target: [watchlist.userId, watchlist.ticker],
      })
      .returning();

    const watchlistItem = inserted[0];
    if (watchlistItem) {
      return NextResponse.json({ watchlistItem }, { status: 201 });
    }

    const duplicateRows = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.ticker, payload.ticker),
        ),
      )
      .limit(1);

    const duplicate = duplicateRows[0];
    if (duplicate) {
      return NextResponse.json({ watchlistItem: duplicate });
    }

    return NextResponse.json(
      { error: "Failed to add to watchlist" },
      { status: 500 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid company and ticker." },
        { status: 400 },
      );
    }

    console.error("Error adding to watchlist:", error);
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 });
  }
}
