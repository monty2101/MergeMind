import {
  pgTable, uuid, varchar,
  timestamp, text, boolean
} from "drizzle-orm/pg-core"
import { docAuthorEnum } from "./enums"

export const docEntities = pgTable("doc_entities", {
  id:           uuid("id").primaryKey().defaultRandom(),
  repoId:       uuid("repo_id").notNull(),
  entityType:   varchar("entity_type", { length: 50 }),  // function, class, module
  filePath:     text("file_path").notNull(),
  entityName:   varchar("entity_name", { length: 255 }).notNull(),
  contentMd:    text("content_md"),
  authoredBy:   docAuthorEnum("authored_by").default("ai"),
  isStale:      boolean("is_stale").default(false),
  generatedAt:  timestamp("generated_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
})
