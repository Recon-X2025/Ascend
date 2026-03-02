import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getMentorProgressToNextTier } from "@/lib/mentorship/analytics";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ success: false, error: "Not a mentor" }, { status: 403 });
  }

  const progress = await getMentorProgressToNextTier(session.user.id);
  return NextResponse.json(progress);
}
