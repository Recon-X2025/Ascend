/**
 * Phase 8: JDSalarySignal normalisation for aggregation.
 * ParsedJD stores salary in INR per annum; JDSalarySignal uses same.
 * We use midpoint of range and filter invalid values.
 */

export interface NormalisedJDSignal {
  /** Annual CTC (INR). If stored monthly we multiply by 12. */
  annualSalary: number;
  role: string;
  location: string | null;
  year: number;
}

/**
 * Assume JDSalarySignal from ParsedJD is already annual (schema says "in INR per annum").
 * If we ever ingest monthly figures, detect and multiply by 12.
 */
export function normaliseJDSignal(params: {
  salaryMin: number;
  salaryMax: number;
  currency: string;
  role: string;
  location: string | null;
  createdAt: Date;
}): NormalisedJDSignal | null {
  const { salaryMin, salaryMax, currency, role, location, createdAt } = params;
  if (currency !== "INR" && currency !== "inr") return null;
  if (salaryMin <= 0 && salaryMax <= 0) return null;
  const min = Math.max(0, salaryMin);
  const max = Math.max(min, salaryMax);
  const midpoint = (min + max) / 2;
  const year = createdAt.getFullYear();
  return {
    annualSalary: Math.round(midpoint),
    role: role.trim(),
    location: location?.trim() || null,
    year,
  };
}

/** Slug for role URLs: lowercase, spaces to hyphens, alphanumeric + hyphens only */
export function roleToSlug(role: string): string {
  return role
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "role";
}

/** Normalise city for matching (lowercase, trim) */
export function normaliseCity(city: string): string {
  return city.toLowerCase().trim();
}
