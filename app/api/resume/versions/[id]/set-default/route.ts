import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

/**
 * POST /api/resume/versions/[id]/set-default — sets this version as the default resume for applications.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const version = await prisma.resumeVersion.findFirst({
    where: { id, userId },
  });
  if (!version) {
    return NextResponse.json({ success: false, error: "Resume version not found" }, { status: 404 });
  }
  await prisma.resumeVersion.updateMany({
    where: { userId },
    data: { isDefault: false },
  });
  await prisma.resumeVersion.update({
    where: { id },
    data: { isDefault: true },
  });
  return NextResponse.json({ success: true, data: { id } });
}
