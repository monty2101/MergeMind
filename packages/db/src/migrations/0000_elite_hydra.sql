CREATE TYPE "public"."approval_decision" AS ENUM('approved', 'approved_with_comments', 'minor_issues', 'significant_concerns');--> statement-breakpoint
CREATE TYPE "public"."doc_author" AS ENUM('ai', 'human');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."qa_status" AS ENUM('pending', 'tested', 'passed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."risk_tier" AS ENUM('trivial', 'lite', 'full');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('critical', 'warning', 'suggestion');--> statement-breakpoint
CREATE TYPE "public"."vcs_provider" AS ENUM('github', 'bitbucket');--> statement-breakpoint
CREATE TABLE "doc_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"entity_type" varchar(50),
	"file_path" text NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"content_md" text,
	"authored_by" "doc_author" DEFAULT 'ai',
	"is_stale" boolean DEFAULT false,
	"generated_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'viewer' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"vcs_provider" "vcs_provider" DEFAULT 'github' NOT NULL,
	"external_repo_id" varchar(255) NOT NULL,
	"full_name" varchar(500) NOT NULL,
	"default_branch" varchar(255) DEFAULT 'main',
	"webhook_id" varchar(255),
	"install_token_enc" text,
	"connected_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qa_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_id" uuid NOT NULL,
	"category" varchar(100),
	"priority" varchar(50),
	"scenario_gherkin" text NOT NULL,
	"status" "qa_status" DEFAULT 'pending' NOT NULL,
	"assignee_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_run_id" uuid NOT NULL,
	"agent_name" varchar(100),
	"severity" "severity" NOT NULL,
	"category" varchar(100),
	"message" text NOT NULL,
	"file_path" text,
	"line_number" integer,
	"suggestion" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repo_id" uuid NOT NULL,
	"external_pr_id" varchar(255) NOT NULL,
	"title" text,
	"author" varchar(255),
	"pr_number" integer,
	"status" varchar(50) DEFAULT 'open',
	"risk_tier" "risk_tier",
	"head_sha" varchar(255),
	"opened_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pr_id" uuid NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"approval_decision" "approval_decision",
	"cost_usd_cents" integer DEFAULT 0,
	"duration_ms" integer,
	"commit_sha" varchar(255),
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"avatar_url" text,
	"google_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE INDEX "findings_review_run_idx" ON "findings" USING btree ("review_run_id");--> statement-breakpoint
CREATE INDEX "findings_severity_idx" ON "findings" USING btree ("severity");