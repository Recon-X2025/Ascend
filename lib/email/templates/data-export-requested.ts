import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendDataExportRequestedEmail(to: string, name: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Your data export request has been received — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Data export request received</h1>
  <p>Hi ${name || "there"},</p>
  <p>We've received your request to export your Ascend data.</p>
  <p>Processing takes up to 24 hours. We'll email you a secure download link once it's ready.</p>
  <p>The link will expire after 7 days.</p>
  <p style="font-size:14px;color:#666;">If you didn't request this, please contact support immediately.</p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
