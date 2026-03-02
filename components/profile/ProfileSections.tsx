"use client";

import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { AboutSection } from "./sections/AboutSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { EducationSection } from "./sections/EducationSection";
import { SkillsSection } from "./sections/SkillsSection";
import { ResumesSection } from "./sections/ResumesSection";
import { CertificationsSection } from "./sections/CertificationsSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { AwardsSection } from "./sections/AwardsSection";
import { LanguagesSection } from "./sections/LanguagesSection";
import { VolunteerSection } from "./sections/VolunteerSection";
import { PublicationsSection } from "./sections/PublicationsSection";

interface ProfileSectionsProps {
  profile: Record<string, unknown> & {
    id: string;
    headline?: string | null;
    summary?: string | null;
    avatarUrl?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    currentCompany?: string | null;
    currentRole?: string | null;
    totalExpYears?: number | null;
    noticePeriod?: string | null;
    currentCTC?: number | null;
    expectedCTC?: number | null;
    ctcCurrency?: string | null;
    workMode?: string | null;
    experiences?: unknown[];
    educations?: unknown[];
    certifications?: unknown[];
    projects?: unknown[];
    awards?: unknown[];
    languages?: unknown[];
    volunteerWork?: unknown[];
    publications?: unknown[];
    skills?: unknown[];
    resumes?: unknown[];
  };
  onUpdate: () => void;
}

export function ProfileSections({ profile, onUpdate }: ProfileSectionsProps) {
  return (
    <div className="space-y-8">
      <PersonalInfoSection profile={profile} onUpdate={onUpdate} />
      <AboutSection profile={profile} onUpdate={onUpdate} />
      <ExperienceSection profile={profile as Parameters<typeof ExperienceSection>[0]["profile"]} onUpdate={onUpdate} />
      <EducationSection profile={profile as Parameters<typeof EducationSection>[0]["profile"]} onUpdate={onUpdate} />
      <SkillsSection profile={profile as Parameters<typeof SkillsSection>[0]["profile"]} onUpdate={onUpdate} />
      <ResumesSection profile={profile as Parameters<typeof ResumesSection>[0]["profile"]} onUpdate={onUpdate} />
      <CertificationsSection profile={profile as Parameters<typeof CertificationsSection>[0]["profile"]} onUpdate={onUpdate} />
      <ProjectsSection profile={profile as Parameters<typeof ProjectsSection>[0]["profile"]} onUpdate={onUpdate} />
      <AwardsSection profile={profile as Parameters<typeof AwardsSection>[0]["profile"]} onUpdate={onUpdate} />
      <LanguagesSection profile={profile as Parameters<typeof LanguagesSection>[0]["profile"]} onUpdate={onUpdate} />
      <VolunteerSection profile={profile as Parameters<typeof VolunteerSection>[0]["profile"]} onUpdate={onUpdate} />
      <PublicationsSection profile={profile as Parameters<typeof PublicationsSection>[0]["profile"]} onUpdate={onUpdate} />
    </div>
  );
}
