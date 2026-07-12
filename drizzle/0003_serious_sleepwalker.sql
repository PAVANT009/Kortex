ALTER TABLE "saved_report" DROP CONSTRAINT "saved_report_report_id_research_report_id_fk";
--> statement-breakpoint
DROP INDEX "saved_report_user_report_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "saved_report_user_run_idx" ON "saved_report" USING btree ("user_id","run_id");--> statement-breakpoint
ALTER TABLE "saved_report" DROP COLUMN "report_id";