CREATE TYPE "public"."investment_decision" AS ENUM('INVEST', 'PASS');--> statement-breakpoint
CREATE TYPE "public"."research_run_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "research_report" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"company_name" text NOT NULL,
	"ticker" text NOT NULL,
	"decision" "investment_decision" NOT NULL,
	"confidence" integer NOT NULL,
	"report_json" jsonb NOT NULL,
	"evidence_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_run" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"company_query" text NOT NULL,
	"resolved_company_name" text,
	"ticker" text,
	"status" "research_run_status" DEFAULT 'pending' NOT NULL,
	"llm_provider" text,
	"llm_model" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "research_source" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"source_type" text NOT NULL,
	"provider" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"published_at" timestamp,
	"retrieved_at" timestamp DEFAULT now() NOT NULL,
	"excerpt" text
);
--> statement-breakpoint
ALTER TABLE "research_report" ADD CONSTRAINT "research_report_run_id_research_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_run" ADD CONSTRAINT "research_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_source" ADD CONSTRAINT "research_source_run_id_research_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "research_report_run_id_idx" ON "research_report" USING btree ("run_id");