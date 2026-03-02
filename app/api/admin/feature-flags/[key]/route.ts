import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ key: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const key = decodeURIComponent((await context.params).key);
  const body = await req.json().catch(() => ({}));
  const enabled = typeof body.enabled === "boolean" ? body.enabled : undefined;
  if (enabled === undefined) {
    return NextResponse.json({ success: false, error: "enabled (boolean) is required" }, { status: 400 });
  }

  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    select: { id: true, key: true, enabled: true },
  });
  if (!flag) {
    return NextResponse.json({ success: false, error: "Feature flag not found" }, { status: 404 });
  }

  const previousValue = flag.enabled;
  if (previousValue === enabled) {
    return NextResponse.json({ ...flag, enabled });
  }

  const updated = await prisma.featureFlag.update({
    where: { key },
    data: { enabled, updatedById: session.user.id },
    select: {
      id: true,
      key: true,
      enabled: true,
      description: true,
      updatedAt: true,
      updatedBy: { select: { name: true, email: true } },
    },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "FEATURE_FLAG_TOGGLED",
    targetType: "FeatureFlag",
    targetId: flag.id,
    targetLabel: key,
    metadata: { key, previousValue, newValue: enabled },
  });

  return NextResponse.json({
    id: updated.id,
    key: updated.key,
    enabled: updated.enabled,
    description: updated.description,
    updatedAt: updated.updatedAt,
    updatedByName: updated.updatedBy?.name ?? updated.updatedBy?.email ?? null,
  });
}
