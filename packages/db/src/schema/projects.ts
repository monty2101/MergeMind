import {
  pgTable, uuid, varchar,
  timestamp, text
} from "drizzle-orm/pg-core"
import { memberRoleEnum, vcsProviderEnum } from "./enums"

export const projects = pgTable("projects", {
  id:          uuid("id").primaryKey().defaultRandom(),
  ownerId:     uuid("owner_id").notNull(),
  name:        varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
})

export const projectMembers = pgTable("project_members", {
  id:         uuid("id").primaryKey().defaultRandom(),
  projectId:  uuid("project_id").notNull(),
  userId:     uuid("user_id").notNull(),
  role:       memberRoleEnum("role").notNull().default("viewer"),
  invitedAt:  timestamp("invited_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
})

export const repos = pgTable("repos", {
  id:               uuid("id").primaryKey().defaultRandom(),
  projectId:        uuid("project_id").notNull(),
  vcsProvider:      vcsProviderEnum("vcs_provider").notNull().default("github"),
  externalRepoId:   varchar("external_repo_id", { length: 255 }).notNull(),
  fullName:         varchar("full_name", { length: 500 }).notNull(),
  defaultBranch:    varchar("default_branch", { length: 255 }).default("main"),
  webhookId:        varchar("webhook_id", { length: 255 }),
  installTokenEnc:  text("install_token_enc"),
  connectedAt:      timestamp("connected_at").defaultNow().notNull(),
})
