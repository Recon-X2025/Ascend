import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const createAlertSchema = z.object({
  metric: z.string().min(1).max(100),
  threshold: z.number(),
  direction: z.enum(["ABOVE", "BELOW"]),
  message: z.string().min(1).max(1000),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const alerts = await prisma.metricAlert.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    alerts.map((a) => ({
      id: a.id,
      metric: a.metric,
      threshold: a.threshold,
      direction: a.direction,
      message: a.message,
      triggeredAt: a.triggeredAt?.toISOString() ?? null,
      resolvedAt: a.resolvedAt?.toISOString() ?? null,
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof createAlertSchema>;
  try {
    body = createAlertSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid body", details: e }, { status: 400 });
  }

  const alert = await prisma.metricAlert.create({
    data: {
      metric: body.metric,
      threshold: body.threshold,
      direction: body.direction,
      message: body.message,
    },
  });

  return NextResponse.json({
    id: alert.id,
    metric: alert.metric,
    threshold: alert.threshold,
    direction: alert.direction,
    message: alert.message,
    isActive: alert.isActive,
    createdAt: alert.createdAt.toISOString(),
  });
}
