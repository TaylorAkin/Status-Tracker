CREATE TABLE "card" (
	"key" text PRIMARY KEY NOT NULL,
	"program_code" text NOT NULL,
	"name" text NOT NULL,
	"spend_divisor" double precision NOT NULL,
	"headstart_amount" integer,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracker_id" uuid NOT NULL,
	"category" text NOT NULL,
	"state" text NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"method" text NOT NULL,
	"amount" double precision NOT NULL,
	"rate" double precision NOT NULL,
	"override" double precision,
	"notes" text DEFAULT '' NOT NULL,
	"route" text,
	"roundtrip" boolean DEFAULT false NOT NULL,
	"card_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"unit_label" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_code" text NOT NULL,
	"status_year" integer NOT NULL,
	"name" text NOT NULL,
	"threshold" integer NOT NULL,
	CONSTRAINT "tier_program_code_status_year_name_unique" UNIQUE("program_code","status_year","name")
);
--> statement-breakpoint
CREATE TABLE "tracker" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"program_code" text NOT NULL,
	"status_year" integer NOT NULL,
	"target" integer NOT NULL,
	"as_of" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tracker_user_id_program_code_status_year_unique" UNIQUE("user_id","program_code","status_year")
);
--> statement-breakpoint
CREATE TABLE "tracker_card" (
	"tracker_id" uuid NOT NULL,
	"card_key" text NOT NULL,
	"potential" boolean DEFAULT false NOT NULL,
	"included" boolean DEFAULT true NOT NULL,
	CONSTRAINT "tracker_card_tracker_id_card_key_pk" PRIMARY KEY("tracker_id","card_key")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_program_code_program_code_fk" FOREIGN KEY ("program_code") REFERENCES "public"."program"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_tracker_id_tracker_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."tracker"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_card_key_card_key_fk" FOREIGN KEY ("card_key") REFERENCES "public"."card"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tier" ADD CONSTRAINT "tier_program_code_program_code_fk" FOREIGN KEY ("program_code") REFERENCES "public"."program"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker" ADD CONSTRAINT "tracker_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker" ADD CONSTRAINT "tracker_program_code_program_code_fk" FOREIGN KEY ("program_code") REFERENCES "public"."program"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_card" ADD CONSTRAINT "tracker_card_tracker_id_tracker_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."tracker"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_card" ADD CONSTRAINT "tracker_card_card_key_card_key_fk" FOREIGN KEY ("card_key") REFERENCES "public"."card"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entry_tracker_date_idx" ON "entry" USING btree ("tracker_id","date");