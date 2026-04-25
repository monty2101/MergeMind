import type { Context, Next } from "hono"
import { getCookie } from "hono/cookie"
import { verifyToken } from "../services/auth.service"
import { AppError } from "./errorHandler"

export const requireAuth = async (c: Context, next: Next) => {
  // Check Authorization header first, then cookie
  const authHeader = c.req.header("Authorization")
  const cookieToken = getCookie(c, "token")

  const token = authHeader?.replace("Bearer ", "") ?? cookieToken

  if (!token) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED")
  }

  const payload = await verifyToken(token)

  if (!payload) {
    throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN")
  }

  c.set("userId", payload.userId)
  c.set("email", payload.email)

  await next()
}
