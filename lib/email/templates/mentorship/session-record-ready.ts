import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendSessionRecordReady(params: {
  to: string;
  mentorName: string;
  sessionNumber: number;
  downloadUrl: string;
  engagementUrl: string;
}) {
  const client = resend;
  if (!client) return;
  const { to, mentorName, sessionNumber, downloadUrl, engagementUrl } = params;
  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `Session ${sessionNumber} record ready — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Session ${sessionNumber} record ready</h1>
  <p>Your Session ${sessionNumber} record with ${mentorName} is ready for download.</p>
  <p><a href="${downloadUrl}" style="color:#16A34A;font-weight:600;">Download Session Record (PDF)</a></p>
  <p><a href="${engagementUrl}">View engagement</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
