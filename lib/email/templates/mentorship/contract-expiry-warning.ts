import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendContractExpiryWarning(params: {
  to: string;
  recipientName: string;
  contractUrl: string;
  signDeadline: Date;
}) {
  if (!resend) return;
  const { to, recipientName, contractUrl, signDeadline } = params;
  const deadlineStr = signDeadline.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Reminder: Sign your contract by ${deadlineStr} — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#B45309;">About 12 hours left to sign</h1>
  <p>Hi ${recipientName},</p>
  <p>Your engagement contract sign deadline is <strong>${deadlineStr}</strong>. If you don't sign in time, the engagement will be voided.</p>
  <p style="margin:24px 0;">
    <a href="${contractUrl}" style="display:inline-block;background:#B45309;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Sign now</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
