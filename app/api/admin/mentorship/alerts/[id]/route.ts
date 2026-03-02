import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { resolveOpsAlert } from "@/lib/mentorship/ops-alerts";
import { z } from "zod";

const patchSchema = z.object({
  isRead: z.boolean().optional(),
  resolved: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const alert = await prisma.opsAlert.findUnique({ where: { id } });
  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

  const updates: { isRead?: boolean; resolvedAt?: Date | null; resolvedById?: string | null } = {};
  if (parsed.data.isRead !== undefined) updates.isRead = parsed.data.isRead;
  if (parsed.data.resolved === true) {
    updates.resolvedAt = new Date();
    updates.resolvedById = session.user.id;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(alert);
  }

  if (updates.resolvedAt && updates.resolvedById) {
    await resolveOpsAlert(id, session.user.id);
  }
  if (updates.isRead !== undefined) {
    await prisma.opsAlert.update({
      where: { id },
      data: { isRead: updates.isRead },
    });
  }

  const updated = await prisma.opsAlert.findUnique({
    where: { id },
    include: { resolvedBy: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(updated);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const alert = await prisma.opsAlert.findUnique({
    where: { id },
    include: { resolvedBy: { select: { id: true, name: true, email: true } } },
  });
  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  return NextResponse.json(alert);
}
