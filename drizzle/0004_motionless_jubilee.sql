CREATE TABLE "draft_mail" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"to" text,
	"cc" text,
	"bcc" text,
	"subject" text,
	"body" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "draft_mail" ADD CONSTRAINT "draft_mail_tenant_id_user_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;