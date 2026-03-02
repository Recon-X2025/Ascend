/**
 * Phase 8: Percentile computation using linear interpolation.
 * Given sorted array of numbers, returns p25, p50 (median), p75, p90.
 */

export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0]!;
  const n = sortedValues.length;
  const rank = (p / 100) * (n - 1);
  const i = Math.floor(rank);
  const frac = rank - i;
  const lo = sortedValues[i] ?? 0;
  const hi = sortedValues[Math.min(i + 1, n - 1)] ?? lo;
  return lo + frac * (hi - lo);
}

export interface Percentiles {
  p25: number;
  p50: number;
  median: number;
  p75: number;
  p90: number;
  count: number;
}

export function computePercentiles(values: number[]): Percentiles | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p25: Math.round(percentile(sorted, 25) * 100) / 100,
    p50: Math.round(percentile(sorted, 50) * 100) / 100,
    median: Math.round(percentile(sorted, 50) * 100) / 100,
    p75: Math.round(percentile(sorted, 75) * 100) / 100,
    p90: Math.round(percentile(sorted, 90) * 100) / 100,
    count: sorted.length,
  };
}
