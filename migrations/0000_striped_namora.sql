CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" varchar NOT NULL,
	"company_name" varchar NOT NULL,
	"report_type" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"file_name" varchar,
	"file_path" varchar,
	"workflow_id" varchar,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255),
	"password" varchar(255) NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");