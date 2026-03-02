"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeBuildStore, type ExperienceContent, type ResumeSkills } from "@/store/resume-build";
import { cn } from "@/lib/utils";
import { SkillsStepSection } from "./SkillsStepSection";

const POLL_INTERVAL_MS = 2000;
function hasPlaceholder(text: string): boolean {
  return /\[[^\]]*—[^\]]*\]|\[[^\]]*add your[^\]]*\]/i.test(text);
}

interface AIContentStepProps {
  careerIntentId: string;
  onBack: () => void;
  onContinue: () => void;
}

export function AIContentStep({ careerIntentId, onBack, onContinue }: AIContentStepProps) {
  const [polling, setPolling] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const triggeredRef = useRef(false);

  const {
    selectedExperienceIds,
    selectedEducationIds,
    selectedSkillIds,
    selectedCertificationIds,
    selectedProjectIds,
    condenseExperienceIds,
    generateJobId,
    setGenerateJobId,
    contentSnapshot,
    setContentSnapshot,
    editedBulletsByExperienceId,
    setEditedBullets,
    regenerationCountByExperienceId,
    incrementRegenerationCount,
    summaryJobId,
    setSummaryJobId,
    mergeSummaryResult,
    setSelectedSummaryIndex,
    editedSummary,
    setEditedSummary,
  } = useResumeBuildStore();
  const [summaryPolling, setSummaryPolling] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const startGeneration = async (regenerateExperienceId?: string, regenerationCount?: number) => {
    setGenerateError(null);
    try {
      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerIntentId,
          selectedItems: {
            experiences: selectedExperienceIds,
            skills: selectedSkillIds,
            education: selectedEducationIds,
            certs: selectedCertificationIds,
            projects: selectedProjectIds,
          },
          condenseExperienceIds,
          regenerateExperienceId,
          regenerationCount,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to start generation");
      if (json.data?.jobId) {
        setGenerateJobId(json.data.jobId);
        setPolling(true);
      }
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Failed to start generation");
    }
  };

  useEffect(() => {
    if (triggeredRef.current) return;
    if (!careerIntentId || selectedExperienceIds.length === 0) return;
    triggeredRef.current = true;
    startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount when deps ready
  }, [careerIntentId, selectedExperienceIds.length]);

  useEffect(() => {
    if (!generateJobId || !polling) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/queues/jobs/${generateJobId}`);
        const json = await res.json();
        if (!json.success || !json.data) return;
        const { status, result, error } = json.data;
        if (status === "done" && result) {
          const prev = useResumeBuildStore.getState().contentSnapshot;
          setContentSnapshot({
            status: "DRAFT",
            experiences: result.experiences ?? {},
            summaries: prev?.summaries,
            selectedSummaryIndex: prev?.selectedSummaryIndex ?? 0,
          });
          setGenerateJobId(null);
          setPolling(false);
        } else if (status === "failed") {
          setGenerateError(error ?? "Generation failed");
          setPolling(false);
        }
      } catch {
        // keep polling
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [generateJobId, polling, setContentSnapshot, setGenerateJobId]);

  const handleRegenerateSection = (experienceId: string) => {
    const count = incrementRegenerationCount(experienceId);
    if (count > 3) return;
    startGeneration(experienceId, count);
  };

  const startSummaryGeneration = async () => {
    setSummaryError(null);
    try {
      const res = await fetch("/api/resume/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerIntentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to start summary generation");
      if (json.data?.jobId) {
        setSummaryJobId(json.data.jobId);
        setSummaryPolling(true);
      }
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Failed to start summary generation");
    }
  };

  useEffect(() => {
    if (!summaryJobId || !summaryPolling) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/queues/jobs/${summaryJobId}`);
        const json = await res.json();
        if (!json.success || !json.data) return;
        const { status, result, error } = json.data;
        if (status === "done" && result?.summaries) {
          mergeSummaryResult(result.summaries);
          setEditedSummary(null);
          setSummaryJobId(null);
          setSummaryPolling(false);
        } else if (status === "failed") {
          setSummaryError(error ?? "Summary generation failed");
          setSummaryPolling(false);
        }
      } catch {
        // keep polling
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [summaryJobId, summaryPolling, mergeSummaryResult, setSummaryJobId, setEditedSummary]);

  const isLoading = polling || (triggeredRef.current && !contentSnapshot && !generateError);
  const hasContent = contentSnapshot?.experiences && Object.keys(contentSnapshot.experiences).length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Generating AI content for your experience…</p>
        <div className="space-y-4">
          {selectedExperienceIds.slice(0, 5).map((id) => (
            <div key={id} className="ascend-card animate-pulse p-4">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="mt-2 h-3 w-full rounded bg-muted" />
              <div className="mt-1 h-3 w-4/5 rounded bg-muted" />
              <div className="mt-1 h-3 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
        <button type="button" onClick={onBack} className="btn-ghost">
          ← Back
        </button>
      </div>
    );
  }

  if (generateError && !hasContent) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{generateError}</p>
        <button type="button" onClick={() => startGeneration()} className="btn-primary">
          Retry generation
        </button>
        <button type="button" onClick={onBack} className="btn-ghost ml-2">
          ← Back
        </button>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">No experience selected or no content yet.</p>
        <button type="button" onClick={onBack} className="btn-ghost">
          ← Back
        </button>
      </div>
    );
  }

  const experiences = contentSnapshot!.experiences;
  const summaries = contentSnapshot!.summaries ?? [];
  const selectedSummaryIndex = contentSnapshot!.selectedSummaryIndex ?? 0;
  const displaySummary = editedSummary ?? summaries[selectedSummaryIndex] ?? "";
  const summaryCharCount = displaySummary.length;
  const summaryOverLimit = summaryCharCount > 600;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,320px]">
      <div className="space-y-8">
        <div id="ats-section-experiences">
          {Object.entries(experiences).map(([expId, content]) => (
            <ExperienceBlock
              key={expId}
              content={content}
              editedBullets={editedBulletsByExperienceId[expId]}
              onEditBullets={(bullets) => setEditedBullets(expId, bullets)}
              onRegenerate={() => handleRegenerateSection(expId)}
              regenerationCount={regenerationCountByExperienceId[expId] ?? 0}
            />
          ))}
        </div>

        <div id="ats-section-summary">
          <SummaryCard
          summaries={summaries}
          selectedSummaryIndex={selectedSummaryIndex}
          onSelect={(i) => {
            setSelectedSummaryIndex(i);
            setEditedSummary(null);
          }}
          displaySummary={displaySummary}
          editedSummary={editedSummary}
          onEditedSummaryChange={setEditedSummary}
          onRegenerate={startSummaryGeneration}
          summaryJobPolling={summaryPolling}
          summaryError={summaryError}
        />
        </div>

        <div id="ats-section-skills">
          <SkillsStepSection careerIntentId={careerIntentId} />
        </div>

        <div className="flex flex-wrap justify-between gap-4 pt-4">
          <button type="button" onClick={onBack} className="btn-ghost">
            ← Back
          </button>
          <button type="button" onClick={onContinue} className="btn-primary">
            Continue →
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-4">
        <ResumePreviewPanel
          summaryText={displaySummary}
          charCount={summaryCharCount}
          overLimit={summaryOverLimit}
          skills={contentSnapshot?.skills}
        />
      </aside>
    </div>
  );
}

const SUMMARY_CHAR_RECOMMENDED_MIN = 300;
const SUMMARY_CHAR_RECOMMENDED_MAX = 600;

function SummaryCard({
  summaries,
  selectedSummaryIndex,
  onSelect,
  displaySummary,
  editedSummary,
  onEditedSummaryChange,
  onRegenerate,
  summaryJobPolling,
  summaryError,
}: {
  summaries: string[];
  selectedSummaryIndex: number;
  onSelect: (index: number) => void;
  displaySummary: string;
  editedSummary: string | null;
  onEditedSummaryChange: (text: string | null) => void;
  onRegenerate: () => void;
  summaryJobPolling: boolean;
  summaryError: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const charCount = editedSummary !== null ? editedSummary.length : displaySummary.length;
  const overLimit = charCount > SUMMARY_CHAR_RECOMMENDED_MAX;

  return (
    <div className="ascend-card p-4">
      <h3 className="font-semibold text-text-primary">Your Professional Summary</h3>
      {summaries.length === 0 ? (
        <div className="mt-3">
          {summaryError && <p className="mb-2 text-sm text-destructive">{summaryError}</p>}
          <button
            type="button"
            onClick={onRegenerate}
            disabled={summaryJobPolling}
            className="btn-primary"
          >
            {summaryJobPolling ? "Generating…" : "Generate 3 summaries"}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 space-y-2">
            {summaries.map((text, i) => (
              <label
                key={i}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors",
                  selectedSummaryIndex === i
                    ? "border-accent-green bg-accent-green/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <input
                  type="radio"
                  name="summary-option"
                  checked={selectedSummaryIndex === i}
                  onChange={() => onSelect(i)}
                  className="mt-1"
                />
                <span className="text-sm text-text-secondary">{text}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRegenerate}
              disabled={summaryJobPolling}
              className="text-xs text-accent-green hover:underline"
            >
              {summaryJobPolling ? "Regenerating…" : "Regenerate (3 new)"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing((e) => !e);
                if (!editing) onEditedSummaryChange(displaySummary);
              }}
              className="text-xs text-muted-foreground hover:underline"
            >
              {editing ? "Done editing" : "Edit manually"}
            </button>
          </div>
          {editing && (
            <div className="mt-3">
              <textarea
                value={editedSummary ?? displaySummary}
                onChange={(e) => onEditedSummaryChange(e.target.value)}
                className="min-h-[120px] w-full resize-y rounded border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Professional summary…"
              />
              <p className={cn("mt-1 text-xs", overLimit ? "text-amber-600" : "text-muted-foreground")}>
                {charCount} chars {overLimit && `(recommended ${SUMMARY_CHAR_RECOMMENDED_MIN}–${SUMMARY_CHAR_RECOMMENDED_MAX})`}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const PREVIEW_GROUP_LABELS: Record<keyof Omit<ResumeSkills, "hidden">, string> = {
  core: "Core Skills",
  technical: "Technical Skills",
  soft: "Soft Skills",
  tools: "Tools & Platforms",
};

function ResumePreviewPanel({
  summaryText,
  charCount,
  overLimit,
  skills,
}: {
  summaryText: string;
  charCount: number;
  overLimit: boolean;
  skills?: ResumeSkills | null;
}) {
  const hasSkills = skills && (skills.core.length > 0 || skills.technical.length > 0 || skills.soft.length > 0 || skills.tools.length > 0);
  return (
    <div className="ascend-card p-4">
      <h3 className="text-sm font-semibold text-text-primary">Resume Preview</h3>
      <div className="mt-3">
        {summaryText ? (
          <p className={cn("whitespace-pre-wrap text-sm text-text-secondary", overLimit && "text-amber-600")}>
            {summaryText}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Select or generate a summary to see it here.</p>
        )}
      </div>
      {summaryText && (
        <p className={cn("mt-2 text-xs", overLimit ? "text-amber-600" : "text-muted-foreground")}>
          {charCount} characters {overLimit && "(over 600 — consider shortening)"}
        </p>
      )}
      {hasSkills && (
        <div className="mt-4 border-t border-border pt-3">
          {(["core", "technical", "soft", "tools"] as const).map(
            (group) =>
              skills[group].length > 0 && (
                <div key={group} className="mt-2 first:mt-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {PREVIEW_GROUP_LABELS[group]}
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {skills[group].join(" · ")}
                  </p>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}

function ExperienceBlock({
  content,
  editedBullets,
  onEditBullets,
  onRegenerate,
  regenerationCount,
}: {
  content: ExperienceContent;
  editedBullets: string[] | undefined;
  onEditBullets: (bullets: string[]) => void;
  onRegenerate: () => void;
  regenerationCount: number;
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const bullets = editedBullets ?? content.rewrittenBullets ?? [];
  const originalBullets = content.originalBullets ?? [];

  const handleBulletChange = (index: number, value: string) => {
    const next = [...bullets];
    next[index] = value;
    onEditBullets(next);
  };

  const canRegenerate = regenerationCount < 3;

  return (
    <div className="ascend-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-text-primary">
          {content.designation ?? "Role"} at {content.company ?? "Company"}
        </h3>
        <div className="flex items-center gap-2">
          {content.transferableSkillSurfaced && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">
              Transferable skills surfaced
            </span>
          )}
          {canRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="text-xs text-accent-green hover:underline"
            >
              Regenerate this section
            </button>
          )}
          {regenerationCount >= 3 && (
            <span className="text-xs text-muted-foreground">Max regenerations reached</span>
          )}
        </div>
      </div>

      {originalBullets.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowOriginal((s) => !s)}
            className="text-xs text-muted-foreground hover:underline"
          >
            {showOriginal ? "Hide original" : "Show original"}
          </button>
          {showOriginal && (
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
              {originalBullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-muted-foreground">•</span>
            <BulletEditor
              value={bullet}
              onChange={(v) => handleBulletChange(index, v)}
              placeholder="Add your real metric here"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BulletEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const showPlaceholderTip = hasPlaceholder(value);
  return (
    <div className="min-w-0 flex-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-h-[60px] w-full resize-y rounded border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
          showPlaceholderTip && "border-amber-500/50 bg-amber-500/5"
        )}
        rows={2}
      />
      {showPlaceholderTip && (
        <p className="mt-0.5 text-xs text-amber-600" title={placeholder}>
          Add your real metric where you see [— add your metric]
        </p>
      )}
    </div>
  );
}
