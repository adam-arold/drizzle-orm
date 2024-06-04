CREATE TABLE IF NOT EXISTS "Server" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "AccountProvider" NOT NULL,
	"providerId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Server_providerId_key" ON "Server" USING btree (providerId text_ops);