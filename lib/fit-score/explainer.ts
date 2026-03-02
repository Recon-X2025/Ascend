/**
 * Phase 5A: Optional AI enrichment of gap suggestions. Never blocks API.
 * Only calls GPT-4o when there are 3+ gap items.
 */

import { openai, GPT4O } from "@/lib/ai/openai";
import {
  FIT_SCORE_EXPLAINER_SYSTEM_PROMPT,
  buildFitScoreExplainerPrompt,
  FIT_SCORE_EXPLAINER_PROMPT_VERSION,
} from "@/lib/ai/prompts/fit-score-explainer";
import { trackAIInteraction } from "@/lib/tracking/outcomes";
import type { FitGapItem } from "./types";

export async function enrichGapSuggestions(
  gaps: FitGapItem[],
  jobTitle: string,
  seekerCurrentRole: string | null,
  userId?: string
): Promise<FitGapItem[]> {
  if (gaps.length < 3) return gaps;

  const start = Date.now();
  try {
    const res = await openai.chat.completions.create({
      model: GPT4O,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        { role: "system", content: FIT_SCORE_EXPLAINER_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildFitScoreExplainerPrompt(gaps, jobTitle, seekerCurrentRole),
        },
      ],
    });
    const content = res.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as FitGapItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return gaps;
    const enriched: FitGapItem[] = parsed.map((item) => ({
      item: String(item?.item ?? ""),
      importance: (item?.importance === "critical" || item?.importance === "important" ? item.importance : "minor") as FitGapItem["importance"],
      suggestion: String(item?.suggestion ?? ""),
    }));
    const latencyMs = Date.now() - start;
    if (userId) {
      await trackAIInteraction(userId, "FIT_SCORER", FIT_SCORE_EXPLAINER_PROMPT_VERSION, {
        inputTokens: res.usage?.prompt_tokens,
        outputTokens: res.usage?.completion_tokens,
        latencyMs,
        metadata: { gapCount: gaps.length },
      });
    }
    return enriched;
  } catch {
    return gaps;
  }
}
