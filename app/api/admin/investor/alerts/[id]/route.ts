import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  threshold: z.number().optional(),
  direction: z.enum(["ABOVE", "BELOW"]).optional(),
  message: z.string().min(1).max(1000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid body", details: e }, { status: 400 });
  }

  const alert = await prisma.metricAlert.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.threshold !== undefined && { threshold: body.threshold }),
      ...(body.direction !== undefined && { direction: body.direction }),
      ...(body.message !== undefined && { message: body.message }),
    },
  });

  return NextResponse.json({
    id: alert.id,
    metric: alert.metric,
    threshold: alert.threshold,
    direction: alert.direction,
    message: alert.message,
    triggeredAt: alert.triggeredAt?.toISOString() ?? null,
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    isActive: alert.isActive,
    createdAt: alert.createdAt.toISOString(),
  });
}
