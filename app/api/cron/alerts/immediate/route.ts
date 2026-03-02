import { NextResponse } from "next/server";
import { processAlerts } from "@/lib/alerts/processor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { sent, errors } = await processAlerts("IMMEDIATE");
  return NextResponse.json({ sent, errors });
}
