import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendApplicationReceivedToMentor(params: {
  to: string;
  menteeName: string;
  mentorName: string;
  whyExcerpt: string;
  dashboardUrl: string;
}) {
  if (!resend) return;
  const { to, menteeName, whyExcerpt, dashboardUrl } = params;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `New mentorship application from ${menteeName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">New mentorship application</h1>
  <p>${menteeName} has applied to you as a mentor.</p>
  <p style="background:#F7F6F1;padding:12px;border-radius:8px;font-style:italic;">${whyExcerpt}${whyExcerpt.length >= 200 ? "…" : ""}</p>
  <p style="margin:24px 0;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View in dashboard</a>
  </p>
  <p style="font-size:14px;color:#666;">You have 5 days to respond.</p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
