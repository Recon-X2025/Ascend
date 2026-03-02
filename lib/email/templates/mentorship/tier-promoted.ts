import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendTierPromoted(params: {
  to: string | null | undefined;
  mentorName: string;
  newTier: string;
  platformFeePercent: number;
  maxActiveMentees: number;
  priorityMatching: boolean;
  featuredOnDiscovery: boolean;
  profileUrl: string;
}) {
  const client = resend;
  if (!client || !params.to) return;
  const {
    to,
    mentorName,
    newTier,
    platformFeePercent,
    maxActiveMentees,
    priorityMatching,
    featuredOnDiscovery,
    profileUrl,
  } = params;
  const tierLabel = newTier === "ELITE" ? "Elite" : newTier === "ESTABLISHED" ? "Established" : "Rising";
  const benefits: string[] = [
    `Your platform fee is now <strong>${platformFeePercent}%</strong> (reduced).`,
    `You can mentor up to <strong>${maxActiveMentees}</strong> active mentees.`,
  ];
  if (priorityMatching) benefits.push("You get <strong>priority matching</strong> in discovery.");
  if (featuredOnDiscovery) benefits.push("You are <strong>featured on the discovery page</strong> as an Elite mentor.");

  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `You've been promoted to ${tierLabel} Mentor — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Congratulations, ${mentorName}!</h1>
  <p>You've been promoted to <strong>${tierLabel} Mentor</strong>.</p>
  <p>Your new benefits:</p>
  <ul style="margin:8px 0;">
    ${benefits.map((b) => `<li>${b}</li>`).join("")}
  </ul>
  <p><a href="${profileUrl}" style="color:#16A34A;">View your mentor profile</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
