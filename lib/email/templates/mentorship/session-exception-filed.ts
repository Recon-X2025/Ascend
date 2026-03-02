import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendSessionExceptionFiled(params: {
  to: string;
  recipientName: string;
  sessionNumber: number;
  filedByName: string;
  noteExcerpt: string;
  acknowledgeUrl: string;
  engagementUrl: string;
}) {
  const client = resend;
  if (!client) return;
  const { to, recipientName, sessionNumber, filedByName, noteExcerpt, acknowledgeUrl, engagementUrl } = params;
  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `Session ${sessionNumber} — exception filed — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;"><span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span></div>
  <h1 style="font-size:20px;color:#ea580c;">Exception filed</h1>
  <p>Hi ${recipientName},</p>
  <p>${filedByName} has filed an exception for Session ${sessionNumber}.</p>
  <p><em>${noteExcerpt}</em></p>
  <p><a href="${acknowledgeUrl}" style="color:#16A34A;">View and acknowledge</a> | <a href="${engagementUrl}">Engagement</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>`,
  });
}
