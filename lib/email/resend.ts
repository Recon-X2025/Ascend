import { Resend } from "resend";

/** Resend client; null when RESEND_API_KEY is not set. */
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendVerificationEmail(to: string, token: string) {
  if (!resend) throw new Error("Resend not configured");
  const url = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Verify your email for ${APP_NAME}`,
    html: getVerificationHtml(url),
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  if (!resend) throw new Error("Resend not configured");
  const url = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Reset your password for ${APP_NAME}`,
    html: getPasswordResetHtml(url),
  });
  if (error) throw new Error(error.message);
  return data;
}

function getVerificationHtml(verifyUrl: string): string {
  const primaryColor = "#1E3A5F";
  const accentColor = "#3B82F6";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:${primaryColor};">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:${primaryColor};">Verify your email</h1>
  <p>Thanks for signing up. Click the button below to verify your email address.</p>
  <p style="margin:32px 0;">
    <a href="${verifyUrl}" style="display:inline-block;background:${accentColor};color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Verify email</a>
  </p>
  <p style="font-size:14px;color:#666;">If you didn't create an account, you can ignore this email.</p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`;
}

function getPasswordResetHtml(resetUrl: string): string {
  const primaryColor = "#1E3A5F";
  const accentColor = "#3B82F6";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:${primaryColor};">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:${primaryColor};">Reset your password</h1>
  <p>We received a request to reset your password. Click the button below to set a new password.</p>
  <p style="margin:32px 0;">
    <a href="${resetUrl}" style="display:inline-block;background:${accentColor};color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Reset password</a>
  </p>
  <p style="font-size:14px;color:#666;">This link expires in 1 hour. If you didn't request a reset, you can ignore this email.</p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`;
}
