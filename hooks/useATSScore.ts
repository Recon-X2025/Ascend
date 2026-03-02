"use client";

import { useEffect, useRef, useState } from "react";
import { useResumeBuildStore } from "@/store/resume-build";
import type { ContentSnapshot, ExperienceContent } from "@/store/resume-build";

const DEBOUNCE_MS = 1000;

function buildEffectiveSnapshot(): ContentSnapshot | null {
  const state = useResumeBuildStore.getState();
  const snap = state.contentSnapshot;
  if (!snap) return null;
  const experiences: Record<string, ExperienceContent> = {};
  for (const [id, exp] of Object.entries(snap.experiences ?? {})) {
    const bullets = state.editedBulletsByExperienceId[id] ?? exp.rewrittenBullets ?? [];
    experiences[id] = { ...exp, rewrittenBullets: bullets };
  }
  let summaries = snap.summaries ?? [];
  if (state.editedSummary !== null && summaries.length > 0) {
    const idx = snap.selectedSummaryIndex ?? 0;
    summaries = [...summaries];
    summaries[idx] = state.editedSummary;
  }
  return { ...snap, experiences, summaries };
}

/**
 * Watches resume build store (contentSnapshot, edits, careerIntentId), debounces 1000ms,
 * calls POST /api/resume/ats-score and updates the store. Returns isLoading (recalculating).
 */
export function useATSScore(): { isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const careerIntentId = useResumeBuildStore((s) => s.careerIntentId);
  const contentSnapshot = useResumeBuildStore((s) => s.contentSnapshot);
  const editedBulletsByExperienceId = useResumeBuildStore((s) => s.editedBulletsByExperienceId);
  const editedSummary = useResumeBuildStore((s) => s.editedSummary);
  const setATSResult = useResumeBuildStore((s) => s.setATSResult);

  useEffect(() => {
    if (!careerIntentId) return;
    const effective = buildEffectiveSnapshot();
    if (!effective || !effective.experiences || Object.keys(effective.experiences).length === 0) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = setTimeout(async () => {
      timeoutRef.current = null;
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;
      setIsLoading(true);
      try {
        const res = await fetch("/api/resume/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentSnapshot: effective,
            careerIntentId,
          }),
          signal,
        });
        const json = await res.json();
        if (signal.aborted) return;
        if (json.success && json.data) {
          setATSResult({
            score: json.data.score,
            issues: json.data.issues ?? null,
            categoryScores: json.data.categoryScores ?? null,
            keywordAnalysis: json.data.keywordAnalysis ?? null,
          });
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        // non-blocking
      } finally {
        if (!signal.aborted) setIsLoading(false);
        abortRef.current = null;
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setIsLoading(false); // reset when effect re-runs or unmounts
    };
  }, [
    careerIntentId,
    contentSnapshot,
    editedBulletsByExperienceId,
    editedSummary,
    setATSResult,
  ]);

  return { isLoading };
}
