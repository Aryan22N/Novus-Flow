CREATE TABLE "sent_mail" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"to" text NOT NULL,
	"cc" text,
	"bcc" text,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"message_id" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sent_mail" ADD CONSTRAINT "sent_mail_tenant_id_user_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;