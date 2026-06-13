CREATE TABLE "ai_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"ai_draft_text" text NOT NULL,
	"user_edited_text" text NOT NULL,
	"correction_type" varchar(50),
	"recipient_email" varchar(255),
	"email_subject" varchar(500),
	"thread_id" varchar(255),
	"collapsed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recipient_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"preferred_tone" varchar(50),
	"max_word_count" integer,
	"custom_notes" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_writing_profiles" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"tone" varchar(50) DEFAULT 'professional',
	"avg_email_length" integer DEFAULT 150,
	"common_greetings" jsonb DEFAULT '[]'::jsonb,
	"common_closings" jsonb DEFAULT '[]'::jsonb,
	"writing_style_summary" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_corrections" ADD CONSTRAINT "ai_corrections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_patterns" ADD CONSTRAINT "recipient_patterns_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_writing_profiles" ADD CONSTRAINT "user_writing_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_corrections_user_idx" ON "ai_corrections" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "recipient_patterns_user_idx" ON "recipient_patterns" USING btree ("user_id","recipient_email");