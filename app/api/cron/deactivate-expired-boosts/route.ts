import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.jobBoost.updateMany({
    where: { active: true, endsAt: { lt: new Date() } },
    data: { active: false },
  });

  return NextResponse.json({ deactivated: result.count });
}
