import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendOutcomeDisputed(params: {
  to: string;
  mentorName: string;
  menteeName: string;
  transitionType: string;
  menteeNote: string;
  outcomeId: string;
  engagementUrl: string;
}) {
  const client = resend;
  if (!client) return;
  const { to, mentorName, menteeName, transitionType, menteeNote, outcomeId, engagementUrl } = params;
  void outcomeId;
  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `Outcome disputed — ${APP_NAME}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#B45309;">Outcome disputed</h1>
  <p>Hi ${mentorName},</p>
  <p>${menteeName} has disputed the outcome claim for <strong>${transitionType}</strong>.</p>
  <p><strong>Mentee's note:</strong></p>
  <p>${menteeNote}</p>
  <p>Our team will review and get back to both parties within 5 business days.</p>
  <p><a href="${engagementUrl}" style="color:#16A34A;">View engagement</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
