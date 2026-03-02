import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendInvoiceVoid(params: {
  to: string;
  invoiceNumber: string;
  reason: string;
}) {
  if (!resend) return;
  const { to, invoiceNumber, reason } = params;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#0F1A0F;">Invoice voided</h1>
  <p>Invoice <strong>${invoiceNumber}</strong> has been voided due to ${reason}.</p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Invoice ${invoiceNumber} voided — ${APP_NAME}`,
    html,
  });
}
