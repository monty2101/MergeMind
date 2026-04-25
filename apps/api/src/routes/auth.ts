import { Hono } from "hono"
import { setCookie, deleteCookie } from "hono/cookie"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import {
  generateOtpCode,
  saveOtp,
  verifyOtp,
  upsertUserByEmail,
  signToken,
} from "../services/auth.service"
import { sendOtpEmail } from "../services/email.service"
import { AppError } from "../middleware/errorHandler"
import { requireAuth } from "../middleware/auth"

export const authRoutes = new Hono()

// POST /auth/send-otp
authRoutes.post(
  "/send-otp",
  zValidator("json", z.object({
    email: z.string().email("Invalid email address"),
  })),
  async (c) => {
    const { email } = c.req.valid("json")

    const code = generateOtpCode()
    await saveOtp(email, code)
    await sendOtpEmail(email, code)

    return c.json({ message: "OTP sent successfully" })
  }
)

// POST /auth/verify-otp
authRoutes.post(
  "/verify-otp",
  zValidator("json", z.object({
    email: z.string().email(),
    code:  z.string().length(6, "Code must be 6 digits"),
  })),
  async (c) => {
    const { email, code } = c.req.valid("json")

    const valid = await verifyOtp(email, code)
    if (!valid) {
      throw new AppError("Invalid or expired code", 400, "INVALID_OTP")
    }

    const user = await upsertUserByEmail(email)
    const token = await signToken(user.id, user.email)

    // Set httpOnly cookie
    setCookie(c, "token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge:   60 * 60 * 24 * 7, // 7 days
      path:     "/",
    })

    return c.json({
      user: {
        id:    user.id,
        email: user.email,
        name:  user.name,
      },
      token,
    })
  }
)

// GET /auth/me - get current user
authRoutes.get("/me", requireAuth, async (c) => {
  return c.json({
    userId: c.get("userId"),
    email:  c.get("email"),
  })
})

// POST /auth/logout
authRoutes.post("/logout", (c) => {
  deleteCookie(c, "token")
  return c.json({ message: "Logged out" })
})
