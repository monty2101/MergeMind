import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"

export async function sendOtpEmail(
  email: string,
  code: string
): Promise<void> {
  // In development, just log the OTP
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📧 OTP for ${email}: ${code}\n`)
    return
  }

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your MergeMind login code",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>Your login code</h2>
        <p>Enter this code to sign in to MergeMind:</p>
        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 20px;
          background: #f4f4f5;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        ">${code}</div>
        <p style="color: #666; font-size: 14px;">
          This code expires in 5 minutes. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  })
}
