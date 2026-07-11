import YahooFinance from "yahoo-finance2";

export const yahooFinance = new YahooFinance({
  queue: {
    concurrency: 2,
    interval: 300,
  },
});
