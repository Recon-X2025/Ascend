import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://ascend.careers";

export async function sendReferralConvertedEmail(params: {
  to: string;
  referrerName: string;
  referredName: string;
}) {
  if (!resend) return;
  const { to, referrerName, referredName } = params;
  const dashboardUrl = `${BASE_URL.replace(/\/$/, "")}/dashboard/seeker`;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `${referredName} joined Ascend — you've earned a reward`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Someone you referred completed onboarding</h1>
  <p>Hi ${referrerName},</p>
  <p>${referredName} completed their profile on ${APP_NAME}. As a thank you, you've got <strong>1 month of free premium features</strong>.</p>
  <p style="margin:24px 0;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Go to Dashboard</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">— The ${APP_NAME} Team</p>
</body>
</html>
`,
  });
}

export async function sendReferralRewardGrantedEmail(params: {
  to: string;
  referrerName: string;
}) {
  if (!resend) return;
  const { to, referrerName } = params;
  const dashboardUrl = `${BASE_URL.replace(/\/$/, "")}/dashboard/seeker`;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Your referral reward is active on Ascend",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Premium reward applied</h1>
  <p>Hi ${referrerName},</p>
  <p>Your 1 month free premium for referring a friend is now active on ${APP_NAME}. Enjoy the extra features.</p>
  <p style="margin:24px 0;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Go to Dashboard</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">— The ${APP_NAME} Team</p>
</body>
</html>
`,
  });
}

export async function sendRecruiterInviteEmail(params: {
  to: string;
  inviterName: string;
  joinUrl: string;
}) {
  if (!resend) return;
  const { to, inviterName, joinUrl } = params;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `${inviterName} invited you to join their hiring team on Ascend`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">You're invited to Ascend</h1>
  <p>Your colleague <strong>${inviterName}</strong> invited you to join their hiring team on ${APP_NAME}.</p>
  <p style="margin:24px 0;">
    <a href="${joinUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Join Ascend</a>
  </p>
  <p style="font-size:14px;color:#666;">Create an account to collaborate on job posts and candidate pipelines.</p>
  <p style="font-size:12px;color:#999;margin-top:32px;">— The ${APP_NAME} Team</p>
</body>
</html>
`,
  });
}
