/**
 * BL-15: Alumni Networks — "X people from your company are on Ascend."
 * Source: Experience.company. Privacy-first: aggregate counts only.
 */

import { prisma } from "@/lib/prisma/client";

/** Normalise company name for grouping (lowercase, trim, collapse spaces). */
function normaliseCompany(name: string): string {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 200);
}

export interface CompanyAlumniCount {
  companyName: string;
  displayName: string;
  count: number;
}

/**
 * Get alumni counts for companies. Uses Experience.company with simple normalisation.
 * For production, consider CompanyCanonicalMap for "Flipkart" vs "Flipkart India".
 */
export async function getAlumniCountsForCompanies(
  companyNames: string[],
  minCount = 1
): Promise<CompanyAlumniCount[]> {
  if (companyNames.length === 0) return [];
  const normalised = new Map<string, string>(); // normalised -> first display form
  for (const n of companyNames) {
    const norm = normaliseCompany(n);
    if (norm && !normalised.has(norm)) normalised.set(norm, n.trim());
  }
  const norms = Array.from(normalised.keys());
  if (norms.length === 0) return [];

  const experiences = await prisma.experience.findMany({
    where: { profile: { user: { deletedAt: null } } },
    select: { company: true },
  });

  const rawCounts = new Map<string, number>();
  const displayNames = new Map<string, string>();
  for (const e of experiences) {
    const c = e.company?.trim();
    if (!c) continue;
    const norm = normaliseCompany(c);
    if (!norms.includes(norm)) continue;
    rawCounts.set(norm, (rawCounts.get(norm) ?? 0) + 1);
    if (!displayNames.has(norm)) displayNames.set(norm, c);
  }

  const result: CompanyAlumniCount[] = [];
  for (const norm of norms) {
    const count = rawCounts.get(norm) ?? 0;
    if (count >= minCount) {
      result.push({
        companyName: norm,
        displayName: displayNames.get(norm) ?? norm,
        count,
      });
    }
  }
  return result.sort((a, b) => b.count - a.count);
}

/** Get alumni count for a single company (e.g. company profile page). */
export async function getAlumniCountForCompany(companyName: string): Promise<number> {
  const [r] = await getAlumniCountsForCompanies([companyName], 0);
  return r?.count ?? 0;
}
