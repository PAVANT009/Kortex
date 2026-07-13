import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/get-session";
import { yahooFinance } from "@/modules/research/server/providers/yahoo";

type SearchQuote = {
  isYahooFinance?: boolean;
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
};

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const searchResults = await yahooFinance.search(query);
    const quotes = searchResults.quotes as SearchQuote[];

    const results = quotes
      .filter(
        (quote): quote is SearchQuote & { symbol: string } =>
          Boolean(
            quote.isYahooFinance &&
              quote.symbol &&
              (quote.shortname || quote.longname),
          ),
      )
      .slice(0, 8)
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname,
        type: quote.quoteType,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching companies:", error);
    return NextResponse.json({ results: [] });
  }
}
