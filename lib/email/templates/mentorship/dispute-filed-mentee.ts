import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendDisputeFiledMentee(params: {
  to: string;
  menteeName: string;
  category: string;
  disputeUrl: string;
}) {
  if (!resend) return;
  const { to, menteeName, category, disputeUrl } = params;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Dispute filed — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;">Dispute received</h1>
  <p>Hi ${menteeName},</p>
  <p>We've received your dispute (${category.replace(/_/g, " ")}).</p>
  <p>We'll gather evidence and resolve within 5 business days.</p>
  <p><a href="${disputeUrl}" style="color:#16A34A;">Track dispute status</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
