import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendLegalUpdateRequired(params: {
  to: string;
  userName: string;
  documentTitle: string;
  documentVersion: string;
  signUrl: string;
}) {
  if (!resend) return;
  const { to, userName, documentTitle, documentVersion, signUrl } = params;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Action required: Re-sign ${documentTitle} — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#B45309;">Update to ${documentTitle}</h1>
  <p>Hi ${userName},</p>
  <p>A new version (${documentVersion}) of <strong>${documentTitle}</strong> has been published. To continue using the Mentorship Marketplace, you need to review and sign the updated document.</p>
  <p><a href="${signUrl}" style="display:inline-block;background:#16A34A;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">Review &amp; Sign</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
