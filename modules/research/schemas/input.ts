import { z } from "zod";

export const researchRequestSchema = z.object({
  company: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(120, "Keep the company name under 120 characters."),
});

export const savedReportRequestSchema = z.object({
  runId: z.string().uuid("Enter a valid research run ID."),
});

const optionalNotesSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().max(500, "Keep notes under 500 characters.").nullable().optional());

export const watchlistRequestSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Enter a company name.")
    .max(160, "Keep the company name under 160 characters."),
  ticker: z
    .string()
    .trim()
    .min(1, "Enter a ticker symbol.")
    .max(20, "Keep the ticker symbol under 20 characters.")
    .transform((value) => value.toUpperCase()),
  notes: optionalNotesSchema.default(null),
});

export type ResearchRequest = z.infer<typeof researchRequestSchema>;
export type SavedReportRequest = z.infer<typeof savedReportRequestSchema>;
export type WatchlistRequest = z.infer<typeof watchlistRequestSchema>;
