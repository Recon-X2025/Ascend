import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendTierAdminOverride(params: {
  to: string | null | undefined;
  mentorName: string;
  tier: string;
  note: string;
  profileUrl: string;
}) {
  const client = resend;
  if (!client || !params.to) return;
  const { to, mentorName, tier, note, profileUrl } = params;
  const tierLabel = tier === "ELITE" ? "Elite" : tier === "ESTABLISHED" ? "Established" : "Rising";

  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `Your mentor tier has been updated — ${APP_NAME}`,
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
  <p>Ascend has manually set your mentor tier to <strong>${tierLabel}</strong>.</p>
  ${note ? `<p><em>${note}</em></p>` : ""}
  <p><a href="${profileUrl}" style="color:#16A34A;">View your mentor dashboard</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
