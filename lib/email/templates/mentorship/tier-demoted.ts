import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendTierDemoted(params: {
  to: string | null | undefined;
  mentorName: string;
  reason: string;
  newTier: string;
  platformFeePercent: number;
  maxActiveMentees: number;
  profileUrl: string;
  reverificationUrl: string;
}) {
  const client = resend;
  if (!client || !params.to) return;
  const {
    to,
    mentorName,
    reason,
    newTier,
    platformFeePercent,
    maxActiveMentees,
    profileUrl,
    reverificationUrl,
  } = params;
  const reasonText =
    reason === "DEMOTION_DISPUTE_RATE"
      ? "Your dispute rate has exceeded our threshold (more than 25% of engagements had upheld disputes)."
      : reason === "DEMOTION_VERIFICATION_LAPSED"
        ? "Your mentor verification has lapsed and reverification has been required for more than 30 days."
        : "Your tier has been adjusted based on our tier policy.";
  const cta =
    reason === "DEMOTION_DISPUTE_RATE"
      ? "Review your engagement history"
      : reason === "DEMOTION_VERIFICATION_LAPSED"
        ? "Complete reverification"
        : "View your dashboard";
  const ctaUrl = reason === "DEMOTION_VERIFICATION_LAPSED" ? reverificationUrl : profileUrl;

  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `Mentor tier update — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#333;">Tier update</h1>
  <p>Hi ${mentorName},</p>
  <p>${reasonText}</p>
  <p>Your tier is now <strong>${newTier}</strong>. Your platform fee is <strong>${platformFeePercent}%</strong> and you can have up to <strong>${maxActiveMentees}</strong> active mentees.</p>
  <p><a href="${ctaUrl}" style="color:#16A34A;">${cta}</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
