import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { canUseFeature } from "@/lib/payments/gate";
import { getCompanySalaries } from "@/lib/salary/aggregate";
import { prisma } from "@/lib/prisma/client";

/**
 * GET /api/salary/company/[companyId] — salary data for a company across roles
 * Free: role list with medians + submission counts
 * Premium: + p25/p75 per role
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await context.params;
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role")?.trim() || undefined;
  const city = searchParams.get("city")?.trim() || undefined;
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : undefined;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, slug: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const roles = await getCompanySalaries(companyId, { role, city, year });
  const userId = await getSessionUserId();
  const { allowed } = await canUseFeature(userId ?? "", "salary_percentiles");

  const list = roles.map((r) => {
    const row: Record<string, unknown> = {
      jobTitle: r.jobTitle,
      median: r.median,
      count: r.count,
    };
    if (allowed && r.p25 != null && r.p75 != null) {
      row.p25 = r.p25;
      row.p75 = r.p75;
    }
    return row;
  });

  return NextResponse.json({
    company: { id: company.id, name: company.name, slug: company.slug },
    roles: list,
  });
}
