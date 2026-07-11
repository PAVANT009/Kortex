import { z } from "zod";

export const researchRequestSchema = z.object({
  company: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(120, "Keep the company name under 120 characters."),
});

export type ResearchRequest = z.infer<typeof researchRequestSchema>;
