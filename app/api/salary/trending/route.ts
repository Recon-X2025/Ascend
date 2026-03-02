import { NextResponse } from "next/server";
import { getTrendingRoles } from "@/lib/salary/aggregate";

/**
 * GET /api/salary/trending — trending roles by data volume
 * From JDSalarySignal. Public, cached 6hrs (via aggregate cache).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const roles = await getTrendingRoles(limit);
  return NextResponse.json({ roles });
}
