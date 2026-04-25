import { drizzle } from "drizzle-orm/node-postgres"
import * as usersSchema from "./schema/users"
import * as projectsSchema from "./schema/projects"
import * as reviewsSchema from "./schema/reviews"
import * as docsSchema from "./schema/docs"
import * as qaSchema from "./schema/qa"

const schema = {
  ...usersSchema,
  ...projectsSchema,
  ...reviewsSchema,
  ...docsSchema,
  ...qaSchema,
}

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const db = drizzle(connectionString, { schema })

export * from "./schema/enums"
export * from "./schema/users"
export * from "./schema/projects"
export * from "./schema/reviews"
export * from "./schema/docs"
export * from "./schema/qa"
