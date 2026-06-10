ALTER TABLE "pg-drizzle_post" RENAME COLUMN "createdById" TO "workspaceId";--> statement-breakpoint
ALTER TABLE "pg-drizzle_post" DROP CONSTRAINT "pg-drizzle_post_createdById_user_id_fk";
--> statement-breakpoint
DROP INDEX "created_by_idx";--> statement-breakpoint
ALTER TABLE "pg-drizzle_post" ADD CONSTRAINT "pg-drizzle_post_workspaceId_user_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_id_idx" ON "pg-drizzle_post" USING btree ("workspaceId");