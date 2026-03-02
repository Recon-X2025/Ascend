import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import type { EmploymentType } from "@prisma/client";

const EMP: Record<string, EmploymentType> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACT",
  intern: "INTERNSHIP",
};

const postSchema = z.object({
  jobTitle: z.string().min(1).max(200),
  experienceYears: z.number().int().min(0).max(70),
  location: z.string().min(1).max(200),
  employmentType: z.enum(["full-time", "part-time", "contract", "intern"]),
  baseSalary: z.number().int().min(0),
  bonus: z.number().int().min(0).optional().nullable(),
  stockValue: z.number().int().min(0).optional().nullable(),
  year: z.number().int().min(2020).max(2030),
});

function pct(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = (p / 100) * (s.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return lo === hi ? s[lo] : s[lo] + (i - lo) * (s[hi] - s[lo]);
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  const sp = new URL(req.url).searchParams;
  const jobTitle = sp.get("jobTitle")?.trim();
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const where: { companyId: string; jobTitle?: string } = { companyId: company.id };
  if (jobTitle) where.jobTitle = jobTitle;
  const reports = await prisma.salaryReport.findMany({
    where,
    select: { jobTitle: true, baseSalary: true, bonus: true, location: true },
  });
  const byTitle = new Map<string, { salaries: number[]; bonuses: number[]; locations: Set<string> }>();
  for (const r of reports) {
    if (!byTitle.has(r.jobTitle))
      byTitle.set(r.jobTitle, { salaries: [], bonuses: [], locations: new Set() });
    const g = byTitle.get(r.jobTitle) as { salaries: number[]; bonuses: number[]; locations: Set<string> };
    g.salaries.push(r.baseSalary);
    if (r.bonus != null) g.bonuses.push(r.bonus);
    g.locations.add(r.location);
  }
  const groups = Array.from(byTitle.entries());
  const slice = groups.slice((page - 1) * limit, page * limit);
  const MIN = 3;
  const salaries = slice.map(([title, g]) => {
    if (g.salaries.length < MIN) return { jobTitle: title, count: g.salaries.length, available: false };
    const s = [...g.salaries].sort((a, b) => a - b);
    const avgBonus =
      g.bonuses.length > 0
        ? Math.round(g.bonuses.reduce((a, b) => a + b, 0) / g.bonuses.length)
        : undefined;
    return {
      jobTitle: title,
      count: g.salaries.length,
      available: true,
      median: pct(s, 50),
      p25: pct(s, 25),
      p75: pct(s, 75),
      min: s[0],
      max: s[s.length - 1],
      avgBonus,
      locations: Array.from(g.locations),
    };
  });
  return NextResponse.json({ salaries, totalCount: groups.length });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  const { allowed, resetIn } = await checkRateLimit("salary:" + userId, 5, 3600);
  if (!allowed)
    return NextResponse.json(
      { error: "Too many submissions. Please try again later.", resetIn },
      { status: 429 }
    );
  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const year = parsed.data.year;
  const existing = await prisma.salaryReport.findFirst({
    where: {
      userId,
      companyId: company.id,
      jobTitle: parsed.data.jobTitle,
      year,
    },
  });
  if (existing)
    return NextResponse.json(
      { error: "You have already submitted salary data for this role and year." },
      { status: 409 }
    );
  const report = await prisma.salaryReport.create({
    data: {
      companyId: company.id,
      userId,
      jobTitle: parsed.data.jobTitle,
      experienceYears: parsed.data.experienceYears,
      location: parsed.data.location,
      employmentType: EMP[parsed.data.employmentType] || "FULL_TIME",
      baseSalary: parsed.data.baseSalary,
      bonus: parsed.data.bonus ?? null,
      stockValue: parsed.data.stockValue ?? null,
      year,
      anonymous: true,
    },
    select: { id: true },
  });
  return NextResponse.json({ id: report.id, message: "Salary data submitted. Thank you." });
}
