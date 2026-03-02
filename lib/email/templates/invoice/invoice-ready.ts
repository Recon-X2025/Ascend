import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendInvoiceReady(params: {
  to: string;
  invoiceNumber: string;
  downloadUrl: string;
  totalInRupees: string;
}) {
  if (!resend) return;
  const { to, invoiceNumber, downloadUrl, totalInRupees } = params;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#0F1A0F;">Your invoice is ready</h1>
  <p>Invoice <strong>${invoiceNumber}</strong> has been generated. Total: ${totalInRupees} (incl. 18% GST).</p>
  <p style="font-size:14px;color:#666;">This link expires in 7 days. You can also download from your billing dashboard anytime.</p>
  <p style="margin:24px 0;">
    <a href="${downloadUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Download PDF</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Invoice ${invoiceNumber} ready — ${APP_NAME}`,
    html,
  });
}
