/**
 * Phase 10B: Best time to apply — heatmap computation from JobPost createdAt.
 * Groups by day-of-week × time-of-day (IST); returns matrix for last 90 days.
 */

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export type PeriodKey = "morning" | "afternoon" | "evening";

/** hour (0-23) -> count */
export type DayHeatmap = Record<number, number>;
/** dayOfWeek -> hour -> count */
export type HeatmapMatrix = Record<DayKey, DayHeatmap>;

const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** IST offset: UTC+5:30 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(date: Date): { day: number; hour: number } {
  const utc = date.getTime();
  const ist = new Date(utc + IST_OFFSET_MS);
  return {
    day: ist.getDay(),
    hour: ist.getHours(),
  };
}

function dayToKey(day: number): DayKey {
  return DAY_KEYS[day] ?? "mon";
}

/**
 * Build empty matrix.
 */
export function emptyHeatmap(): HeatmapMatrix {
  const matrix: HeatmapMatrix = {} as HeatmapMatrix;
  for (const d of DAY_KEYS) {
    matrix[d] = {};
    for (let h = 0; h < 24; h++) matrix[d][h] = 0;
  }
  return matrix;
}

/**
 * Aggregate posting times into heatmap. Expects list of createdAt dates.
 */
export function buildHeatmapFromDates(dates: Date[]): HeatmapMatrix {
  const matrix = emptyHeatmap();
  for (const d of dates) {
    const { day, hour } = toIST(d);
    const key = dayToKey(day);
    matrix[key][hour] = (matrix[key][hour] ?? 0) + 1;
  }
  return matrix;
}

/**
 * Convert to period-based view: morning (6–12), afternoon (12–18), evening (18–24).
 * Returns shape suitable for UI: { mon: { morning: 12, afternoon: 8, evening: 5 }, ... }.
 */
export interface PeriodHeatmap {
  [day: string]: { morning: number; afternoon: number; evening: number };
}

export function toPeriodHeatmap(matrix: HeatmapMatrix): PeriodHeatmap {
  const out: PeriodHeatmap = {};
  for (const d of DAY_KEYS) {
    const dayData = matrix[d];
    out[d] = {
      morning: [6, 7, 8, 9, 10, 11].reduce((s, h) => s + (dayData[h] ?? 0), 0),
      afternoon: [12, 13, 14, 15, 16, 17].reduce(
        (s, h) => s + (dayData[h] ?? 0),
        0
      ),
      evening: [18, 19, 20, 21, 22, 23].reduce(
        (s, h) => s + (dayData[h] ?? 0),
        0
      ),
    };
  }
  return out;
}

/**
 * Find the single best period (day + period) by volume.
 */
export function getBestPeriod(
  periodHeatmap: PeriodHeatmap
): { day: DayKey; period: PeriodKey; count: number } | null {
  let best: { day: DayKey; period: PeriodKey; count: number } | null = null;
  const periods: PeriodKey[] = ["morning", "afternoon", "evening"];
  for (const d of DAY_KEYS) {
    const row = periodHeatmap[d];
    if (!row) continue;
    for (const p of periods) {
      const count = row[p] ?? 0;
      if (count > 0 && (!best || count > best.count)) {
        best = { day: d, period: p, count };
      }
    }
  }
  return best;
}

export const DAY_LABELS: Record<DayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  morning: "6–12",
  afternoon: "12–18",
  evening: "18–24",
};
