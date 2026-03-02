import { NextResponse } from "next/server";
import { expireUnsignedContracts } from "@/lib/mentorship/contract";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await expireUnsignedContracts();
  return NextResponse.json({ ok: true });
}
