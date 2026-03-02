import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { isEnabled } from "@/lib/feature-flags";
import { getRecommendedJobs, RECOMMENDED_CACHE_KEY, RECOMMENDED_CACHE_TTL } from "@/lib/jobs/recommended";
import { redis } from "@/lib/redis/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "JOB_SEEKER") {
    return NextResponse.json({ error: "Only job seekers get recommendations" }, { status: 403 });
  }
  if (!(await isEnabled("smart_recommendations"))) {
    return NextResponse.json({ jobs: [] });
  }

  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "true";
  const cacheKey = RECOMMENDED_CACHE_KEY(session.user.id);

  if (!refresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached) as Array<unknown>;
        return NextResponse.json({ jobs: data });
      }
    } catch {
      // ignore cache miss/parse error
    }
  }

  let jobs: Array<unknown>;
  try {
    jobs = await getRecommendedJobs(session.user.id);
  } catch (e) {
    console.error("[jobs/recommended] getRecommendedJobs error:", e);
    return NextResponse.json({ jobs: [] });
  }
  try {
    await redis.setex(cacheKey, RECOMMENDED_CACHE_TTL, JSON.stringify(jobs));
  } catch {
    // non-blocking
  }
  return NextResponse.json({ jobs });
}
