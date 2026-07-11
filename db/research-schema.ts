import { pgEnum, pgTable, text, timestamp, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth-schema";

export const researchRunStatusEnum = pgEnum("research_run_status", [
  "pending",
  "completed",
  "failed",
]);

export const investmentDecisionEnum = pgEnum("investment_decision", [
  "INVEST",
  "PASS",
]);

export const researchRun = pgTable("research_run", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  companyQuery: text("company_query").notNull(),
  resolvedCompanyName: text("resolved_company_name"),
  ticker: text("ticker"),
  status: researchRunStatusEnum("status").default("pending").notNull(),
  llmProvider: text("llm_provider"),
  llmModel: text("llm_model"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  completedAt: timestamp("completed_at"),
});

export const researchReport = pgTable(
  "research_report",
  {
    id: text("id").primaryKey(),
    runId: text("run_id")
      .notNull()
      .references(() => researchRun.id, { onDelete: "cascade" }),
    companyName: text("company_name").notNull(),
    ticker: text("ticker").notNull(),
    decision: investmentDecisionEnum("decision").notNull(),
    confidence: integer("confidence").notNull(),
    reportJson: jsonb("report_json").notNull(),
    evidenceJson: jsonb("evidence_json").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("research_report_run_id_idx").on(table.runId)],
);

export const researchSource = pgTable("research_source", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => researchRun.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(),
  provider: text("provider").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  publishedAt: timestamp("published_at"),
  retrievedAt: timestamp("retrieved_at").defaultNow().notNull(),
  excerpt: text("excerpt"),
});
