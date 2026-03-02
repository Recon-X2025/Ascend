import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { AlertFrequency } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const update: { name?: string; frequency?: AlertFrequency; active?: boolean } = {};
  if (typeof body.name === "string") update.name = body.name.trim();
  if (["IMMEDIATE", "DAILY", "WEEKLY"].includes(body.frequency)) update.frequency = body.frequency as AlertFrequency;
  if (typeof body.active === "boolean") update.active = body.active;
  const alert = await prisma.jobAlert.updateMany({
    where: { id, userId: session.user.id },
    data: update,
  });
  if (alert.count === 0) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  const updated = await prisma.jobAlert.findUnique({
    where: { id },
  });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const deleted = await prisma.jobAlert.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (deleted.count === 0) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
