import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";
const SUPPORT_EMAIL = "support@ascend.coheron.in";

export async function sendAccountDeletionRequestedEmail(to: string, name: string) {
  if (!resend) return;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Account deletion request received</h1>
  <p>Hi ${name || "there"},</p>
  <p>We have received your request to delete your ${APP_NAME} account.</p>
  <p>Your account will be deleted within 24 hours.</p>
  <p>Legal records (contracts, payments) are retained as required by law.</p>
  <p style="font-size:14px;color:#666;">If you did not request this, contact support immediately at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Account deletion request received — ${APP_NAME}`,
    html,
  });
}
