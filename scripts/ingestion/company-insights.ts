/**
 * Phase 0C: Company Intelligence Bootstrap
 * Aggregates ParsedJD by company (when company set) or by industry+location (fallback).
 * Usage: npm run ingest:insights
 * Idempotent — safe to re-run after every ingest:parse batch.
 */

import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function pct(count: number, total: number): number {
  if (!total) return 0;
  return Math.round((count / total) * 100) / 100;
}

function topN<T extends string>(
  items: T[],
  n: number
): { value: T; count: number }[] {
  const freq = new Map<T, number>();
  for (const item of items) {
    if (item) freq.set(item, (freq.get(item) ?? 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }));
}

type SkillsJson = { mustHave?: string[]; niceToHave?: string[] } | null;

function flattenSkills(skills: SkillsJson): string[] {
  if (!skills || typeof skills !== "object") return [];
  const must = Array.isArray(skills.mustHave) ? skills.mustHave : [];
  const nice = Array.isArray(skills.niceToHave) ? skills.niceToHave : [];
  return [...must, ...nice].filter((s): s is string => typeof s === "string");
}

function normaliseWorkMode(w: string | null): "REMOTE" | "HYBRID" | "ONSITE" {
  if (!w) return "REMOTE";
  const u = w.toUpperCase();
  if (u === "REMOTE" || u === "HYBRID" || u === "ONSITE")
    return u as "REMOTE" | "HYBRID" | "ONSITE";
  return "REMOTE";
}

type JDRow = {
  title: string | null;
  seniority: string | null;
  workMode: string | null;
  location: string | null;
  industry: string | null;
  skills: unknown;
  salaryMin: number | null;
  salaryMax: number | null;
  functionalArea: string | null;
};

async function buildSignals(
  jds: JDRow[],
  totalCorpus: number
): Promise<{
  totalJDsIndexed: number;
  activeRoleCount: number;
  topRoles: { title: string; count: number; seniority: string | null }[];
  juniorPct: number;
  midPct: number;
  seniorPct: number;
  managerPct: number;
  remotePct: number;
  hybridPct: number;
  onsitePct: number;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryMedian: number | null;
  salaryDisclosureRate: number;
  topSkills: { skill: string; count: number }[];
  topLocations: { city: string; count: number }[];
  primaryLocation: string | null;
  industries: { industry: string; count: number }[];
  functionalAreas: { area: string; count: number }[];
  hiringVelocity: string;
  lastComputedAt: Date;
  corpusSize: number;
}> {
  const total = jds.length;
  const seniorityCounts: Record<string, number> = {
    Junior: 0,
    Mid: 0,
    Senior: 0,
    Manager: 0,
  };
  for (const jd of jds) {
    const s = jd.seniority as keyof typeof seniorityCounts;
    if (s in seniorityCounts) seniorityCounts[s]++;
  }

  const workModeCounts: Record<string, number> = {
    REMOTE: 0,
    HYBRID: 0,
    ONSITE: 0,
  };
  for (const jd of jds) {
    const w = normaliseWorkMode(jd.workMode);
    workModeCounts[w]++;
  }

  const salaryJDs = jds.filter((j) => j.salaryMin != null && j.salaryMax != null);
  const salaryMidpoints = salaryJDs.map((j) =>
    Math.round((j.salaryMin! + j.salaryMax!) / 2)
  );
  const salaryMinAll =
    salaryJDs.length > 0 ? Math.min(...salaryJDs.map((j) => j.salaryMin!)) : null;
  const salaryMaxAll =
    salaryJDs.length > 0 ? Math.max(...salaryJDs.map((j) => j.salaryMax!)) : null;
  const salaryMedianVal = salaryMidpoints.length ? median(salaryMidpoints) : null;

  const allSkills = jds.flatMap((j) => flattenSkills(j.skills as SkillsJson));
  const topSkills = topN(allSkills, 10).map(({ value, count }) => ({
    skill: value,
    count,
  }));

  const allLocations = jds.map((j) => j.location).filter(Boolean) as string[];
  const topLocations = topN(allLocations, 5).map(({ value, count }) => ({
    city: value,
    count,
  }));

  const allTitles = jds.map((j) => j.title).filter(Boolean) as string[];
  const topRoles = topN(allTitles, 5).map(({ value, count }) => ({
    title: value,
    count,
    seniority: jds.find((j) => j.title === value)?.seniority ?? null,
  }));

  const allIndustries = jds.map((j) => j.industry).filter(Boolean) as string[];
  const industries = topN(allIndustries, 5).map(({ value, count }) => ({
    industry: value,
    count,
  }));

  const allAreas = jds
    .map((j) => j.functionalArea)
    .filter(Boolean) as string[];
  const functionalAreas = topN(allAreas, 5).map(({ value, count }) => ({
    area: value,
    count,
  }));

  const corpusShare = totalCorpus > 0 ? total / totalCorpus : 0;
  const hiringVelocity =
    corpusShare > 0.05 ? "high" : corpusShare > 0.01 ? "medium" : "low";
  const distinctTitles = new Set(allTitles);

  return {
    totalJDsIndexed: total,
    activeRoleCount: distinctTitles.size,
    topRoles,
    juniorPct: pct(seniorityCounts.Junior, total),
    midPct: pct(seniorityCounts.Mid, total),
    seniorPct: pct(seniorityCounts.Senior, total),
    managerPct: pct(seniorityCounts.Manager, total),
    remotePct: pct(workModeCounts.REMOTE, total),
    hybridPct: pct(workModeCounts.HYBRID, total),
    onsitePct: pct(workModeCounts.ONSITE, total),
    salaryMin: salaryMinAll,
    salaryMax: salaryMaxAll,
    salaryMedian: salaryMedianVal,
    salaryDisclosureRate: pct(salaryJDs.length, total),
    topSkills,
    topLocations,
    primaryLocation: topLocations[0]?.city ?? null,
    industries,
    functionalAreas,
    hiringVelocity,
    lastComputedAt: new Date(),
    corpusSize: totalCorpus,
  };
}

async function run() {
  console.log("Computing company insights from ParsedJD corpus...\n");

  const totalCorpus = await prisma.parsedJD.count();
  console.log(`Total ParsedJDs: ${totalCorpus}`);

  let processed = 0;
  let errors = 0;

  // ── MODE 1: Company aggregation (when company field is populated) ──
  const companyGroups = await prisma.parsedJD.groupBy({
    by: ["company"],
    _count: { id: true },
    where: { company: { not: null } },
  });

  const companyNames = companyGroups
    .map((g) => g.company)
    .filter((name): name is string => !!name && name.trim().length > 0);
  console.log(`\nMode 1 — Companies with JDs: ${companyNames.length}`);

  for (const companyName of companyNames) {
    try {
      const jds = await prisma.parsedJD.findMany({
        where: { company: companyName },
        select: {
          title: true,
          seniority: true,
          workMode: true,
          location: true,
          industry: true,
          skills: true,
          salaryMin: true,
          salaryMax: true,
          functionalArea: true,
        },
      });

      const signals = await buildSignals(jds as JDRow[], totalCorpus);
      const companyRecord = await prisma.company.findFirst({
        where: { name: { equals: companyName, mode: "insensitive" } },
        select: { id: true },
      });

      await prisma.companyInsight.upsert({
        where: { companyName },
        create: {
          companyName,
          companyId: companyRecord?.id ?? null,
          aggregationType: "company",
          ...signals,
        },
        update: {
          companyId: companyRecord?.id ?? null,
          ...signals,
        },
      });

      processed++;
    } catch (e) {
      console.error(`  Error: ${companyName}:`, (e as Error).message);
      errors++;
    }
  }

  // ── MODE 2: Industry + Location aggregation (when company is null) ──
  const industryLocationGroups = await prisma.parsedJD.groupBy({
    by: ["industry", "location"],
    _count: { id: true },
    where: {
      company: null,
      industry: { not: null },
      location: { not: null },
    },
    having: {
      id: { _count: { gte: 3 } },
    },
    orderBy: [{ _count: { id: "desc" } }],
  });

  console.log(
    `\nMode 2 — Industry+Location groups (min 3 JDs): ${industryLocationGroups.length}`
  );

  for (const row of industryLocationGroups) {
    const industry = row.industry;
    const location = row.location;
    if (!industry || !location) continue;
    const key = `${industry}::${location}`;

    try {
      const jds = await prisma.parsedJD.findMany({
        where: { industry, location, company: null },
        select: {
          title: true,
          seniority: true,
          workMode: true,
          location: true,
          industry: true,
          skills: true,
          salaryMin: true,
          salaryMax: true,
          functionalArea: true,
        },
      });

      const signals = await buildSignals(jds as JDRow[], totalCorpus);

      await prisma.companyInsight.upsert({
        where: { industryLocation: key },
        create: {
          industryLocation: key,
          companyName: null,
          aggregationType: "industry",
          ...signals,
        },
        update: { ...signals },
      });

      processed++;
    } catch (e) {
      console.error(`  Error: ${key}:`, (e as Error).message);
      errors++;
    }
  }

  console.log(`\nDone. Records upserted: ${processed} | Errors: ${errors}`);
  console.log("Re-run after ingest:parse to refresh with latest corpus.");

  await prisma.$disconnect();
}

run();
