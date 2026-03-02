import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { canUseFeature } from "@/lib/payments/gate";
import { getRoleSalary, getTopPayers, getCitySalaryComparison } from "@/lib/salary/aggregate";
import { prisma } from "@/lib/prisma/client";

function slugToRole(slug: string): string {
  return slug.replace(/-/g, " ").trim();
}

/**
 * GET /api/salary/role/[slug] — detailed salary data for a role
 * Free: median, city breakdown (medians), source, submission count
 * Premium: + p25/p75/p90, city CoL comparison, top paying companies
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() || undefined;
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : undefined;

  const role = slugToRole(slug);
  const salary = await getRoleSalary(role, undefined, year ?? null);
  if (!salary) {
    return NextResponse.json(
      { error: "No salary data found for this role yet." },
      { status: 404 }
    );
  }

  const userId = await getSessionUserId();
  const [percentilesAllowed, topPayersAllowed, cityComparisonAllowed] = await Promise.all([
    canUseFeature(userId ?? "", "salary_percentiles"),
    canUseFeature(userId ?? "", "salary_top_payers"),
    canUseFeature(userId ?? "", "salary_city_comparison"),
  ]);

  const citiesFromReports = await prisma.salaryReport.findMany({
    where: {
      status: "APPROVED",
      jobTitle: { contains: role.toLowerCase(), mode: "insensitive" },
    },
    select: { location: true },
    distinct: ["location"],
  });
  const cityList = citiesFromReports.map((r) => r.location).filter(Boolean) as string[];
  const cityBreakdown = await Promise.all(
    cityList.slice(0, 20).map(async (c) => {
      const s = await getRoleSalary(role, c, year ?? null);
      return { city: c, median: s?.median ?? 0, count: s?.count ?? 0 };
    })
  );
  cityBreakdown.sort((a, b) => b.median - a.median);

  const response: Record<string, unknown> = {
    role,
    slug,
    median: salary.median,
    sourceLabel: salary.sourceLabel,
    submissionCount: salary.submissionCount,
    jdSignalCount: salary.jdSignalCount,
    count: salary.count,
    cityBreakdown: cityBreakdown.filter((r) => r.count > 0),
    lastUpdated: new Date().toISOString().slice(0, 7),
  };

  if (percentilesAllowed.allowed && salary.p25 != null && salary.p75 != null && salary.p90 != null) {
    response.p25 = salary.p25;
    response.p75 = salary.p75;
    response.p90 = salary.p90;
  }

  if (topPayersAllowed.allowed) {
    const top = await getTopPayers(role, city, 10);
    response.topPayers = top;
  }

  if (cityComparisonAllowed.allowed && cityList.length > 0) {
    const citiesToCompare = cityList.slice(0, 5);
    const comparison = await getCitySalaryComparison(role, citiesToCompare);
    response.cityComparison = comparison;
  }

  return NextResponse.json(response);
}
