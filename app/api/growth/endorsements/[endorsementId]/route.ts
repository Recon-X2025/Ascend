import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ endorsementId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { endorsementId } = await params;
  if (!endorsementId) {
    return NextResponse.json({ success: false, error: "endorsementId required" }, { status: 400 });
  }

  const endorsement = await prisma.profileEndorsement.findUnique({
    where: { id: endorsementId },
    select: { endorserId: true },
  });

  if (!endorsement) {
    return NextResponse.json({ success: false, error: "Endorsement not found" }, { status: 404 });
  }

  if (endorsement.endorserId !== session.user.id) {
    return NextResponse.json({ success: false, error: "You can only retract your own endorsement" }, { status: 403 });
  }

  await prisma.profileEndorsement.delete({
    where: { id: endorsementId },
  });

  return NextResponse.json({ success: true });
}
