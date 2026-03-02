import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/audit/log";

/**
 * DELETE /api/mentorship/mentors/[mentorId]/tier-override — Admin removes override. mentorId = MentorProfile.id.
 * Next weekly cron will recalculate tier.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ mentorId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { mentorId } = await params;

  const profile = await prisma.mentorProfile.findFirst({
    where: { id: mentorId },
    select: { userId: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  await prisma.mentorProfile.update({
    where: { id: mentorId },
    data: { tierOverriddenByAdmin: false, tierOverrideNote: null },
  });

  await logAudit({
    actorId: session.user.id,
    category: "ADMIN_ACTION",
    action: "MENTOR_TIER_OVERRIDE_REMOVED",
    targetType: "MentorProfile",
    targetId: mentorId,
    metadata: { mentorUserId: profile.userId },
  });

  return NextResponse.json({ success: true });
}
