/**
 * Single-column ATS-safe layout: renders sections in order. Used by all 6 templates.
 */

import React from "react";
import type { TemplateProps, TemplateId, SectionKey } from "./types";
import { getSectionOrder } from "./types";
import {
  ContactBlock,
  SummarySection,
  ExperienceSection,
  SkillsSection,
  EducationSectionPlaceholder,
  ProjectsSectionPlaceholder,
  CertificationsSectionPlaceholder,
  AchievementsSectionPlaceholder,
  BoardSectionPlaceholder,
} from "./sections";

const SECTION_RENDERERS: Record<
  SectionKey,
  (props: TemplateProps & { summaryText?: string }) => React.ReactNode
> = {
  summary: (p) => <SummarySection contentSnapshot={p.contentSnapshot} summaryText={p.summaryText} />,
  education: () => <EducationSectionPlaceholder />,
  experience: (p) => <ExperienceSection experiences={p.contentSnapshot.experiences ?? {}} />,
  skills: (p) => <SkillsSection skills={p.contentSnapshot.skills} />,
  projects: () => <ProjectsSectionPlaceholder />,
  certifications: () => <CertificationsSectionPlaceholder />,
  achievements: () => <AchievementsSectionPlaceholder />,
  board: () => <BoardSectionPlaceholder />,
};

export interface TemplateLayoutProps extends TemplateProps {
  templateId: TemplateId;
  /** Optional override for summary (e.g. edited summary from store). */
  summaryText?: string;
  /** Font family: Arial, Calibri, or Times New Roman. */
  fontFamily?: string;
  /** Optional className for wrapper. */
  className?: string;
}

export function TemplateLayout({
  contentSnapshot,
  careerIntent,
  contact,
  templateId,
  summaryText,
  fontFamily = "Arial, sans-serif",
  className,
}: TemplateLayoutProps) {
  const order = getSectionOrder(templateId, careerIntent.targetLevel);
  const props: TemplateProps & { summaryText?: string } = {
    contentSnapshot,
    careerIntent,
    contact,
    summaryText,
  };

  return (
    <div
      className={className}
      style={{
        fontFamily,
        maxWidth: 612,
        margin: 0,
        padding: 24,
        fontSize: 11,
        color: "#111",
      }}
      data-template={templateId}
    >
      <ContactBlock contact={contact} />
      {order.map((key) => (
        <React.Fragment key={key}>{SECTION_RENDERERS[key]?.(props)}</React.Fragment>
      ))}
    </div>
  );
}
