import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendContractMenteeTurn(params: {
  to: string;
  menteeName: string;
  contractUrl: string;
  signDeadline: Date;
}) {
  if (!resend) return;
  const { to, menteeName, contractUrl, signDeadline } = params;
  const deadlineStr = signDeadline.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Your mentor signed — please sign the contract — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Your mentor has signed</h1>
  <p>Hi ${menteeName},</p>
  <p>Please review and sign the engagement contract to begin. Sign by: <strong>${deadlineStr}</strong> (48 hours).</p>
  <p style="margin:24px 0;">
    <a href="${contractUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Review &amp; Sign Contract</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
