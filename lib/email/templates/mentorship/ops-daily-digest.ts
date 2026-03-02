import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";

export async function sendOpsDailyDigest(params: {
  to: string;
  criticalCount: number;
  highCount: number;
  alertsSummary: Array<{ type: string; severity: string; message: string; entityId: string }>;
  dashboardUrl: string;
}) {
  const client = resend;
  if (!client) return;
  const { to, criticalCount, highCount, alertsSummary, dashboardUrl } = params;
  const rows =
    alertsSummary.length > 0
      ? alertsSummary
          .slice(0, 20)
          .map(
            (a) =>
              `<tr><td>${a.severity}</td><td>${a.type}</td><td>${a.message.slice(0, 80)}…</td><td><a href="${dashboardUrl}#alert-${a.entityId}">View</a></td></tr>`
          )
          .join("")
      : "<tr><td colspan=\"4\">No new critical/high alerts in the last 24 hours.</td></tr>";

  await client.emails.send({
    from: FROM,
    to: [to],
    subject: `[${APP_NAME}] Ops digest: ${criticalCount} critical, ${highCount} high`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:640px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:#0F1A0F;">${APP_NAME}</span> — Mentorship Ops Digest
  </div>
  <h1 style="font-size:20px;">Daily ops check</h1>
  <p><strong>Critical:</strong> ${criticalCount} &nbsp; <strong>High:</strong> ${highCount}</p>
  <table style="width:100%;border-collapse:collapse;margin-top:16px;">
    <thead><tr style="border-bottom:1px solid #ddd;"><th style="text-align:left;">Severity</th><th style="text-align:left;">Type</th><th style="text-align:left;">Message</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top:24px;"><a href="${dashboardUrl}" style="color:#16A34A;">Open Mentorship Ops dashboard</a></p>
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`,
  });
}
