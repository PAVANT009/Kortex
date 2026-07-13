import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/get-session";
import { yahooFinance } from "@/modules/research/server/providers/yahoo";

type ChartQuote = {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  adjclose: number | null;
};

const VALID_PERIODS = new Set([
  "1d",
  "5d",
  "1mo",
  "3mo",
  "6mo",
  "1y",
  "2y",
  "5y",
  "10y",
  "ytd",
  "max",
]);

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol")?.trim().toUpperCase() ?? "";
  const requestedPeriod = searchParams.get("period")?.trim() ?? "1y";
  const period = VALID_PERIODS.has(requestedPeriod) ? requestedPeriod : "1y";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    const period1 = new Date();
    const period2 = new Date();

    // Calculate period1 based on requested period
    switch (period) {
      case "1d":
        period1.setDate(period1.getDate() - 1);
        break;
      case "5d":
        period1.setDate(period1.getDate() - 5);
        break;
      case "1mo":
        period1.setMonth(period1.getMonth() - 1);
        break;
      case "3mo":
        period1.setMonth(period1.getMonth() - 3);
        break;
      case "6mo":
        period1.setMonth(period1.getMonth() - 6);
        break;
      case "1y":
        period1.setFullYear(period1.getFullYear() - 1);
        break;
      case "2y":
        period1.setFullYear(period1.getFullYear() - 2);
        break;
      case "5y":
        period1.setFullYear(period1.getFullYear() - 5);
        break;
      case "10y":
        period1.setFullYear(period1.getFullYear() - 10);
        break;
      case "ytd":
        period1.setMonth(0);
        period1.setDate(1);
        break;
      case "max":
        period1.setFullYear(period1.getFullYear() - 50);
        break;
      default:
        period1.setFullYear(period1.getFullYear() - 1);
    }

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: "1d",
    });
    const quotes = result.quotes as ChartQuote[];

    const chartData = quotes
      .filter(
        (
          quote,
        ): quote is ChartQuote & {
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        } =>
          quote.open !== null &&
          quote.high !== null &&
          quote.low !== null &&
          quote.close !== null &&
          quote.volume !== null,
      )
      .map((quote) => ({
        date: quote.date,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close,
        volume: quote.volume,
        adjclose: quote.adjclose ?? quote.close,
      }));

    const meta = {
      symbol: result.meta.symbol,
      currency: result.meta.currency,
      exchangeName: result.meta.exchangeName,
      instrumentType: result.meta.instrumentType,
      firstTradeDate: result.meta.firstTradeDate,
      regularMarketTime: result.meta.regularMarketTime,
      gmtoffset: result.meta.gmtoffset,
      timezone: result.meta.timezone,
      exchangeTimezoneName: result.meta.exchangeTimezoneName,
      currentTradingPeriod: result.meta.currentTradingPeriod,
      dataGranularity: result.meta.dataGranularity,
      range: result.meta.range,
      validRanges: result.meta.validRanges,
    };

    return NextResponse.json({
      meta,
      chartData,
    });
  } catch (error) {
    console.error("Error fetching stock chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock chart data" },
      { status: 500 }
    );
  }
}
