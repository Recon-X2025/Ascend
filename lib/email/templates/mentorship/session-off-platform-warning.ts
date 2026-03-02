import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendSessionOffPlatformWarning(params: {
  to: string;
  recipientName: string;
  strikeCount: number;
  engagementUrl: string;
}) {
  const client = resend;
  if (!client) return;
  const { to, recipientName, strikeCount, engagementUrl } = params;
  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `Off-platform communication warning — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;"><span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span></div>
  <h1 style="font-size:20px;color:#ea580c;">Warning: Off-platform communication</h1>
  <p>Hi ${recipientName},</p>
  <p>A message in your mentorship engagement was flagged for sharing contact details or external links. Strike ${strikeCount}/3.</p>
  <p>Keep all mentorship communication on Ascend. Further violations may result in suspension.</p>
  <p><a href="${engagementUrl}">View engagement</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>`,
  });
}
