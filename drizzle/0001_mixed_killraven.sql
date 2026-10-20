CREATE TABLE "user_tour" (
	"user_id" text NOT NULL,
	"tour_key" text NOT NULL,
	"status" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_tour_user_id_tour_key_pk" PRIMARY KEY("user_id","tour_key")
);
--> statement-breakpoint
ALTER TABLE "user_tour" ADD CONSTRAINT "user_tour_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;