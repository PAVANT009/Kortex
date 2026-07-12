CREATE TABLE "saved_report" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"report_id" text NOT NULL,
	"run_id" text NOT NULL,
	"company_name" text NOT NULL,
	"ticker" text NOT NULL,
	"decision" "investment_decision" NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"ticker" text NOT NULL,
	"notes" text,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_report" ADD CONSTRAINT "saved_report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_report" ADD CONSTRAINT "saved_report_report_id_research_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_report" ADD CONSTRAINT "saved_report_run_id_research_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "saved_report_user_report_idx" ON "saved_report" USING btree ("user_id","report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_user_ticker_idx" ON "watchlist" USING btree ("user_id","ticker");