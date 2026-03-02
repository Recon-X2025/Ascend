/**
 * Job alert processor: run search, filter new jobs since lastSentAt, send digest email.
 */

import { prisma } from "@/lib/prisma/client";
import { searchJobs } from "@/lib/search/queries/jobs";
import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";
const MAX_JOBS_PER_EMAIL = 10;
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export type AlertFrequency = "IMMEDIATE" | "DAILY" | "WEEKLY";

export async function processAlertById(alertId: string): Promise<{ sent: boolean; error?: string }> {
  const alert = await prisma.jobAlert.findUnique({
    where: { id: alertId },
    include: { user: { select: { email: true } } },
  });
  if (!alert) return { sent: false, error: "Not found" };
  try {
    const filters = (alert.filters ?? {}) as Record<string, unknown>;
    const params = {
      q: alert.query || undefined,
      limit: MAX_JOBS_PER_EMAIL + 5,
      location: typeof filters.location === "string" ? filters.location : undefined,
      jobType: Array.isArray(filters.jobType) ? (filters.jobType as string[]) : undefined,
      workMode: Array.isArray(filters.workMode) ? (filters.workMode as string[]) : undefined,
      skills: Array.isArray(filters.skills) ? (filters.skills as string[]) : undefined,
    };
    const result = await searchJobs(params);
    const newHits = result.hits.slice(0, MAX_JOBS_PER_EMAIL);
    if (newHits.length === 0) {
      return { sent: false, error: "No jobs to send" };
    }
    const ids = newHits.map((h) => parseInt(h.id, 10));
    const jobSlugs = await prisma.jobPost.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true },
    });
    const slugById = new Map(jobSlugs.map((j) => [j.id, j.slug]));
    const newJobs = newHits.map((h) => ({ ...h, slug: slugById.get(parseInt(h.id, 10)) ?? h.id }));
    const jobsUrl = BASE_URL + "/jobs?" + buildQueryString(filters, alert.query);
    const html = buildDigestHtml(alert.name, newJobs, jobsUrl, result.found);
    if (!resend) return { sent: false, error: "Email not configured" };
    const { error } = await resend.emails.send({
      from: FROM,
      to: [alert.user.email],
      subject: `[Test] New jobs matching "${alert.name}"`,
      html,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function processAlerts(frequency: AlertFrequency): Promise<{ sent: number; errors: number }> {
  const alerts = await prisma.jobAlert.findMany({
    where: { active: true, frequency },
    include: { user: { select: { email: true, name: true } } },
  });
  let sent = 0;
  let errors = 0;
  for (const alert of alerts) {
    try {
      const filters = (alert.filters ?? {}) as Record<string, unknown>;
      const params = {
        q: alert.query || undefined,
        limit: MAX_JOBS_PER_EMAIL + 5,
        location: typeof filters.location === "string" ? filters.location : undefined,
        jobType: Array.isArray(filters.jobType) ? (filters.jobType as string[]) : undefined,
        workMode: Array.isArray(filters.workMode) ? (filters.workMode as string[]) : undefined,
        skills: Array.isArray(filters.skills) ? (filters.skills as string[]) : undefined,
        datePosted: undefined,
      };
      const result = await searchJobs(params);
      const since = alert.lastSentAt ? Math.floor(alert.lastSentAt.getTime() / 1000) : 0;
      const newHits = result.hits.filter((h) => h.publishedAt > since).slice(0, MAX_JOBS_PER_EMAIL);
      if (newHits.length === 0) continue;
      const ids = newHits.map((h) => parseInt(h.id, 10));
      const jobSlugs = await prisma.jobPost.findMany({
        where: { id: { in: ids } },
        select: { id: true, slug: true },
      });
      const slugById = new Map(jobSlugs.map((j) => [j.id, j.slug]));
      const newJobs = newHits.map((h) => ({ ...h, slug: slugById.get(parseInt(h.id, 10)) ?? h.id }));
      const jobsUrl = BASE_URL + "/jobs?" + buildQueryString(filters, alert.query);
      const html = buildDigestHtml(alert.name, newJobs, jobsUrl, result.found);
      if (!resend) {
        console.warn("[alerts] Resend not configured, skipping email");
        continue;
      }
      const { error } = await resend.emails.send({
        from: FROM,
        to: [alert.user.email],
        subject: `New jobs matching "${alert.name}"`,
        html,
      });
      if (error) {
        console.error("[alerts] send error:", error);
        errors++;
        continue;
      }
      await prisma.jobAlert.update({
        where: { id: alert.id },
        data: { lastSentAt: new Date() },
      });
      sent++;
    } catch (e) {
      console.error("[alerts] process error for alert", alert.id, e);
      errors++;
    }
  }
  return { sent, errors };
}

function buildQueryString(filters: Record<string, unknown>, query: string): string {
  const p = new URLSearchParams();
  if (query) p.set("search", query);
  if (Array.isArray(filters.jobType)) p.set("jobType", (filters.jobType as string[]).join(","));
  if (Array.isArray(filters.workMode)) p.set("workMode", (filters.workMode as string[]).join(","));
  if (Array.isArray(filters.skills)) p.set("skills", (filters.skills as string[]).join(","));
  if (typeof filters.location === "string") p.set("location", filters.location);
  return p.toString();
}

function buildDigestHtml(
  alertName: string,
  jobs: { id: string; slug?: string; title: string; companyName?: string; location: string[]; salaryMin?: number; salaryMax?: number; salaryVisible: boolean }[],
  viewAllUrl: string,
  totalFound: number
): string {
  const primaryColor = "#1E3A5F";
  const accentColor = "#3B82F6";
  const rows = jobs
    .map(
      (j) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;">
        <a href="${BASE_URL}/jobs/${j.slug ?? j.id}" style="color:${primaryColor};font-weight:600;text-decoration:none;">${escapeHtml(j.title)}</a>
        <p style="margin:4px 0 0;font-size:14px;color:#666;">${escapeHtml(j.companyName || "Company")} ${j.location?.length ? " · " + j.location.slice(0, 2).join(", ") : ""}</p>
        ${j.salaryVisible && (j.salaryMin != null || j.salaryMax != null) ? `<p style="margin:2px 0 0;font-size:13px;color:#888;">Salary: ${j.salaryMin ?? "—"} – ${j.salaryMax ?? "—"}</p>` : ""}
        <a href="${BASE_URL}/jobs/${j.slug ?? j.id}" style="font-size:13px;color:${accentColor};text-decoration:none;">View Job →</a>
      </td>
    </tr>
  `
    )
    .join("");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:560px;margin:0 auto;padding:24px;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="font-size:24px;font-weight:700;color:${primaryColor};">${APP_NAME}</span>
  </div>
  <h1 style="font-size:20px;color:${primaryColor};">New jobs matching "${escapeHtml(alertName)}"</h1>
  <p>We found ${jobs.length} new job${jobs.length === 1 ? "" : "s"} for you.</p>
  <table style="width:100%;border-collapse:collapse;">${rows}</table>
  <p style="margin:24px 0;">
    <a href="${viewAllUrl}" style="display:inline-block;background:${accentColor};color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View all ${totalFound} results</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:32px;">You received this because you set up a job alert. Manage alerts in your account settings.</p>
</body>
</html>
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
