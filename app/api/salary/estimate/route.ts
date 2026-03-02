import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { canUseFeature } from "@/lib/payments/gate";
import { getSalaryEstimate } from "@/lib/salary/aggregate";
import { rateLimit } from "@/lib/redis/ratelimit";

const WINDOW_SECONDS = 3600;
const LIMIT_UNAUTH = 10;
const LIMIT_AUTH = 50;

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous";
  const key = userId ? `salary-estimate:${userId}` : `salary-estimate:ip:${ip}`;
  const limit = userId ? LIMIT_AUTH : LIMIT_UNAUTH;
  const { success, remaining } = await rateLimit(key, limit, WINDOW_SECONDS);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Try again in an hour.", upgradeRequired: false },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const role = typeof body.role === "string" ? body.role.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const yearsExp = typeof body.yearsExp === "number" ? body.yearsExp : typeof body.yearsExp === "string" ? parseInt(body.yearsExp, 10) : 0;
  const companyType = typeof body.companyType === "string" ? body.companyType : undefined;

  if (!role || !city) {
    return NextResponse.json(
      { error: "role and city are required" },
      { status: 400 }
    );
  }

  const result = await getSalaryEstimate({
    role,
    city,
    yearsExp: Number.isFinite(yearsExp) ? Math.max(0, Math.min(40, yearsExp)) : 0,
    companyType,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Not enough data to estimate salary for this role and city." },
      { status: 404 }
    );
  }

  const fullRangeAllowed = (await canUseFeature(userId ?? "", "salary_estimator_full")).allowed;

  const response: Record<string, unknown> = {
    estimate: result.estimate,
    confidence: result.confidence,
    dataPoints: result.dataPoints,
    remaining,
  };
  if (fullRangeAllowed && result.range) {
    response.range = result.range;
    response.communityCount = result.communityCount;
    response.jdSignalCount = result.jdSignalCount;
  }

  return NextResponse.json(response);
}
