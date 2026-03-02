import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendOutcomeSubmitted(params: {
  to: string;
  menteeName: string;
  mentorName: string;
  transitionType: string;
  deadline: Date;
  outcomeUrl: string;
}) {
  const client = resend;
  if (!client) return;
  const { to, menteeName, mentorName, transitionType, deadline, outcomeUrl } = params;
  const deadlineStr = deadline.toLocaleDateString(undefined, { dateStyle: "medium", timeStyle: "short" });
  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `Confirm or dispute outcome — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Outcome claim from ${mentorName}</h1>
  <p>Hi ${menteeName},</p>
  <p>Your mentor has submitted an outcome claim for your engagement: <strong>${transitionType}</strong>.</p>
  <p>Please confirm or dispute by <strong>${deadlineStr}</strong>.</p>
  <p style="margin:24px 0;">
    <a href="${outcomeUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Confirm or dispute</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
