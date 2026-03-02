import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendContractActive(params: {
  mentorEmail: string;
  menteeEmail: string;
  mentorName: string;
  menteeName: string;
  contractUrl: string;
}) {
  const client = resend;
  if (!client) return;
  const { mentorEmail, menteeEmail, mentorName, menteeName, contractUrl } = params;
  const sendOne = async (to: string, name: string, role: string) => {
    void role; // reserved for future template personalisation
    await client!.emails.send({
      from: FROM,
      to: [to],
      subject: `Engagement contract active — ${APP_NAME}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Contract active</h1>
  <p>Hi ${name},</p>
  <p>Both parties have signed. Your mentorship engagement has begun.</p>
  <p>You can download the signed contract and view details from your dashboard.</p>
  <p style="margin:24px 0;">
    <a href="${contractUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View contract</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
    });
  };
  await sendOne(mentorEmail, mentorName, "mentor");
  await sendOne(menteeEmail, menteeName, "mentee");
}
