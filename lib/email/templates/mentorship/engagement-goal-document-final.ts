import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendGoalDocumentFinal(params: {
  mentorEmail: string;
  menteeEmail: string;
  mentorName: string;
  menteeName: string;
  engagementUrl: string;
}) {
  const client = resend;
  if (!client) return;
  const { mentorEmail, menteeEmail, mentorName, menteeName, engagementUrl } = params;
  const sendOne = async (to: string, name: string) => {
    await client!.emails.send({
      from: FROM,
      to: [to],
      subject: `Goal document finalised — ${APP_NAME}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#16A34A;">Goal document finalised</h1>
  <p>Hi ${name},</p>
  <p>Both parties have signed the goal document. Your engagement goals are now locked in.</p>
  <p><a href="${engagementUrl}" style="color:#16A34A;">View engagement</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
    });
  };
  await sendOne(mentorEmail, mentorName);
  await sendOne(menteeEmail, menteeName);
}
