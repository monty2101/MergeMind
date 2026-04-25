import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { authRoutes } from "./routes/auth"
import { projectRoutes } from "./routes/projects"
import { errorHandler } from "./middleware/errorHandler"

const app = new Hono()

// Global middleware
app.use("*", logger())
app.use("*", cors({
  origin: process.env.WEB_URL ?? "http://localhost:5173",
  credentials: true,
}))

// Health check
app.get("/health", (c) => c.json({ 
  status: "ok", 
  timestamp: new Date().toISOString() 
}))

// Routes
app.route("/auth", authRoutes)
app.route("/projects", projectRoutes)

// Error handler
app.onError(errorHandler)

// 404 handler
app.notFound((c) => c.json({ error: "Not found" }, 404))

const port = Number(process.env.API_PORT) || 3000

console.log(`🚀 MergeMind API running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })
