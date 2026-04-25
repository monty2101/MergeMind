import type { Context } from "hono"
import type { StatusCode } from "hono/utils/http-status"

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message)
    this.name = "AppError"
  }
}

export const errorHandler = (err: Error, c: Context) => {
  console.error(`[Error] ${err.message}`, err.stack)

  if (err instanceof AppError) {
    return c.json(
      { error: err.message, code: err.code },
      err.statusCode as StatusCode
    )
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    return c.json({ error: "Validation failed", details: err.message }, 422)
  }

  return c.json({ error: "Internal server error" }, 500)
}
