import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ isMentor: false }, { status: 200 });
  }

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isActive: true },
  });

  return NextResponse.json({
    isMentor: !!(mentorProfile?.isActive),
    mentorProfileId: mentorProfile?.id ?? undefined,
  });
}
