import { SignJWT, jwtVerify } from "jose"
import { db, users, otpCodes } from "@repo/db"
import { eq, and, gt } from "drizzle-orm"
import { AppError } from "../middleware/errorHandler"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
)
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN ?? "7d"

// ── OTP ────────────────────────────────────────────────────────────────────

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function saveOtp(email: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  // Invalidate any existing unused OTPs for this email
  await db
    .update(otpCodes)
    .set({ used: true })
    .where(and(eq(otpCodes.email, email), eq(otpCodes.used, false)))

  await db.insert(otpCodes).values({ email, code, expiresAt })
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<boolean> {
  const now = new Date()

  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.code, code),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, now)
      )
    )
    .limit(1)

  if (!otp) return false

  // Mark as used immediately (one-time use)
  await db
    .update(otpCodes)
    .set({ used: true })
    .where(eq(otpCodes.id, otp.id))

  return true
}

// ── User upsert ────────────────────────────────────────────────────────────

export async function upsertUserByEmail(email: string, name?: string) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, existing.id))
    return existing
  }

  const [created] = await db
    .insert(users)
    .values({ email, name })
    .returning()

  return created
}

export async function upsertUserByGoogle(params: {
  email: string
  name: string
  googleId: string
  avatarUrl?: string
}) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, params.googleId))
    .limit(1)

  if (existing) {
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), avatarUrl: params.avatarUrl })
      .where(eq(users.id, existing.id))
    return existing
  }

  const [created] = await db
    .insert(users)
    .values(params)
    .returning()

  return created
}

// ── JWT ────────────────────────────────────────────────────────────────────

export async function signToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(JWT_SECRET)
}

export async function verifyToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}
