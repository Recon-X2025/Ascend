import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";
import { z } from "zod";
import type { DataRequestStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.enum(["PROCESSING", "COMPLETED", "FAILED"]),
  adminNote: z.string().max(2000).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const dataRequest = await prisma.dataRequest.findUnique({
    where: { id },
  });
  if (!dataRequest) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const status = parsed.data.status as DataRequestStatus;
  const adminNote = parsed.data.adminNote?.trim() ?? null;

  const updated = await prisma.dataRequest.update({
    where: { id },
    data: {
      status,
      completedAt: status === "COMPLETED" || status === "FAILED" ? new Date() : undefined,
    },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "DATA_REQUEST_UPDATED",
    targetType: "DataRequest",
    targetId: id,
    metadata: {
      dataRequestId: id,
      status,
      userId: dataRequest.userId,
      type: dataRequest.type,
      adminNote: adminNote ?? undefined,
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      status: updated.status,
      completedAt: updated.completedAt?.toISOString() ?? null,
    },
  });
}
