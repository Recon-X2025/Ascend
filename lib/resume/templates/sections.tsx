/**
 * ATS-safe resume section building blocks. Single column, plain text, standard fonts only.
 * No tables, columns, text boxes, icons, or images.
 */

import React from "react";
import type { ContentSnapshot, ExperienceContent, ResumeSkills } from "./types";
import type { ContactForTemplate } from "./types";

const SAFE_FONT = "Arial, Calibri, 'Times New Roman', sans-serif";

const baseStyle: React.CSSProperties = {
  fontFamily: SAFE_FONT,
  color: "#111",
};

export function ContactBlock({ contact }: { contact?: ContactForTemplate }) {
  if (!contact) return null;
  const parts = [contact.name, contact.email, contact.phone, contact.location].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <div style={{ ...baseStyle, fontSize: 11, marginBottom: 8 }} data-section="contact">
      {parts.join(" · ")}
    </div>
  );
}

export function SummarySection({
  contentSnapshot,
  summaryText,
}: {
  contentSnapshot: ContentSnapshot;
  summaryText?: string;
}) {
  const text =
    summaryText ??
    (contentSnapshot.summaries?.[contentSnapshot.selectedSummaryIndex ?? 0] ?? "");
  if (!text.trim()) return null;
  return (
    <section style={{ ...baseStyle, marginBottom: 12 }} data-section="summary">
      <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Summary
      </h2>
      <p style={{ fontSize: 11, lineHeight: 1.4 }}>{text}</p>
    </section>
  );
}

export function ExperienceSection({
  experiences,
  style: styleOverride,
}: {
  experiences: Record<string, ExperienceContent>;
  style?: React.CSSProperties;
}) {
  const entries = Object.entries(experiences);
  if (entries.length === 0) return null;
  return (
    <section style={{ ...baseStyle, marginBottom: 12, ...styleOverride }} data-section="experience">
      <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Experience
      </h2>
      {entries.map(([_, exp]) => (
        <div key={_} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600 }}>
            {exp.designation ?? "Role"}
            {exp.company ? `, ${exp.company}` : ""}
          </div>
          <ul style={{ margin: "2px 0 0 0", paddingLeft: 18, fontSize: 11, lineHeight: 1.35 }}>
            {(exp.rewrittenBullets ?? []).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export function SkillsSection({ skills }: { skills?: ResumeSkills }) {
  if (!skills) return null;
  const all = [
    ...(skills.core ?? []),
    ...(skills.technical ?? []),
    ...(skills.soft ?? []),
    ...(skills.tools ?? []),
  ].filter(Boolean);
  if (all.length === 0) return null;
  return (
    <section style={{ ...baseStyle, marginBottom: 12 }} data-section="skills">
      <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Skills
      </h2>
      <p style={{ fontSize: 11, lineHeight: 1.4 }}>{all.join(" · ")}</p>
    </section>
  );
}

export function EducationSectionPlaceholder() {
  return (
    <section style={{ ...baseStyle, marginBottom: 12 }} data-section="education">
      <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Education
      </h2>
      <p style={{ fontSize: 11, color: "#666" }}>—</p>
    </section>
  );
}

export function ProjectsSectionPlaceholder() {
  return (
    <section style={{ ...baseStyle, marginBottom: 12 }} data-section="projects">
      <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Projects
      </h2>
      <p style={{ fontSize: 11, color: "#666" }}>—</p>
    </section>
  );
}

export function CertificationsSectionPlaceholder() {
  return (
    <section style={{ ...baseStyle, marginBottom: 12 }} data-section="certifications">
      <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Certifications
      </h2>
      <p style={{ fontSize: 11, color: "#666" }}>—</p>
    </section>
  );
}

export function AchievementsSectionPlaceholder() {
  return (
    <section style={{ ...baseStyle, marginBottom: 12 }} data-section="achievements">
      <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Achievements
      </h2>
      <p style={{ fontSize: 11, color: "#666" }}>—</p>
    </section>
  );
}

export function BoardSectionPlaceholder() {
  return (
    <section style={{ ...baseStyle, marginBottom: 12 }} data-section="board">
      <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Board & Advisory
      </h2>
      <p style={{ fontSize: 11, color: "#666" }}>—</p>
    </section>
  );
}

export const sectionStyle = baseStyle;
