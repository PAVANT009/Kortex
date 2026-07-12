import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
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
    const { companyName, ticker, notes } = body;

    if (!companyName || !ticker) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if already in watchlist
    const existing = await db
      .select()
      .from(watchlist)
      .where(and(eq(watchlist.userId, session.user.id), eq(watchlist.ticker, ticker)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Company already in watchlist" }, { status: 409 });
    }

    const added = await db
      .insert(watchlist)
      .values({
        id: nanoid(),
        userId: session.user.id,
        companyName,
        ticker,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ watchlistItem: added[0] }, { status: 201 });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 });
  }
}
