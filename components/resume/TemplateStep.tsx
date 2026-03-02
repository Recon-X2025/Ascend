"use client";

import { useEffect, useMemo } from "react";
import { useResumeBuildStore } from "@/store/resume-build";
import {
  TEMPLATE_IDS,
  getRecommendedTemplateIds,
  type TemplateId,
  type CareerIntentForTemplate,
  type ContactForTemplate,
} from "@/lib/resume/templates";
import {
  ClassicTemplate,
  ModernTemplate,
  ExecutiveTemplate,
  TechTemplate,
  CreativeProfessionalTemplate,
  InternationalTemplate,
} from "@/lib/resume/templates";
import { cn } from "@/lib/utils";

const TEMPLATE_META: Record<
  TemplateId,
  { name: string; font: string; Component: React.ComponentType<{ contentSnapshot: import("@/store/resume-build").ContentSnapshot; careerIntent: CareerIntentForTemplate; contact?: ContactForTemplate }> }
> = {
  classic: { name: "Classic", font: "Arial", Component: ClassicTemplate },
  modern: { name: "Modern", font: "Calibri", Component: ModernTemplate },
  executive: { name: "Executive", font: "Times New Roman", Component: ExecutiveTemplate },
  tech: { name: "Tech", font: "Calibri", Component: TechTemplate },
  "creative-professional": { name: "Creative Professional", font: "Arial", Component: CreativeProfessionalTemplate },
  international: { name: "International", font: "Times New Roman", Component: InternationalTemplate },
};

interface TemplateStepProps {
  careerIntent: CareerIntentForTemplate;
  contact?: ContactForTemplate;
  onBack: () => void;
  onContinue: () => void;
}

export function TemplateStep({ careerIntent, contact, onBack, onContinue }: TemplateStepProps) {
  const contentSnapshot = useResumeBuildStore((s) => s.contentSnapshot);
  const editedBulletsByExperienceId = useResumeBuildStore((s) => s.editedBulletsByExperienceId);
  const editedSummary = useResumeBuildStore((s) => s.editedSummary);
  const templateId = useResumeBuildStore((s) => s.templateId);
  const setTemplateId = useResumeBuildStore((s) => s.setTemplateId);

  const effectiveSnapshot = useMemo(() => {
    if (!contentSnapshot) return null;
    const experiences: Record<string, import("@/store/resume-build").ExperienceContent> = {};
    for (const [id, exp] of Object.entries(contentSnapshot.experiences ?? {})) {
      const bullets = editedBulletsByExperienceId[id] ?? exp.rewrittenBullets ?? [];
      experiences[id] = { ...exp, rewrittenBullets: bullets };
    }
    let summaries = contentSnapshot.summaries ?? [];
    if (editedSummary !== null && summaries.length > 0) {
      const idx = contentSnapshot.selectedSummaryIndex ?? 0;
      summaries = [...summaries];
      summaries[idx] = editedSummary;
    }
    return { ...contentSnapshot, experiences, summaries };
  }, [contentSnapshot, editedBulletsByExperienceId, editedSummary]);

  useEffect(() => {
    if (templateId === null) setTemplateId("classic");
  }, [templateId, setTemplateId]);

  const recommended = useMemo(
    () => getRecommendedTemplateIds(careerIntent.targetLevel),
    [careerIntent.targetLevel]
  );

  const selected = (templateId as TemplateId) ?? "classic";
  const PreviewComponent = TEMPLATE_META[selected]?.Component;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,400px]">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Choose a template</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All templates are ATS-safe: single column, standard fonts, no tables or images.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(TEMPLATE_IDS as readonly TemplateId[]).map((id) => {
            const meta = TEMPLATE_META[id];
            const isRecommended = recommended.includes(id);
            const isSelected = selected === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTemplateId(id)}
                className={cn(
                  "ascend-card flex flex-col items-start p-4 text-left transition-all",
                  isSelected
                    ? "ring-2 ring-accent-green bg-accent-green/5"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-medium text-text-primary">{meta.name}</span>
                  {isRecommended && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      Recommended
                    </span>
                  )}
                </div>
                <span className="mt-1 text-xs text-muted-foreground">{meta.font}</span>
                <div className="mt-2 h-16 w-full overflow-hidden rounded border border-border bg-muted/30">
                  <div className="scale-[0.35] origin-top-left" style={{ width: 280, height: 180 }}>
                    {effectiveSnapshot && (
                      <meta.Component
                        contentSnapshot={effectiveSnapshot}
                        careerIntent={careerIntent}
                        contact={contact}
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <button type="button" onClick={onBack} className="btn-ghost">
            ← Back
          </button>
          <button type="button" onClick={onContinue} className="btn-primary">
            Continue →
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-4">
        <div className="ascend-card overflow-hidden p-2">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Live preview</p>
          <div className="max-h-[70vh] overflow-auto rounded border border-border bg-white">
            {effectiveSnapshot && PreviewComponent ? (
              <PreviewComponent
                contentSnapshot={effectiveSnapshot}
                careerIntent={careerIntent}
                contact={contact}
              />
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                Add content in Step 3 to see preview.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
