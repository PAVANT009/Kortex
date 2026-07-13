"use client";

import { useEffect, useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type StockDataPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjclose: number;
};

type StockChartProps = {
  symbol: string;
  period?: string;
  className?: string;
};

const PERIOD_OPTIONS = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "2Y", value: "2y" },
  { label: "5Y", value: "5y" },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTooltipDate(dateStr: string) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function StockChart({ symbol, period = "1y", className }: StockChartProps) {
  const [data, setData] = useState<StockDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    let cancelled = false;

    async function fetchStockData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/stock-chart?symbol=${symbol}&period=${selectedPeriod}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch stock data");
        }
        const result = await response.json();
        if (!cancelled) {
          setData(result.chartData || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load chart");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchStockData();
    return () => {
      cancelled = true;
    };
  }, [symbol, selectedPeriod]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <p className="text-sm text-muted-foreground">
          {error || "No stock data available"}
        </p>
      </div>
    );
  }

  const latestData = data[data.length - 1];
  const firstData = data[0];
  const priceChange = latestData.close - firstData.close;
  const priceChangePercent = (priceChange / firstData.close) * 100;
  const isPositive = priceChange >= 0;

  const chartColor = isPositive ? "#10b981" : "#ef4444";
  const minPrice = Math.min(...data.map((d: StockDataPoint) => d.low));
  const maxPrice = Math.max(...data.map((d: StockDataPoint) => d.high));
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <h3 className="text-2xl font-bold text-foreground">
              {formatPrice(latestData.close)}
            </h3>
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {isPositive ? (
                <TrendingUp className="size-4" />
              ) : (
                <TrendingDown className="size-4" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {symbol} | {selectedPeriod.toUpperCase()}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedPeriod(option.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                selectedPeriod === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickCount={8}
              minTickGap={50}
            />
            <YAxis
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={formatPrice}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickCount={6}
              orientation="right"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                const data = payload[0].payload as StockDataPoint;
                return (
                  <div className="rounded-lg border border-border bg-background p-3 shadow-md">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {formatTooltipDate(data.date)}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Open</span>
                        <span className="text-xs font-medium">
                          {formatPrice(data.open)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">High</span>
                        <span className="text-xs font-medium">
                          {formatPrice(data.high)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Low</span>
                        <span className="text-xs font-medium">
                          {formatPrice(data.low)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Close</span>
                        <span className="text-xs font-medium">
                          {formatPrice(data.close)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">Volume</span>
                        <span className="text-xs font-medium">
                          {new Intl.NumberFormat("en-US", {
                            notation: "compact",
                            compactDisplay: "short",
                          }).format(data.volume)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine
              y={firstData.close}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#gradient-${symbol})`}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={chartColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: chartColor, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="text-sm font-medium text-foreground">
            {formatPrice(latestData.open)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">High</p>
          <p className="text-sm font-medium text-foreground">
            {formatPrice(latestData.high)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Low</p>
          <p className="text-sm font-medium text-foreground">
            {formatPrice(latestData.low)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Volume</p>
          <p className="text-sm font-medium text-foreground">
            {new Intl.NumberFormat("en-US", {
              notation: "compact",
              compactDisplay: "short",
            }).format(latestData.volume)}
          </p>
        </div>
      </div>
    </div>
  );
}
