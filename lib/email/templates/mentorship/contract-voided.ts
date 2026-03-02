import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendContractVoided(params: {
  to: string;
  contractId: string;
  reason: "signing_deadline" | "mentor_did_not_sign" | "mentee_did_not_sign";
}) {
  if (!resend) return;
  const { to, contractId, reason } = params;
  const reasonText =
    reason === "signing_deadline"
      ? "The signing deadline passed before both parties signed."
      : reason === "mentor_did_not_sign"
        ? "The mentor did not sign in time."
        : "The mentee did not sign in time.";
  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const mentorshipUrl = `${baseUrl}/mentorship`;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Engagement contract voided — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#666;">Contract voided</h1>
  <p>This engagement contract (${contractId}) has been voided.</p>
  <p>${reasonText}</p>
  <p style="margin:24px 0;">
    <a href="${mentorshipUrl}" style="display:inline-block;background:#0F1A0F;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Return to Mentorship</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
