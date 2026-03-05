/**
 * Phase 10B: Weekly career digest email — Monday 7am IST.
 * Data-first, plain HTML, brand-aligned.
 */

import { resend } from "@/lib/email/resend";
import type { WeeklyDigestData } from "@/lib/intelligence/candidate";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";
const BRAND_GREEN = "#16A34A";
const INK = "#0F1A0F";
const MUTED = "#666";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatLakhs(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function buildHtml(data: WeeklyDigestData): string {
  const sections: string[] = [];

  sections.push(`
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:${INK};">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:${INK};">Your weekly career snapshot — ${data.firstName}</h1>
  `);

  if (data.marketValue) {
    sections.push(`
    <p style="margin-top:20px;"><strong>Market value</strong><br/>
    ${formatLakhs(data.marketValue.min)} – ${formatLakhs(data.marketValue.max)} / year (median ${formatLakhs(data.marketValue.median)})<br/>
    <span style="font-size:13px;color:${MUTED};">${data.marketValue.basis}</span></p>
    `);
  } else {
    sections.push(`
    <p style="margin-top:20px;"><strong>Market value</strong><br/>
    <span style="color:${MUTED};">Update your career context to unlock this.</span></p>
    `);
  }

  if (data.visibilityScore != null) {
    sections.push(`
    <p style="margin-top:16px;"><strong>Profile visibility score</strong><br/>
    ${data.visibilityScore}/100${data.topRecommendation ? ` — ${data.topRecommendation}` : ""}</p>
    `);
  }

  if (data.topMissingSkills.length > 0) {
    sections.push(`
    <p style="margin-top:16px;"><strong>Top skills to add</strong><br/>
    ${data.topMissingSkills.map((s) => s.skill).join(", ")}</p>
    `);
  }

  sections.push(`
  <p style="margin-top:16px;"><strong>Application stats</strong><br/>
  Applied: ${data.appliedThisPeriod} · Response rate: ${data.responseRate != null ? `${Math.round(data.responseRate)}%` : "—"}</p>
  `);

  if (data.newJobMatches && data.newJobMatches.length > 0) {
    const jobsUrl = `${(process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")}/jobs`;
    sections.push(`
    <p style="margin-top:16px;"><strong>New jobs matching your interests</strong></p>
    <ul style="margin:8px 0;padding-left:20px;">
    ${data.newJobMatches.map((j) => `<li><a href="${jobsUrl}/${j.slug}" style="color:${BRAND_GREEN};">${escapeHtml(j.title)} at ${escapeHtml(j.companyName)}</a></li>`).join("")}
    </ul>
    `);
  }

  if (data.platformStats && data.platformStats.newJobsThisWeek > 0) {
    sections.push(`
    <p style="margin-top:16px;"><strong>This week on Ascend</strong><br/>
    ${data.platformStats.newJobsThisWeek} new job${data.platformStats.newJobsThisWeek === 1 ? "" : "s"} posted</p>
    `);
  }

  if (data.bestTimeLine) {
    sections.push(`
    <p style="margin-top:16px;"><strong>Best time to apply</strong><br/>
    ${data.bestTimeLine}</p>
    `);
  }

  sections.push(`
  <p style="margin:24px 0;">
    <a href="${data.dashboardUrl}" style="display:inline-block;background:${BRAND_GREEN};color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View full dashboard</a>
  </p>
  <p style="font-size:12px;color:${MUTED};margin-top:32px;">You're receiving this because you opted in to career updates. <a href="${(process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")}/settings/privacy" style="color:${BRAND_GREEN};">Unsubscribe</a> in settings.</p>
  <p style="font-size:12px;color:#999;">© ${new Date().getFullYear()} ${APP_NAME}</p>
  `);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:480px;margin:0 auto;padding:24px;">
  ${sections.join("")}
</body>
</html>
`;
}

export async function sendWeeklyDigestEmail(
  to: string,
  data: WeeklyDigestData
): Promise<void> {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Your weekly career snapshot — ${data.firstName}`,
    html: buildHtml(data),
  });
}
