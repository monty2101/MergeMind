import {
  pgTable, uuid, varchar,
  timestamp, text, integer, index
} from "drizzle-orm/pg-core"
import {
  riskTierEnum, reviewStatusEnum,
  approvalDecisionEnum, severityEnum
} from "./enums"

export const pullRequests = pgTable("pull_requests", {
  id:             uuid("id").primaryKey().defaultRandom(),
  repoId:         uuid("repo_id").notNull(),
  externalPrId:   varchar("external_pr_id", { length: 255 }).notNull(),
  title:          text("title"),
  author:         varchar("author", { length: 255 }),
  prNumber:       integer("pr_number"),
  status:         varchar("status", { length: 50 }).default("open"),
  riskTier:       riskTierEnum("risk_tier"),
  headSha:        varchar("head_sha", { length: 255 }),
  openedAt:       timestamp("opened_at"),
  closedAt:       timestamp("closed_at"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
})

export const reviewRuns = pgTable("review_runs", {
  id:               uuid("id").primaryKey().defaultRandom(),
  prId:             uuid("pr_id").notNull(),
  status:           reviewStatusEnum("status").notNull().default("pending"),
  approvalDecision: approvalDecisionEnum("approval_decision"),
  costUsdCents:     integer("cost_usd_cents").default(0),
  durationMs:       integer("duration_ms"),
  commitSha:        varchar("commit_sha", { length: 255 }),
  errorMessage:     text("error_message"),
  startedAt:        timestamp("started_at"),
  completedAt:      timestamp("completed_at"),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
})

export const findings = pgTable("findings", {
  id:            uuid("id").primaryKey().defaultRandom(),
  reviewRunId:   uuid("review_run_id").notNull(),
  agentName:     varchar("agent_name", { length: 100 }),
  severity:      severityEnum("severity").notNull(),
  category:      varchar("category", { length: 100 }),
  message:       text("message").notNull(),
  filePath:      text("file_path"),
  lineNumber:    integer("line_number"),
  suggestion:    text("suggestion"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  reviewRunIdx: index("findings_review_run_idx").on(table.reviewRunId),
  severityIdx:  index("findings_severity_idx").on(table.severity),
}))
