import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { trackOutcome } from "@/lib/tracking/outcomes";

const bodySchema = z.object({
  action: z.literal("file"),
  assessment: z.string().min(1).max(2000),
});

/**
 * PATCH /api/mentorship/engagements/milestones/[milestoneId]
 * File assessment (mentor or mentee). When both filed → COMPLETE; if FINAL → trigger outcome doc.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { milestoneId } = await params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid body", details: e }, { status: 400 });
  }

  if (body.action !== "file") {
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  }

  const milestone = await prisma.engagementMilestone.findUnique({
    where: { id: milestoneId },
    include: {
      contract: {
        include: {
          mentor: { select: { id: true, email: true, name: true } },
          mentee: { select: { id: true, email: true, name: true } },
          documents: true,
        },
      },
    },
  });

  if (!milestone) {
    return NextResponse.json({ success: false, error: "Milestone not found" }, { status: 404 });
  }

  const contract = milestone.contract;
  const isMentor = contract.mentorUserId === session.user.id;
  const isMentee = contract.menteeUserId === session.user.id;
  if (!isMentor && !isMentee) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  if (isMentor) {
    await prisma.engagementMilestone.update({
      where: { id: milestoneId },
      data: {
        mentorAssessment: body.assessment,
        mentorFiledAt: now,
        status: "MENTOR_FILED",
      },
    });
    const { sendMilestoneFiled } = await import(
      "@/lib/email/templates/mentorship/engagement-milestone-filed"
    );
    await sendMilestoneFiled({
      to: contract.mentee.email,
      recipientName: contract.mentee.name ?? "Mentee",
      milestoneType: milestone.type,
      filedBy: "MENTOR",
      engagementUrl: `${baseUrl}/mentorship/engagements/${contract.id}`,
    });
  } else {
    await prisma.engagementMilestone.update({
      where: { id: milestoneId },
      data: {
        menteeAssessment: body.assessment,
        menteeFiledAt: now,
        status: "MENTEE_FILED",
      },
    });
    const { sendMilestoneFiled } = await import(
      "@/lib/email/templates/mentorship/engagement-milestone-filed"
    );
    await sendMilestoneFiled({
      to: contract.mentor.email,
      recipientName: contract.mentor.name ?? "Mentor",
      milestoneType: milestone.type,
      filedBy: "MENTEE",
      engagementUrl: `${baseUrl}/mentorship/engagements/${contract.id}`,
    });
  }

  const updated = await prisma.engagementMilestone.findUniqueOrThrow({
    where: { id: milestoneId },
  });

  await trackOutcome(session.user.id, "M8_MILESTONE_FILED", {
    entityId: contract.id,
    entityType: "MentorshipContract",
    metadata: {
      contractId: contract.id,
      milestoneId,
      milestoneType: updated.type,
      filedBy: isMentor ? "MENTOR" : "MENTEE",
    },
  });

  // If both filed → COMPLETE; notify both; if FINAL → outcome doc can be created by mentor
  const bothFiled = Boolean(updated.mentorAssessment && updated.menteeAssessment);
  if (bothFiled) {
    await prisma.engagementMilestone.update({
      where: { id: milestoneId },
      data: { status: "COMPLETE", completedAt: new Date() },
    });
    // M-6: Mark tranche pending release (7-day confirm or auto-release)
    try {
      const { markMilestonePendingRelease } = await import("@/lib/escrow");
      await markMilestonePendingRelease(milestoneId);
    } catch (e) {
      console.error("[milestones] markMilestonePendingRelease failed:", e);
    }
    const { sendMilestoneComplete } = await import(
      "@/lib/email/templates/mentorship/engagement-milestone-complete"
    );
    await sendMilestoneComplete({
      mentorEmail: contract.mentor.email,
      menteeEmail: contract.mentee.email,
      mentorName: contract.mentor.name ?? "Mentor",
      menteeName: contract.mentee.name ?? "Mentee",
      milestoneType: updated.type,
      engagementUrl: `${baseUrl}/mentorship/engagements/${contract.id}`,
    });
    await trackOutcome(contract.mentorUserId, "M8_MILESTONE_COMPLETE", {
      entityId: contract.id,
      entityType: "MentorshipContract",
      metadata: { contractId: contract.id, milestoneId, milestoneType: updated.type },
    });
    await trackOutcome(contract.menteeUserId, "M8_MILESTONE_COMPLETE", {
      entityId: contract.id,
      entityType: "MentorshipContract",
      metadata: { contractId: contract.id, milestoneId, milestoneType: updated.type },
    });
  }

  return NextResponse.json({ success: true });
}
