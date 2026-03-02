"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useResumeBuildStore } from "@/store/resume-build";
import { cn } from "@/lib/utils";
import type {
  ScoredExperience,
  ScoredEducation,
  ScoredSkill,
  ScoredCertification,
  ScoredProject,
  ScoredAward,
} from "@/lib/resume/profile-map-relevance";

export interface ProfileMapResponse {
  careerIntent: {
    id: string;
    targetRole: string;
    targetIndustry: string;
    switchingIndustry: boolean;
    fromIndustry: string | null;
    toIndustry: string | null;
  };
  experiences: ScoredExperience[];
  educations: ScoredEducation[];
  skills: ScoredSkill[];
  certifications: ScoredCertification[];
  projects: ScoredProject[];
  awards: ScoredAward[];
}

function relevanceChip(score: number) {
  const label = score >= 0.7 ? "High" : score >= 0.4 ? "Medium" : "Low";
  const style =
    score >= 0.7
      ? "bg-accent-green/15 text-accent-green border-accent-green/30"
      : score >= 0.4
        ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        style
      )}
    >
      {label}
    </span>
  );
}

function formatExperienceDates(e: { startYear: number; endYear: number | null; isCurrent: boolean }) {
  const end = e.isCurrent ? "Present" : (e.endYear ?? e.startYear).toString();
  return `${e.startYear} – ${end}`;
}

function formatEducationDates(e: { endYear: number | null; isCurrent: boolean }) {
  if (e.isCurrent) return "Present";
  return e.endYear?.toString() ?? "—";
}

function formatProjectDates(p: { endYear: number | null; isCurrent: boolean }) {
  if (p.isCurrent) return "Present";
  return p.endYear?.toString() ?? "—";
}

interface ProfileMappingStepProps {
  careerIntentId: string;
  onBack: () => void;
  onContinue: () => void;
}

export function ProfileMappingStep({ careerIntentId, onBack, onContinue }: ProfileMappingStepProps) {
  const [data, setData] = useState<ProfileMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    setSelectionsFromSuggested,
    setCondenseExperienceIds,
    selectedExperienceIds,
    selectedEducationIds,
    selectedSkillIds,
    selectedCertificationIds,
    selectedProjectIds,
    selectedAwardIds,
    toggleExperience,
    toggleEducation,
    toggleSkill,
    toggleCertification,
    toggleProject,
    toggleAward,
  } = useResumeBuildStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/resume/profile-map?careerIntentId=${encodeURIComponent(careerIntentId)}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "Failed to load profile");
          setData(null);
          return;
        }
        if (json.success && json.data) {
          setData(json.data);
          setSelectionsFromSuggested({
            experiences: json.data.experiences.map((e: ScoredExperience) => ({ id: e.id, suggested: e.suggested })),
            educations: json.data.educations.map((e: ScoredEducation) => ({ id: e.id, suggested: e.suggested })),
            skills: json.data.skills.map((s: ScoredSkill) => ({ id: s.id, suggested: s.suggested })),
            certifications: json.data.certifications.map((c: ScoredCertification) => ({ id: c.id, suggested: c.suggested })),
            projects: json.data.projects.map((p: ScoredProject) => ({ id: p.id, suggested: p.suggested })),
            awards: json.data.awards.map((a: ScoredAward) => ({ id: a.id, suggested: a.suggested })),
          });
          const condenseIds = (json.data.experiences as ScoredExperience[])
            .filter((e) => e.condenseTip)
            .map((e) => e.id);
          setCondenseExperienceIds(condenseIds);
        }
      } catch {
        if (!cancelled) setError("Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [careerIntentId, setSelectionsFromSuggested, setCondenseExperienceIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading profile…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="space-y-4 py-8">
        <p className="text-destructive">{error ?? "No data"}</p>
        <button type="button" onClick={onBack} className="text-sm text-accent-green hover:underline">
          ← Back to Career Intent
        </button>
      </div>
    );
  }

  const { careerIntent, experiences, educations, skills, certifications, projects, awards } = data;
  const showSwitchBanner = careerIntent.switchingIndustry && careerIntent.fromIndustry && careerIntent.toIndustry;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
      {/* Left: profile sections */}
      <div className="space-y-6">
        {showSwitchBanner && (
          <div className="rounded-lg border border-accent-green/30 bg-accent-green/5 px-4 py-3 text-sm text-text-primary">
            You&apos;re switching from <strong>{careerIntent.fromIndustry}</strong> to{" "}
            <strong>{careerIntent.toIndustry}</strong>. We&apos;ll surface transferable skills and reframe your
            experience for the new industry.
          </div>
        )}

        {/* Work Experience */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Work Experience</h2>
          <div className="space-y-2">
            {experiences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No experience added yet.</p>
            ) : (
              experiences.map((e) => (
                <Card
                  key={e.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedExperienceIds.includes(e.id) && "ring-1 ring-accent-green"
                  )}
                  onClick={() => toggleExperience(e.id)}
                >
                  <CardHeader className="flex flex-row items-start gap-3 py-3">
                    <Checkbox
                      checked={selectedExperienceIds.includes(e.id)}
                      onCheckedChange={() => toggleExperience(e.id)}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{e.designation}</CardTitle>
                      <p className="text-sm text-muted-foreground">{e.company}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatExperienceDates(e)}
                      </p>
                      {e.condenseTip && (
                        <p className="mt-2 text-xs text-amber-600">
                          Consider 1–2 lines only — we&apos;ll handle this in the next step.
                        </p>
                      )}
                    </div>
                    {relevanceChip(e.relevanceScore)}
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Education */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Education</h2>
          <div className="space-y-2">
            {educations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No education added yet.</p>
            ) : (
              educations.map((e) => (
                <Card
                  key={e.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedEducationIds.includes(e.id) && "ring-1 ring-accent-green"
                  )}
                  onClick={() => toggleEducation(e.id)}
                >
                  <CardHeader className="flex flex-row items-start gap-3 py-3">
                    <Checkbox
                      checked={selectedEducationIds.includes(e.id)}
                      onCheckedChange={() => toggleEducation(e.id)}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{e.institution}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {[e.degree, e.fieldOfStudy].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatEducationDates(e)}
                      </p>
                    </div>
                    {relevanceChip(e.relevanceScore)}
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Skills</h2>
          <div className="space-y-2">
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills added yet.</p>
            ) : (
              skills.map((s) => (
                <Card
                  key={s.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedSkillIds.includes(s.id) && "ring-1 ring-accent-green"
                  )}
                  onClick={() => toggleSkill(s.id)}
                >
                  <CardHeader className="flex flex-row items-center gap-3 py-2">
                    <Checkbox
                      checked={selectedSkillIds.includes(s.id)}
                      onCheckedChange={() => toggleSkill(s.id)}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-medium">{s.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{s.proficiency}</p>
                    </div>
                    {relevanceChip(s.relevanceScore)}
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Certifications */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Certifications</h2>
          <div className="space-y-2">
            {certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No certifications added yet.</p>
            ) : (
              certifications.map((c) => (
                <Card
                  key={c.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedCertificationIds.includes(c.id) && "ring-1 ring-accent-green"
                  )}
                  onClick={() => toggleCertification(c.id)}
                >
                  <CardHeader className="flex flex-row items-start gap-3 py-3">
                    <Checkbox
                      checked={selectedCertificationIds.includes(c.id)}
                      onCheckedChange={() => toggleCertification(c.id)}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{c.issuingOrg}</p>
                      {c.issueYear && (
                        <p className="mt-1 text-xs text-muted-foreground">{c.issueYear}</p>
                      )}
                    </div>
                    {relevanceChip(c.relevanceScore)}
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Projects */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Projects</h2>
          <div className="space-y-2">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects added yet.</p>
            ) : (
              projects.map((p) => (
                <Card
                  key={p.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedProjectIds.includes(p.id) && "ring-1 ring-accent-green"
                  )}
                  onClick={() => toggleProject(p.id)}
                >
                  <CardHeader className="flex flex-row items-start gap-3 py-3">
                    <Checkbox
                      checked={selectedProjectIds.includes(p.id)}
                      onCheckedChange={() => toggleProject(p.id)}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      {p.role && (
                        <p className="text-sm text-muted-foreground">{p.role}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatProjectDates(p)}
                      </p>
                    </div>
                    {relevanceChip(p.relevanceScore)}
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Awards */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-primary">Awards</h2>
          <div className="space-y-2">
            {awards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No awards added yet.</p>
            ) : (
              awards.map((a) => (
                <Card
                  key={a.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedAwardIds.includes(a.id) && "ring-1 ring-accent-green"
                  )}
                  onClick={() => toggleAward(a.id)}
                >
                  <CardHeader className="flex flex-row items-start gap-3 py-3">
                    <Checkbox
                      checked={selectedAwardIds.includes(a.id)}
                      onCheckedChange={() => toggleAward(a.id)}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base">{a.title}</CardTitle>
                      {a.issuer && (
                        <p className="text-sm text-muted-foreground">{a.issuer}</p>
                      )}
                      {a.year && (
                        <p className="mt-1 text-xs text-muted-foreground">{a.year}</p>
                      )}
                    </div>
                    {relevanceChip(a.relevanceScore)}
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <button type="button" onClick={onBack} className="btn-ghost">
            ← Back
          </button>
          <button type="button" onClick={onContinue} className="btn-primary">
            Continue →
          </button>
        </div>
      </div>

      {/* Right: Resume Preview placeholder */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="ascend-card p-4">
          <h3 className="text-sm font-semibold text-text-primary">Resume Preview</h3>
          <p className="mt-2 text-xs text-muted-foreground">
            Your selected sections will appear here in Step 3 (AI Content).
          </p>
          <div className="mt-4 flex flex-col gap-2 rounded border border-dashed border-input bg-muted/20 p-6">
            <div className="h-3 w-3/4 rounded bg-muted" />
            <div className="h-2 w-full rounded bg-muted" />
            <div className="mt-4 h-2 w-1/2 rounded bg-muted" />
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-4/5 rounded bg-muted" />
          </div>
        </div>
      </aside>
    </div>
  );
}
