/**
 * Phase 8: Salary aggregation service.
 * All salary queries go through this layer — never raw Prisma in route handlers for salary data.
 * Uses SalaryReport (community, APPROVED) + JDSalarySignal (JD-extracted).
 */

import { prisma } from "@/lib/prisma/client";
import { computePercentiles } from "./percentile";
import { normaliseJDSignal, roleToSlug } from "./normalize";
import { getCached, setCached, buildRoleCacheKey, buildTrendingCacheKey } from "./cache";

const COMMUNITY_FLOOR = 5;

export type SalarySource = "community" | "jd_signals" | "combined";

export interface RoleSalaryResult {
  median: number;
  p25?: number;
  p75?: number;
  p90?: number;
  count: number;
  source: SalarySource;
  sourceLabel: "Community reported" | "From job postings" | "Combined";
  submissionCount: number;
  jdSignalCount: number;
}

function toSourceLabel(source: SalarySource): RoleSalaryResult["sourceLabel"] {
  switch (source) {
    case "community":
      return "Community reported";
    case "jd_signals":
      return "From job postings";
    case "combined":
      return "Combined";
  }
}

export async function getRoleSalary(
  role: string,
  city?: string | null,
  year?: number | null
): Promise<RoleSalaryResult | null> {
  const slug = roleToSlug(role);
  const cacheKey = buildRoleCacheKey(slug, city, year);
  const cached = await getCached<RoleSalaryResult>(cacheKey);
  if (cached) return cached.data;

  const roleLower = role.toLowerCase().trim();
  const cityNorm = city?.toLowerCase().trim();

  const [reports, jdSignals] = await Promise.all([
    prisma.salaryReport.findMany({
      where: {
        status: "APPROVED",
        jobTitle: { contains: roleLower, mode: "insensitive" },
        ...(cityNorm ? { location: { contains: cityNorm, mode: "insensitive" } } : {}),
        ...(year != null ? { year } : {}),
      },
      select: { salaryAmount: true, baseSalary: true },
    }),
    prisma.jDSalarySignal.findMany({
      where: {
        role: { contains: roleLower, mode: "insensitive" },
        ...(cityNorm ? { location: { contains: cityNorm, mode: "insensitive" } } : {}),
      },
      select: { salaryMin: true, salaryMax: true, currency: true, role: true, location: true, createdAt: true },
    }),
  ]);

  const communityValues = reports
    .map((r) => r.salaryAmount ?? r.baseSalary)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const jdValues = jdSignals
    .map((s) =>
      normaliseJDSignal({
        salaryMin: s.salaryMin,
        salaryMax: s.salaryMax,
        currency: s.currency,
        role: s.role,
        location: s.location,
        createdAt: s.createdAt,
      })
    )
    .filter((v): v is NonNullable<typeof v> => v != null)
    .filter((v) => (year == null || v.year === year))
    .map((v) => v.annualSalary);

  const submissionCount = communityValues.length;
  const jdSignalCount = jdValues.length;

  let combinedValues: number[];
  let source: SalarySource;

  if (submissionCount >= COMMUNITY_FLOOR && jdSignalCount > 0) {
    combinedValues = [...communityValues];
    const jdWeight = 0.3;
    combinedValues.push(...jdValues.slice(0, Math.ceil(jdValues.length * jdWeight)));
    source = "combined";
  } else if (submissionCount >= COMMUNITY_FLOOR) {
    combinedValues = communityValues;
    source = "community";
  } else if (jdSignalCount > 0) {
    combinedValues = jdValues;
    source = "jd_signals";
  } else {
    return null;
  }

  const percentiles = computePercentiles(combinedValues);
  if (!percentiles) return null;

  const result: RoleSalaryResult = {
    median: percentiles.median,
    p25: percentiles.p25,
    p75: percentiles.p75,
    p90: percentiles.p90,
    count: percentiles.count,
    source,
    sourceLabel: toSourceLabel(source),
    submissionCount,
    jdSignalCount,
  };

  await setCached(cacheKey, result, submissionCount, jdSignalCount);
  return result;
}

export interface CompanyRoleSalary {
  jobTitle: string;
  median: number;
  p25?: number;
  p75?: number;
  p90?: number;
  count: number;
}

export async function getCompanySalaries(
  companyId: string,
  filters?: { role?: string; city?: string; year?: number }
): Promise<CompanyRoleSalary[]> {
  const reports = await prisma.salaryReport.findMany({
    where: {
      companyId,
      status: "APPROVED",
      ...(filters?.role ? { jobTitle: { contains: filters.role, mode: "insensitive" as const } } : {}),
      ...(filters?.city ? { location: { contains: filters.city, mode: "insensitive" as const } } : {}),
      ...(filters?.year != null ? { year: filters.year } : {}),
    },
    select: { jobTitle: true, salaryAmount: true, baseSalary: true },
  });

  const byRole = reports.reduce<Record<string, number[]>>((acc, r) => {
    const val = r.salaryAmount ?? r.baseSalary;
    if (typeof val === "number" && val > 0) {
      const title = r.jobTitle;
      if (!acc[title]) acc[title] = [];
      acc[title].push(val);
    }
    return acc;
  }, {});

  const out: CompanyRoleSalary[] = [];
  for (const [jobTitle, values] of Object.entries(byRole)) {
    if (values.length < COMMUNITY_FLOOR) continue;
    const p = computePercentiles(values);
    if (!p) continue;
    out.push({
      jobTitle,
      median: p.median,
      p25: p.p25,
      p75: p.p75,
      p90: p.p90,
      count: p.count,
    });
  }
  return out.sort((a, b) => b.median - a.median);
}

export interface TopPayerRow {
  companyId: string;
  companyName: string;
  companySlug: string | null;
  medianSalary: number;
  count: number;
}

export async function getTopPayers(
  role: string,
  city?: string | null,
  limit = 10
): Promise<TopPayerRow[]> {
  const roleLower = role.toLowerCase().trim();
  const cityNorm = city?.toLowerCase().trim();

  const reports = await prisma.salaryReport.findMany({
    where: {
      status: "APPROVED",
      jobTitle: { contains: roleLower, mode: "insensitive" },
      ...(cityNorm ? { location: { contains: cityNorm, mode: "insensitive" } } : {}),
    },
    select: {
      companyId: true,
      salaryAmount: true,
      baseSalary: true,
      company: { select: { name: true, slug: true } },
    },
  });

  const byCompany = reports.reduce<Record<string, { values: number[]; name: string; slug: string | null }>>((acc, r) => {
    const val = r.salaryAmount ?? r.baseSalary;
    if (typeof val !== "number" || val <= 0) return acc;
    const id = r.companyId;
    if (!acc[id]) {
      acc[id] = { values: [], name: r.company.name, slug: r.company.slug };
    }
    acc[id]!.values.push(val);
    return acc;
  }, {});

  const rows: TopPayerRow[] = [];
  for (const [companyId, obj] of Object.entries(byCompany)) {
    if (obj.values.length < COMMUNITY_FLOOR) continue;
    const p = computePercentiles(obj.values);
    if (!p) continue;
    rows.push({
      companyId,
      companyName: obj.name,
      companySlug: obj.slug,
      medianSalary: p.median,
      count: p.count,
    });
  }
  rows.sort((a, b) => b.medianSalary - a.medianSalary);
  return rows.slice(0, limit);
}

export interface CitySalaryRow {
  city: string;
  median: number;
  costIndex: number | null;
  adjustedMedian: number;
}

export async function getCitySalaryComparison(
  role: string,
  cities: string[]
): Promise<CitySalaryRow[]> {
  if (cities.length === 0) return [];
  const results: CitySalaryRow[] = [];
  const cityMetrics = await prisma.cityMetric.findMany({
    where: { city: { in: cities.map((c) => c.trim()) } },
    select: { city: true, costIndex: true },
  });
  const costByCity = new Map(cityMetrics.map((m) => [m.city.toLowerCase(), m.costIndex ?? 100]));

  for (const city of cities) {
    const salary = await getRoleSalary(role, city, null);
    if (!salary) continue;
    const costIndex = costByCity.get(city.toLowerCase().trim()) ?? 100;
    results.push({
      city: city.trim(),
      median: salary.median,
      costIndex: costByCity.get(city.toLowerCase().trim()) ?? null,
      adjustedMedian: costIndex > 0 ? Math.round((salary.median * 100) / costIndex) : salary.median,
    });
  }
  return results.sort((a, b) => b.adjustedMedian - a.adjustedMedian);
}

export interface SalaryEstimateResult {
  estimate: number;
  range?: { low: number; high: number };
  confidence: "high" | "medium" | "low";
  dataPoints: number;
  communityCount?: number;
  jdSignalCount?: number;
}

export async function getSalaryEstimate(input: {
  role: string;
  city: string;
  yearsExp: number;
  companyType?: string;
}): Promise<SalaryEstimateResult | null> {
  const salary = await getRoleSalary(input.role, input.city, new Date().getFullYear());
  if (!salary) return null;

  const dataPoints = salary.count;
  let confidence: "high" | "medium" | "low" = "low";
  if (dataPoints >= 30) confidence = "high";
  else if (dataPoints >= 10) confidence = "medium";

  const expFactor = Math.min(1 + input.yearsExp * 0.02, 1.5);
  const estimate = Math.round(salary.median * expFactor);

  const result: SalaryEstimateResult = {
    estimate,
    confidence,
    dataPoints,
    communityCount: salary.submissionCount,
    jdSignalCount: salary.jdSignalCount,
  };
  if (salary.p25 != null && salary.p75 != null) {
    result.range = {
      low: Math.round((salary.p25 ?? salary.median * 0.85) * expFactor * 0.95),
      high: Math.round((salary.p75 ?? salary.median * 1.15) * expFactor * 1.05),
    };
  }
  return result;
}

export interface TrendingRoleRow {
  role: string;
  roleSlug: string;
  median: number;
  count: number;
  yoyGrowth?: number;
}

export async function getTrendingRoles(limit = 10): Promise<TrendingRoleRow[]> {
  const cacheKey = buildTrendingCacheKey();
  const cached = await getCached<TrendingRoleRow[]>(cacheKey);
  if (cached) return cached.data;

  const signals = await prisma.jDSalarySignal.findMany({
    select: { role: true, salaryMin: true, salaryMax: true, createdAt: true },
  });
  const normalised = signals
    .map((s) => {
      const n = normaliseJDSignal({
        salaryMin: s.salaryMin,
        salaryMax: s.salaryMax,
        currency: "INR",
        role: s.role,
        location: null,
        createdAt: s.createdAt,
      });
      return n ? { ...n, roleSlug: roleToSlug(s.role) } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v != null);

  const byRole = normalised.reduce<Record<string, { values: number[]; slug: string }>>((acc, v) => {
    const key = v.role.toLowerCase().trim();
    if (!acc[key]) acc[key] = { values: [], slug: v.roleSlug };
    acc[key].values.push(v.annualSalary);
    return acc;
  }, {});

  const rows: TrendingRoleRow[] = [];
  for (const [role, obj] of Object.entries(byRole)) {
    const p = computePercentiles(obj.values);
    if (!p) continue;
    rows.push({
      role,
      roleSlug: obj.slug,
      median: p.median,
      count: p.count,
    });
  }
  rows.sort((a, b) => b.count - a.count);
  const top = rows.slice(0, limit);

  await setCached(cacheKey, top, 0, signals.length);
  return top;
}
