import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendJobReferralEmail(params: {
  to: string;
  referredName: string;
  referrerName: string;
  jobTitle: string;
  companyName: string;
  downloadUrl: string;
  workMode: string;
  location: string;
  salaryRange: string;
}) {
  if (!resend) return;
  const {
    to,
    referredName,
    referrerName,
    jobTitle,
    companyName,
    downloadUrl,
    workMode,
    location,
    salaryRange,
  } = params;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `${referrerName} thinks you'd be a great fit for ${jobTitle} at ${companyName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">You've been referred for a role</h1>
  <p>Hi ${referredName || "there"},</p>
  <p>${referrerName} referred you for the <strong>${jobTitle}</strong> role at <strong>${companyName}</strong> on ${APP_NAME}.</p>
  <p style="margin:24px 0;">
    <a href="${downloadUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View Job &amp; Apply</a>
  </p>
  <p style="font-size:14px;color:#666;">This role is ${workMode} based in ${location}.</p>
  ${salaryRange ? `<p style="font-size:14px;color:#666;">${salaryRange}</p>` : ""}
  <p style="font-size:12px;color:#999;margin-top:32px;">— The ${APP_NAME} Team</p>
</body>
</html>
`,
  });
}
