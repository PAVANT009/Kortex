import { resolvedCompanySchema, type ResolvedCompany } from "@/modules/research/schemas/evidence";

import { yahooFinance } from "../providers/yahoo";

function scoreCandidate(
  query: string,
  quote: {
    longname?: string;
    quoteType?: string;
    score: number;
    shortname?: string;
    symbol: string;
  },
) {
  const normalizedQuery = query.trim().toLowerCase();
  const shortName = quote.shortname?.toLowerCase() ?? "";
  const longName = quote.longname?.toLowerCase() ?? "";
  const symbol = quote.symbol.toLowerCase();

  let boost = quote.score;
  if (symbol === normalizedQuery) boost += 100;
  if (shortName === normalizedQuery || longName === normalizedQuery) boost += 50;
  if (shortName.includes(normalizedQuery) || longName.includes(normalizedQuery)) {
    boost += 15;
  }
  if (quote.quoteType === "EQUITY") boost += 25;

  return boost;
}

export async function resolveCompany(query: string): Promise<ResolvedCompany> {
  const search = await yahooFinance.search(query, {
    enableFuzzyQuery: true,
    newsCount: 0,
    quotesCount: 8,
  });
  type SearchQuote = (typeof search.quotes)[number];
  type YahooQuote = Extract<SearchQuote, { isYahooFinance: true }>;

  const candidates = search.quotes
    .filter(
      (quote): quote is YahooQuote =>
        quote.isYahooFinance === true && "symbol" in quote,
    )
    .sort((a, b) => scoreCandidate(query, b) - scoreCandidate(query, a));

  const winner = candidates[0];
  if (!winner) {
    throw new Error(`No Yahoo Finance match found for "${query}".`);
  }

  return resolvedCompanySchema.parse({
    exchange: winner.exchange ?? winner.exchDisp ?? null,
    industry: winner.industry ?? null,
    longName: winner.longname ?? null,
    query,
    quoteType: winner.quoteType ?? null,
    score: scoreCandidate(query, winner),
    sector: winner.sector ?? null,
    shortName: winner.shortname ?? winner.symbol,
    symbol: winner.symbol,
  });
}
