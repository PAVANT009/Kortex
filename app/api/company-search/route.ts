import { NextRequest, NextResponse } from "next/server";
import { yahooFinance } from "@/modules/research/server/providers/yahoo";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const searchResults = await yahooFinance.search(query);
    console.log("Yahoo Finance search results:", JSON.stringify(searchResults, null, 2));
    
    const results = searchResults.quotes
      .filter((quote: any) => quote.isYahooFinance)
      .slice(0, 8)
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname,
        type: quote.quoteType,
      }));

    console.log("Filtered results:", results);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching companies:", error);
    return NextResponse.json({ results: [] });
  }
}
