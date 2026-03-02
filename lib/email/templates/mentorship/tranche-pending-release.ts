import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendTranchePendingRelease(params: {
  to: string;
  recipientName: string;
  trancheNumber: number;
  amountRupees: string;
  autoReleaseDate: string;
  engagementUrl: string;
}) {
  if (!resend) return;
  const { to, recipientName, trancheNumber, amountRupees, autoReleaseDate, engagementUrl } = params;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Milestone complete — confirm or dispute payment — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Action required</h1>
  <p>Hi ${recipientName},</p>
  <p>Milestone ${trancheNumber} is complete. ₹${amountRupees} is pending release to your mentor.</p>
  <p>You have 7 days to confirm or raise a concern. If we don't hear from you by ${autoReleaseDate}, the payment will release automatically.</p>
  <p style="margin:24px 0;">
    <a href="${engagementUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Confirm or dispute</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
