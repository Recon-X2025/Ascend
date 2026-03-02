"use client";

import { useState } from "react";
import { useResumeBuildStore } from "@/store/resume-build";
import { cn } from "@/lib/utils";
import type { ContentSnapshot } from "@/store/resume-build";
import { ChevronDown, ChevronUp, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORY_CONFIG: {
  key: keyof { format: number; keyword: number; completeness: number; impact: number };
  label: string;
  max: number;
}[] = [
  { key: "format", label: "Format & Parsability", max: 30 },
  { key: "keyword", label: "Keyword Match", max: 25 },
  { key: "completeness", label: "Completeness", max: 25 },
  { key: "impact", label: "Impact", max: 20 },
];

function scoreColor(score: number): string {
  if (score <= 40) return "text-red-600";
  if (score <= 70) return "text-amber-600";
  return "text-accent-green";
}

function scoreStrokeColor(score: number): string {
  if (score <= 40) return "stroke-red-500";
  if (score <= 70) return "stroke-amber-500";
  return "stroke-accent-green";
}

function barFillColor(scorePct: number): string {
  if (scorePct <= 40) return "bg-red-500";
  if (scorePct <= 70) return "bg-amber-500";
  return "bg-accent-green";
}

const RULE_TO_SECTION_ID: Record<string, string> = {
  contact_block: "ats-section-summary",
  completeness: "ats-section-experiences",
  impact: "ats-section-experiences",
  format_parsability: "ats-section-summary",
  section_headings: "ats-section-summary",
  date_format: "ats-section-experiences",
  bullets: "ats-section-experiences",
  font_safety: "ats-section-summary",
};

function scrollToSection(rule: string): void {
  const id = RULE_TO_SECTION_ID[rule] ?? "ats-section-summary";
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export interface ATSScorePanelProps {
  contentSnapshot: ContentSnapshot | null;
  careerIntentId: string | null;
  isLoading: boolean;
  targetRole?: string;
}

export function ATSScorePanel({
  contentSnapshot,
  careerIntentId,
  isLoading,
  targetRole = "this role",
}: ATSScorePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const atsScore = useResumeBuildStore((s) => s.atsScore);
  const atsCategoryScores = useResumeBuildStore((s) => s.atsCategoryScores);
  const atsIssues = useResumeBuildStore((s) => s.atsIssues);
  const keywordAnalysis = useResumeBuildStore((s) => s.keywordAnalysis);

  const score = atsScore ?? 0;
  const hasData = atsScore !== null && !isLoading;
  const hasContent = contentSnapshot != null && careerIntentId != null;
  const showSkeleton = isLoading && !hasData;

  // Issues: errors first, then warnings
  const sortedIssues = atsIssues
    ? [...atsIssues].sort((a, b) => {
        if (a.severity === "error" && b.severity !== "error") return -1;
        if (a.severity !== "error" && b.severity === "error") return 1;
        return 0;
      })
    : [];

  return (
    <div className="ascend-card mt-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={!collapsed}
      >
        <h2 className="text-sm font-semibold text-text-primary">ATS Score</h2>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="border-t border-border px-4 pb-4 pt-2">
          {showSkeleton && (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">Recalculating…</p>
              <div className="w-full space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-2 w-full rounded-full bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {!showSkeleton && (
            <>
              {/* Circular gauge */}
              <div className="flex justify-center">
                <div className="relative h-28 w-28">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="stroke-muted"
                      strokeWidth="2.5"
                      fill="none"
                      d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                    />
                    <path
                      className={cn("transition-all", scoreStrokeColor(score))}
                      strokeWidth="2.5"
                      strokeDasharray={hasData ? `${(score / 100) * 97.4} 97.4` : "0 97.4"}
                      strokeLinecap="round"
                      fill="none"
                      stroke="currentColor"
                      d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn("text-2xl font-bold tabular-nums", scoreColor(score))}>
                      {hasData ? score : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Sub-score bars */}
              {atsCategoryScores && (
                <div className="mt-4 space-y-2.5">
                  {CATEGORY_CONFIG.map(({ key, label, max }) => {
                    const v = atsCategoryScores[key];
                    const pct = max > 0 ? Math.round((v / max) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium text-text-secondary tabular-nums">
                            {v}/{max}
                          </span>
                        </div>
                        <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full transition-all", barFillColor(pct))}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Issues list */}
              {sortedIssues.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <h3 className="text-xs font-medium text-text-primary mb-2">Suggested fixes</h3>
                  <ul className="space-y-2">
                    {sortedIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {issue.severity === "error" ? (
                          <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" aria-hidden />
                        ) : (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" aria-hidden />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{issue.suggestion}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 mt-1 text-xs text-accent-green hover:text-accent-green/90"
                            onClick={() => scrollToSection(issue.rule)}
                          >
                            Fix
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Keyword coverage */}
              {keywordAnalysis && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    Your resume contains{" "}
                    <strong className="text-text-primary">{keywordAnalysis.coverageScore}%</strong> of
                    commonly required keywords for {targetRole}.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground w-full">Present:</span>
                    {keywordAnalysis.present.slice(0, 10).map((k) => (
                      <span
                        key={k}
                        className="inline-flex rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-700"
                      >
                        {k}
                      </span>
                    ))}
                    {keywordAnalysis.present.length > 10 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{keywordAnalysis.present.length - 10}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground w-full">Missing:</span>
                    {keywordAnalysis.missingWithSuggestions.map(({ keyword, suggestion }) => (
                      <span
                        key={keyword}
                        title={suggestion}
                        className="inline-flex cursor-help rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-700"
                      >
                        {keyword}
                      </span>
                    ))}
                    {keywordAnalysis.missing.length > keywordAnalysis.missingWithSuggestions.length && (
                      <span className="text-[10px] text-muted-foreground">
                        +{keywordAnalysis.missing.length - keywordAnalysis.missingWithSuggestions.length}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!hasData && hasContent && !isLoading && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Complete experience and summary to see your ATS score.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
