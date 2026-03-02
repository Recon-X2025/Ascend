import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const byChannel = searchParams.get("by") === "channel";
  const byEntity = searchParams.get("by") === "entity";

  const events = await prisma.shareEvent.findMany({
    where: { createdAt: { gte: THIRTY_DAYS_AGO } },
    select: { channel: true, entityType: true },
  });

  if (byChannel) {
    const channelCount: Record<string, number> = {};
    for (const e of events) {
      channelCount[e.channel] = (channelCount[e.channel] ?? 0) + 1;
    }
    return NextResponse.json({
      byChannel: Object.entries(channelCount).map(([channel, count]) => ({ channel, count })),
    });
  }

  if (byEntity) {
    const entityCount: Record<string, number> = {};
    for (const e of events) {
      entityCount[e.entityType] = (entityCount[e.entityType] ?? 0) + 1;
    }
    return NextResponse.json({
      byEntityType: Object.entries(entityCount).map(([entityType, count]) => ({ entityType, count })),
    });
  }

  const channelCount: Record<string, number> = {};
  const entityCount: Record<string, number> = {};
  for (const e of events) {
    channelCount[e.channel] = (channelCount[e.channel] ?? 0) + 1;
    entityCount[e.entityType] = (entityCount[e.entityType] ?? 0) + 1;
  }

  return NextResponse.json({
    byChannel: Object.entries(channelCount).map(([channel, count]) => ({ channel, count })),
    byEntityType: Object.entries(entityCount).map(([entityType, count]) => ({ entityType, count })),
    totalEvents: events.length,
  });
}
