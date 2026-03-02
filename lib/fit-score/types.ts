/**
 * Phase 5A: Fit score types.
 * FitGapItem is stored as JSON in FitScore model — not a Prisma model.
 */

export interface FitGapItem {
  item: string;
  importance: "critical" | "important" | "minor";
  suggestion: string;
}
