"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useResumeBuildStore } from "@/store/resume-build";
import {
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
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATE_META: Record<
  TemplateId,
  {
    name: string;
    Component: React.ComponentType<{
      contentSnapshot: import("@/store/resume-build").ContentSnapshot;
      careerIntent: CareerIntentForTemplate;
      contact?: ContactForTemplate;
    }>;
  }
> = {
  classic: { name: "Classic", Component: ClassicTemplate },
  modern: { name: "Modern", Component: ModernTemplate },
  executive: { name: "Executive", Component: ExecutiveTemplate },
  tech: { name: "Tech", Component: TechTemplate },
  "creative-professional": { name: "Creative Professional", Component: CreativeProfessionalTemplate },
  international: { name: "International", Component: InternationalTemplate },
};

interface ExportStepProps {
  careerIntent: CareerIntentForTemplate;
  contact?: ContactForTemplate;
  onBack: () => void;
}

export function ExportStep({ careerIntent, contact, onBack }: ExportStepProps) {
  const router = useRouter();
  const [versionId, setVersionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const contentSnapshot = useResumeBuildStore((s) => s.contentSnapshot);
  const editedBulletsByExperienceId = useResumeBuildStore((s) => s.editedBulletsByExperienceId);
  const editedSummary = useResumeBuildStore((s) => s.editedSummary);
  const templateId = useResumeBuildStore((s) => s.templateId);
  const atsScore = useResumeBuildStore((s) => s.atsScore);

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

  const careerIntentId = useResumeBuildStore((s) => s.careerIntentId);
  const selectedTemplateId = (templateId as TemplateId) ?? "classic";
  const PreviewComponent = TEMPLATE_META[selectedTemplateId]?.Component;

  useEffect(() => {
    if (!careerIntentId || !effectiveSnapshot) return;
    let cancelled = false;
    (async () => {
      try {
        const listRes = await fetch("/api/resume/versions");
        const listJson = await listRes.json();
        if (!listJson.success || !Array.isArray(listJson.data)) return;
        const existing = listJson.data.find((v: { careerIntentId: string }) => v.careerIntentId === careerIntentId);
        if (cancelled) return;
        if (existing) {
          await fetch(`/api/resume/versions/${existing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentSnapshot: effectiveSnapshot,
              templateId: selectedTemplateId,
            }),
          });
          if (cancelled) return;
          setVersionId(existing.id);
        } else {
          const createRes = await fetch("/api/resume/versions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              careerIntentId,
              name: careerIntent.targetRole ? `${careerIntent.targetRole} — Draft` : "Resume — Draft",
              templateId: selectedTemplateId,
            }),
          });
          const createJson = await createRes.json();
          if (cancelled) return;
          if (createJson.success && createJson.data?.id) {
            setVersionId(createJson.data.id);
            await fetch(`/api/resume/versions/${createJson.data.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contentSnapshot: effectiveSnapshot }),
            });
          }
        }
      } catch {
        // non-blocking
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [careerIntentId, selectedTemplateId, effectiveSnapshot, careerIntent.targetRole]);

  const handleSaveAndFinish = async () => {
    if (!versionId) return;
    setSaving(true);
    try {
      await fetch(`/api/resume/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETE" }),
      });
      router.push("/resume/versions");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyShareLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/resume/versions` : "";
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const downloadUrl = versionId
    ? (format: "pdf" | "docx") => `/api/resume/export?versionId=${encodeURIComponent(versionId)}&format=${format}`
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text-primary">Export your resume</h2>
      <p className="text-sm text-muted-foreground">
        Review the preview, download in your preferred format, then save to your versions.
      </p>

      {/* Full resume preview */}
      <div className="ascend-card overflow-hidden p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">Preview</p>
        <div className="max-h-[70vh] overflow-auto rounded border border-border bg-white">
          {effectiveSnapshot && PreviewComponent ? (
            <PreviewComponent
              contentSnapshot={effectiveSnapshot}
              careerIntent={careerIntent}
              contact={contact}
            />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">No content to preview.</div>
          )}
        </div>
      </div>

      {/* ATS summary */}
      <div className="ascend-card p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">ATS score</p>
        <p className="text-sm text-text-primary">
          {atsScore != null ? (
            <span className={cn(
              "font-semibold",
              atsScore <= 40 ? "text-red-600" : atsScore <= 70 ? "text-amber-600" : "text-accent-green"
            )}>
              {atsScore}/100
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {" "}
          See the panel on the right for full breakdown and fixes.
        </p>
      </div>

      {/* Download buttons */}
      <div className="flex flex-wrap gap-3">
        {downloadUrl ? (
          <>
            <a href={downloadUrl("pdf")} download target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="default" className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </a>
            <a href={downloadUrl("docx")} download target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download DOCX
              </Button>
            </a>
          </>
        ) : (
          <Button type="button" disabled className="gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing…
          </Button>
        )}
      </div>

      {/* Save & Finish */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          onClick={handleSaveAndFinish}
          disabled={!versionId || saving}
          className="gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save & Finish
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleCopyShareLink} className="gap-2">
          <Copy className="h-4 w-4" />
          {copySuccess ? "Copied!" : "Copy resume versions link"}
        </Button>
      </div>

      <div className="flex gap-4 pt-2">
        <button type="button" onClick={onBack} className="text-sm text-accent-green hover:underline">
          ← Back to Template
        </button>
      </div>
    </div>
  );
}
