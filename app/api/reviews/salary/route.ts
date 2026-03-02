import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { checkReviewSubmitRateLimit } from "@/lib/reviews/rate-limit";
import { salarySubmissionSchema } from "@/lib/reviews/validate";

const PRIVACY_FLOOR = 5;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const approved = await prisma.salaryReport.findMany({
    where: { companyId, status: "APPROVED" },
    select: {
      jobTitle: true,
      location: true,
      year: true,
      salaryAmount: true,
      baseSalary: true,
      baseSalaryOpt: true,
      bonusOpt: true,
      stocksOpt: true,
      currency: true,
    },
  });

  if (approved.length < PRIVACY_FLOOR) {
    return NextResponse.json({
      available: false,
      message: "Salary data will appear here once enough submissions are received.",
      aggregates: null,
    });
  }

  const jobTitle = searchParams.get("jobTitle")?.trim();
  const location = searchParams.get("location")?.trim();
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : null;

  let filtered = approved;
  if (jobTitle) {
    filtered = filtered.filter(
      (r) => r.jobTitle.toLowerCase().includes(jobTitle.toLowerCase())
    );
  }
  if (location) {
    filtered = filtered.filter(
      (r) => r.location.toLowerCase().includes(location.toLowerCase())
    );
  }
  if (year != null && !Number.isNaN(year)) {
    filtered = filtered.filter((r) => r.year === year);
  }

  const values = filtered
    .map((r) => r.salaryAmount ?? r.baseSalary)
    .filter((v): v is number => typeof v === "number" && v > 0);
  if (values.length === 0) {
    return NextResponse.json({
      available: true,
      aggregates: [],
      count: 0,
    });
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  const p25 = sorted[Math.floor(sorted.length * 0.25)] ?? median;
  const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? median;

  const byRole = filtered.reduce<Record<string, number[]>>((acc, r) => {
    const title = r.jobTitle;
    const val = r.salaryAmount ?? r.baseSalary;
    if (typeof val === "number" && val > 0) {
      if (!acc[title]) acc[title] = [];
      acc[title].push(val);
    }
    return acc;
  }, {});

  const aggregates = Object.entries(byRole).map(([jobTitleKey, vals]) => {
    const s = [...vals].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    const med = s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2;
    const p25v = s[Math.floor(s.length * 0.25)] ?? med;
    const p75v = s[Math.floor(s.length * 0.75)] ?? med;
    return {
      jobTitle: jobTitleKey,
      median: Math.round(med * 100) / 100,
      p25: Math.round(p25v * 100) / 100,
      p75: Math.round(p75v * 100) / 100,
      count: s.length,
      year: year ?? undefined,
    };
  });

  return NextResponse.json({
    available: true,
    aggregates: [
      {
        jobTitle: "All roles",
        median: Math.round(median * 100) / 100,
        p25: Math.round(p25 * 100) / 100,
        p75: Math.round(p75 * 100) / 100,
        count: values.length,
        year: year ?? undefined,
      },
      ...aggregates,
    ],
    count: values.length,
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, resetIn } = await checkReviewSubmitRateLimit(userId);
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "You've submitted the maximum number of reviews today. Please try again tomorrow.",
        resetIn,
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = salarySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const company = await prisma.company.findUnique({
    where: { id: data.companyId },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const existing = await prisma.salaryReport.findFirst({
    where: { companyId: data.companyId, userId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted salary data for this company." },
      { status: 409 }
    );
  }

  const employmentType = data.employmentType as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

  await prisma.salaryReport.create({
    data: {
      companyId: data.companyId,
      userId,
      jobTitle: data.jobTitle.trim(),
      department: data.department?.trim() ?? null,
      employmentType,
      location: data.location.trim(),
      experienceYears: data.yearsExp,
      year: data.year,
      currency: data.currency ?? "INR",
      baseSalary: Math.round(data.salaryAmount),
      salaryAmount: data.salaryAmount,
      baseSalaryOpt: data.baseSalary ?? null,
      bonusOpt: data.bonus ?? null,
      stocksOpt: data.stocks ?? null,
      status: "PENDING",
      anonymous: true,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({
    success: true,
    status: "PENDING",
  });
}
