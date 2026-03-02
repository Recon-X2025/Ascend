import { NextResponse } from "next/server";
import { closeExpiredJobs } from "@/lib/jobs/deadline";
import { removeJob } from "@/lib/search/sync/jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { count, closedIds } = await closeExpiredJobs();
  for (const id of closedIds) {
    removeJob(id);
  }
  return NextResponse.json({ closed: count });
}
