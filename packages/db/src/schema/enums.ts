import { pgEnum } from "drizzle-orm/pg-core"

export const memberRoleEnum = pgEnum("member_role", ["owner", "viewer"])

export const vcsProviderEnum = pgEnum("vcs_provider", ["github", "bitbucket"])

export const riskTierEnum = pgEnum("risk_tier", ["trivial", "lite", "full"])

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "processing",
  "completed",
  "failed",
])

export const approvalDecisionEnum = pgEnum("approval_decision", [
  "approved",
  "approved_with_comments",
  "minor_issues",
  "significant_concerns",
])

export const severityEnum = pgEnum("severity", [
  "critical",
  "warning",
  "suggestion",
])

export const qaStatusEnum = pgEnum("qa_status", [
  "pending",
  "tested",
  "passed",
  "failed",
])

export const docAuthorEnum = pgEnum("doc_author", ["ai", "human"])
