CREATE TABLE IF NOT EXISTS "voices" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"voice_id" text NOT NULL,
	"preview_url" text,
	"type" varchar(50) NOT NULL,
	"visibility" varchar(20) DEFAULT 'public' NOT NULL,
	"user_id" integer,
	CONSTRAINT "voices_voice_id_unique" UNIQUE("voice_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voices" ADD CONSTRAINT "voices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
