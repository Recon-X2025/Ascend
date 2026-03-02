import { NextResponse } from "next/server";
import { getRoleSalary, getTrendingRoles } from "@/lib/salary/aggregate";
import { roleToSlug } from "@/lib/salary/normalize";

/**
 * GET /api/salary/roles — search/browse salary data by role
 * Query: role (optional), city, year, page
 * If role provided: returns that role's salary if found.
 * If no role: returns trending roles with median (paginated).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roleQuery = searchParams.get("role")?.trim();
  const city = searchParams.get("city")?.trim() || undefined;
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = 20;

  if (roleQuery && roleQuery.length >= 2) {
    const data = await getRoleSalary(roleQuery, city, year ?? null);
    if (!data) {
      return NextResponse.json({
        roles: [],
        page: 1,
        perPage,
        total: 0,
      });
    }
    return NextResponse.json({
      roles: [
        {
          role: roleQuery,
          slug: roleToSlug(roleQuery),
          median: data.median,
          sourceLabel: data.sourceLabel,
          count: data.count,
        },
      ],
      page: 1,
      perPage,
      total: 1,
    });
  }

  const trending = await getTrendingRoles(perPage * 3);
  const start = (page - 1) * perPage;
  const slice = trending.slice(start, start + perPage);
  const roles = slice.map((r) => ({
    role: r.role,
    slug: r.roleSlug,
    median: r.median,
    sourceLabel: "From job postings" as const,
    count: r.count,
  }));
  return NextResponse.json({
    roles,
    page,
    perPage,
    total: trending.length,
  });
}
