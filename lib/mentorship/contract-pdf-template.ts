/**
 * M-5: Server-side HTML for contract PDF. Escapes for safe HTML.
 */

import type { ContractContent } from "./contract-types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderContractHtml(content: ContractContent, contractId: string): string {
  const { mentor, mentee, engagementScope, financial, clauses, governingLaw } = content;
  const sections: string[] = [];

  sections.push(`
    <h1 style="font-size:18px;margin-bottom:16px;">Mentorship Engagement Contract</h1>
    <p style="font-size:11px;color:#666;">Contract ID: ${escapeHtml(contractId)}</p>
    <p style="font-size:11px;color:#666;">Generated: ${escapeHtml(content.generatedAt)}</p>
  `);

  sections.push(`
    <h2 style="font-size:14px;margin-top:20px;margin-bottom:8px;">1. Parties</h2>
    <p><strong>Mentor:</strong> ${escapeHtml(mentor.fullName)} (${escapeHtml(mentor.verifiedRole)} at ${escapeHtml(mentor.verifiedCompany)}, ${escapeHtml(mentor.verifiedIndustry)}). Verified: ${escapeHtml(mentor.verificationDate)}. Email: ${escapeHtml(mentor.email)}.</p>
    <p><strong>Mentee:</strong> ${escapeHtml(mentee.fullName)} (Target: ${escapeHtml(mentee.targetRole)}; Current: ${escapeHtml(mentee.currentRole)}). Email: ${escapeHtml(mentee.email)}.</p>
  `);

  sections.push(`
    <h2 style="font-size:14px;margin-top:20px;margin-bottom:8px;">2. Engagement Scope</h2>
    <p><strong>Goal:</strong> ${escapeHtml(engagementScope.goal)}</p>
    <p><strong>Commitment:</strong> ${escapeHtml(engagementScope.commitment)}</p>
    <p><strong>Timeline:</strong> ${escapeHtml(engagementScope.timeline)}</p>
    <p>Type: ${escapeHtml(engagementScope.engagementType)} — ${engagementScope.sessionCount} sessions, ${escapeHtml(engagementScope.sessionFrequency)}, ${engagementScope.sessionDurationMins} minutes per session.</p>
  `);

  sections.push(`
    <h2 style="font-size:14px;margin-top:20px;margin-bottom:8px;">3. Financial</h2>
    <p>${financial.pilotFeeWaived ? "Pilot: fees waived." : `Total fee INR: ${financial.totalFeeINR ?? "—"}. Platform fee: ${financial.platformFeePct ?? "—"}%.`}</p>
  `);

  sections.push(`
    <h2 style="font-size:14px;margin-top:20px;margin-bottom:8px;">4. Terms &amp; Clauses</h2>
    <p><strong>Off-platform prohibition:</strong> ${escapeHtml(clauses.offPlatformProhibition)}</p>
    <p><strong>Early termination (mentor):</strong> ${escapeHtml(clauses.earlyTerminationMentor)}</p>
    <p><strong>Early termination (mentee):</strong> ${escapeHtml(clauses.earlyTerminationMentee)}</p>
    <p><strong>Transcription consent:</strong> ${escapeHtml(clauses.transcriptionConsent)}</p>
    <p><strong>Zero Trust acknowledgement:</strong> ${escapeHtml(clauses.zeroTrustAcknowledgement)}</p>
    <p><strong>Auto-release terms:</strong> ${escapeHtml(clauses.autoReleaseTerms)}</p>
    <p><strong>Dispute resolution:</strong> ${escapeHtml(clauses.disputeResolutionProcess)}</p>
    <p><strong>Data retention:</strong> ${escapeHtml(clauses.dataRetention)}</p>
  `);

  sections.push(`
    <h2 style="font-size:14px;margin-top:20px;margin-bottom:8px;">5. Governing Law</h2>
    <p>${escapeHtml(governingLaw.acts.join(", "))}. Jurisdiction: ${escapeHtml(governingLaw.jurisdiction)}.</p>
  `);

  sections.push(`
    <p style="margin-top:24px;font-size:11px;color:#666;">T&amp;C version: ${escapeHtml(content.tcVersion)}.</p>
  `);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.5; color: #222; max-width: 600px; margin: 0 auto; padding: 24px; }
    h1, h2 { color: #0F1A0F; }
    p { margin-bottom: 12px; }
  </style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`;
}
