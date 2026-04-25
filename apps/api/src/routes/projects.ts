import { Hono } from "hono"
import { requireAuth } from "../middleware/auth"

export const projectRoutes = new Hono()

projectRoutes.get("/", requireAuth, async (c) => {
  return c.json({ projects: [] })
})
