import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
} from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id:          uuid("id").primaryKey().defaultRandom(),
  email:       varchar("email", { length: 255 }).notNull().unique(),
  name:        varchar("name", { length: 255 }),
  avatarUrl:   text("avatar_url"),
  googleId:    varchar("google_id", { length: 255 }).unique(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
})

export const otpCodes = pgTable("otp_codes", {
  id:        uuid("id").primaryKey().defaultRandom(),
  email:     varchar("email", { length: 255 }).notNull(),
  code:      varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used:      boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
