import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendMetricAlertTriggered(params: {
  to: string;
  metric: string;
  threshold: number;
  direction: string;
  currentValue: number;
  message: string;
}) {
  const client = resend;
  if (!client) return;
  const { to, metric, threshold, direction, currentValue, message } = params;

  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `[${APP_NAME}] Metric alert: ${metric}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:#333;">Metric alert triggered</h1>
  <p><strong>Metric:</strong> ${metric}</p>
  <p><strong>Threshold:</strong> ${direction === "ABOVE" ? ">" : "<"} ${threshold}</p>
  <p><strong>Current value:</strong> ${currentValue}</p>
  <p>${message}</p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
