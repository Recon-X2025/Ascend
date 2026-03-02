/**
 * Phase 6: Application-related emails. Fire-and-forget; never throw to caller.
 */

import { resend } from "@/lib/email/resend";

const FROM = process.env.EMAIL_FROM ?? "Ascend <onboarding@resend.dev>";
const APP_NAME = "Ascend";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function wrapBody(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#333;max-width:560px;margin:0 auto;padding:24px;">
  <div style="margin-bottom:24px;"><strong style="color:#1E3A5F;">${APP_NAME}</strong></div>
  ${content}
  <p style="font-size:12px;color:#999;margin-top:32px;">© ${new Date().getFullYear()} ${APP_NAME}</p>
</body>
</html>
`;
}

/** Application confirmation to applicant. Fire-and-forget. */
export function sendApplicationConfirmation(params: {
  to: string;
  jobTitle: string;
  companyName: string;
  submittedAt: Date;
}): void {
  if (!resend) return;
  const url = `${BASE_URL}/dashboard/seeker/applications`;
  const content = `
    <h1 style="font-size:18px;color:#1E3A5F;">Application submitted</h1>
    <p>Your application to <strong>${escapeHtml(params.jobTitle)}</strong> at <strong>${escapeHtml(params.companyName)}</strong> has been submitted.</p>
    <p>Submitted: ${params.submittedAt.toLocaleDateString()}.</p>
    <p><a href="${url}" style="color:#3B82F6;">View your applications</a></p>
    <p>We'll notify you when the recruiter reviews your application.</p>
  `;
  resend.emails
    .send({
      from: FROM,
      to: [params.to],
      subject: `Your application to ${params.jobTitle} at ${params.companyName} has been submitted`,
      html: wrapBody(content),
    })
    .catch((err) => console.error("[Applications] Confirmation email failed:", err));
}

const STATUS_MESSAGES: Record<string, string> = {
  UNDER_REVIEW: "Good news — your application is being reviewed.",
  SHORTLISTED: "Congratulations! You've been shortlisted.",
  INTERVIEW_SCHEDULED: "You've been selected for an interview. The recruiter will be in touch.",
  OFFERED: "Congratulations! You've received an offer.",
  REJECTED: "Thank you for your interest. Unfortunately, you were not selected for this role.",
};

/** Status update to applicant. Fire-and-forget. */
export function sendStatusUpdateEmail(params: {
  to: string;
  jobTitle: string;
  companyName: string;
  newStatus: string;
}): void {
  if (!resend) return;
  const message = STATUS_MESSAGES[params.newStatus] ?? "Your application status has been updated.";
  const url = `${BASE_URL}/dashboard/seeker/applications`;
  const content = `
    <h1 style="font-size:18px;color:#1E3A5F;">Update on your application</h1>
    <p>Update on your application to <strong>${escapeHtml(params.jobTitle)}</strong> at <strong>${escapeHtml(params.companyName)}</strong>.</p>
    <p>${message}</p>
    <p><a href="${url}" style="color:#3B82F6;">View your applications</a></p>
  `;
  resend.emails
    .send({
      from: FROM,
      to: [params.to],
      subject: `Update on your application to ${params.jobTitle} at ${params.companyName}`,
      html: wrapBody(content),
    })
    .catch((err) => console.error("[Applications] Status update email failed:", err));
}

/** New application alert to recruiter. Fire-and-forget. */
export function sendNewApplicationAlertToRecruiter(params: {
  to: string;
  jobTitle: string;
  applicantName: string;
  fitScore: number | null;
  jobId: number;
}): void {
  if (!resend) return;
  const url = `${BASE_URL}/dashboard/recruiter/jobs/${params.jobId}/applications`;
  const fitText = params.fitScore != null ? ` Fit score: ${params.fitScore}/100.` : "";
  const content = `
    <h1 style="font-size:18px;color:#1E3A5F;">New application</h1>
    <p><strong>${escapeHtml(params.applicantName)}</strong> applied for <strong>${escapeHtml(params.jobTitle)}</strong>.${fitText}</p>
    <p><a href="${url}" style="color:#3B82F6;">View Application →</a></p>
  `;
  resend.emails
    .send({
      from: FROM,
      to: [params.to],
      subject: `New application for ${params.jobTitle}`,
      html: wrapBody(content),
    })
    .catch((err) => console.error("[Applications] Recruiter alert email failed:", err));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
