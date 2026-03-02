import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { canUseFeature } from "@/lib/payments/gate";
import { getCitySalaryComparison } from "@/lib/salary/aggregate";

const MAX_CITIES = 5;

/**
 * GET /api/salary/city-comparison — compare salary + cost of living across cities
 * Query: role, cities (comma-separated, max 5)
 * Premium-gated.
 */
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  const { allowed } = await canUseFeature(userId ?? "", "salary_city_comparison");
  if (!allowed) {
    return NextResponse.json(
      { error: "Upgrade to Premium to compare salaries across cities.", upgradeRequired: true },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role")?.trim();
  const citiesParam = searchParams.get("cities");
  const cities = citiesParam
    ? citiesParam.split(",").map((c) => c.trim()).filter(Boolean).slice(0, MAX_CITIES)
    : [];

  if (!role || cities.length === 0) {
    return NextResponse.json(
      { error: "role and cities (comma-separated, max 5) are required" },
      { status: 400 }
    );
  }

  const comparison = await getCitySalaryComparison(role, cities);
  return NextResponse.json({ comparison });
}
