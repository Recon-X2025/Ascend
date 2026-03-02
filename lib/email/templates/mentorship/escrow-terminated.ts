import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendEscrowTerminated(params: {
  mentorEmail: string;
  menteeEmail: string;
  mentorName: string;
  menteeName: string;
  refundAmountRupees: string;
  engagementUrl: string;
}) {
  if (!resend) return;
  const { mentorEmail, menteeEmail, mentorName, menteeName, refundAmountRupees, engagementUrl } = params;
  const sendMentee = async () => {
    await resend!.emails.send({
      from: FROM,
      to: [menteeEmail],
      subject: `Engagement ended — refund — ${APP_NAME}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#666;">Engagement ended</h1>
  <p>Hi ${menteeName},</p>
  <p>This mentorship engagement has been terminated. ₹${refundAmountRupees} has been refunded to you for uncompleted sessions.</p>
  <p><a href="${engagementUrl}" style="color:#16A34A;">View details</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
    });
  };
  const sendMentor = async () => {
    await resend!.emails.send({
      from: FROM,
      to: [mentorEmail],
      subject: `Engagement ended — ${APP_NAME}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#666;">Engagement ended</h1>
  <p>Hi ${mentorName},</p>
  <p>This mentorship engagement has been terminated. Any completed tranches remain with you; remaining funds have been refunded to the mentee.</p>
  <p><a href="${engagementUrl}" style="color:#16A34A;">View details</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
    });
  };
  await sendMentee();
  await sendMentor();
}
