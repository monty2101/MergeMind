import {
  pgTable, uuid, varchar,
  timestamp, text
} from "drizzle-orm/pg-core"
import { qaStatusEnum } from "./enums"

export const qaCases = pgTable("qa_cases", {
  id:               uuid("id").primaryKey().defaultRandom(),
  prId:             uuid("pr_id").notNull(),
  category:         varchar("category", { length: 100 }),  // happy_path, edge, error, security
  priority:         varchar("priority", { length: 50 }),   // high, medium, low
  scenarioGherkin:  text("scenario_gherkin").notNull(),
  status:           qaStatusEnum("status").default("pending").notNull(),
  assigneeId:       uuid("assignee_id"),
  notes:            text("notes"),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().notNull(),
})
