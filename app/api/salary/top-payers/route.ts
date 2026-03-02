import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { canUseFeature } from "@/lib/payments/gate";
import { getTopPayers } from "@/lib/salary/aggregate";

/**
 * GET /api/salary/top-payers — top paying companies for a role
 * Query: role, city
 * Premium-gated: 403 with upgradeRequired for free users.
 */
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  const { allowed } = await canUseFeature(userId ?? "", "salary_top_payers");
  if (!allowed) {
    return NextResponse.json(
      { error: "Upgrade to Premium to see top paying companies.", upgradeRequired: true },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role")?.trim();
  const city = searchParams.get("city")?.trim() || undefined;

  if (!role) {
    return NextResponse.json(
      { error: "role is required" },
      { status: 400 }
    );
  }

  const top = await getTopPayers(role, city, 10);
  return NextResponse.json({ topPayers: top });
}
