import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { isEnabled } from "@/lib/feature-flags";

const MAX_ALERTS_FREE = 3;
// MAX_ALERTS_PREMIUM = 20 when premium tier is implemented

function getMaxAlerts(): number {
  return MAX_ALERTS_FREE;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const list = await prisma.jobAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, query: true, filters: true, frequency: true, active: true, lastSentAt: true, createdAt: true },
  });
  return NextResponse.json({ success: true, data: list });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isEnabled("job_alerts_enabled"))) {
    return NextResponse.json(
      { success: false, error: "Job alerts are temporarily disabled" },
      { status: 503 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const frequency = body.frequency as string;
  if (!["IMMEDIATE", "DAILY", "WEEKLY"].includes(frequency)) {
    return NextResponse.json({ success: false, error: "Invalid frequency" }, { status: 400 });
  }
  const max = getMaxAlerts();
  const count = await prisma.jobAlert.count({ where: { userId: session.user.id } });
  if (count >= max) {
    return NextResponse.json(
      { success: false, error: "Maximum alerts (3) reached. Upgrade for more." },
      { status: 400 }
    );
  }
  const filters = body.filters ?? null;
  const savedSearchId = body.savedSearchId && typeof body.savedSearchId === "string" ? body.savedSearchId : null;
  const alert = await prisma.jobAlert.create({
    data: {
      userId: session.user.id,
      savedSearchId,
      name: name || query || "Job alert",
      query: query || "",
      filters,
      frequency: frequency as "IMMEDIATE" | "DAILY" | "WEEKLY",
    },
  });
  return NextResponse.json({ success: true, data: alert });
}
