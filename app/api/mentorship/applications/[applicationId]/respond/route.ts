import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { MentorRespondSchema } from "@/lib/mentorship/validate";
import { sendMentorQuestionToMentee } from "@/lib/email/templates/mentorship/mentor-question";
import { sendApplicationAcceptedToMentee } from "@/lib/email/templates/mentorship/application-accepted";
import { sendApplicationDeclinedToMentee } from "@/lib/email/templates/mentorship/application-declined";
import { createContract } from "@/lib/mentorship/contract";
import { enforceCapacity } from "@/lib/mentorship/tiers";
import { sendCapacityReached } from "@/lib/email/templates/mentorship/capacity-reached";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;

  const application = await prisma.mentorApplication.findUnique({
    where: { id: applicationId },
    include: {
      mentorProfile: { include: { user: { select: { email: true, name: true } } } },
      mentee: { select: { email: true, name: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (application.mentorProfile.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (application.status !== "PENDING" && application.status !== "QUESTION_ASKED") {
    return NextResponse.json(
      { error: "Application already responded to" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = MentorRespondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action, question, declineReason } = parsed.data;
  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const now = new Date();

  if (action === "ACCEPT") {
    const mentorId = application.mentorProfile.userId;
    const capacity = await enforceCapacity(mentorId);
    if (!capacity.canAcceptNewMentee) {
      const baseUrl = process.env.NEXTAUTH_URL ?? "";
      await sendCapacityReached({
        to: application.mentorProfile.user?.email,
        mentorName: application.mentorProfile.user?.name ?? "Mentor",
        activeMenteeCount: capacity.activeMenteeCount,
        maxActiveMentees: capacity.maxActiveMentees,
        dashboardUrl: `${baseUrl}/dashboard/mentor`,
      });
      const { trackOutcome } = await import("@/lib/tracking/outcomes");
      await trackOutcome(mentorId, "M11_CAPACITY_ENFORCED", {
        entityId: applicationId,
        entityType: "MentorApplication",
        metadata: { mentorId, activeMenteeCount: capacity.activeMenteeCount, maxActiveMentees: capacity.maxActiveMentees },
      });
      return NextResponse.json(
        {
          error: "You're at capacity and cannot accept more mentees right now.",
          code: "MENTOR_AT_CAPACITY",
          maxActiveMentees: capacity.maxActiveMentees,
          activeMenteeCount: capacity.activeMenteeCount,
        },
        { status: 409 }
      );
    }
    await prisma.mentorApplication.update({
      where: { id: applicationId },
      data: { status: "ACCEPTED", mentorRespondedAt: now, updatedAt: now },
    });
    const menteeEmail = application.mentee.email;
    if (menteeEmail) {
      await sendApplicationAcceptedToMentee({
        to: menteeEmail,
        mentorName: application.mentorProfile.user.name ?? "Your mentor",
        applicationsUrl: `${baseUrl}/mentorship/applications`,
      });
    }
    try {
      await createContract(applicationId);
    } catch (err) {
      console.error("[Respond ACCEPT] createContract failed:", err);
    }
    return NextResponse.json({ success: true });
  }

  if (action === "DECLINE") {
    const reason = declineReason ?? "Other";
    await prisma.mentorApplication.update({
      where: { id: applicationId },
      data: {
        status: "DECLINED",
        mentorRespondedAt: now,
        declineReason: reason,
        updatedAt: now,
      },
    });
    const menteeEmail = application.mentee.email;
    if (menteeEmail) {
      await sendApplicationDeclinedToMentee({
        to: menteeEmail,
        mentorName: application.mentorProfile.user.name ?? "The mentor",
        mentorshipUrl: `${baseUrl}/mentorship`,
      });
    }
    const { queueMatchRefresh } = await import("@/lib/mentorship/refresh-matches");
    queueMatchRefresh(application.menteeId).catch(() => {});
    return NextResponse.json({ success: true });
  }

  if (action === "ASK") {
    if (application.status === "QUESTION_ASKED") {
      return NextResponse.json(
        { error: "Question already asked", code: "QUESTION_ALREADY_ASKED" },
        { status: 409 }
      );
    }
    const q = (question ?? "").trim().slice(0, 300);
    if (!q) {
      return NextResponse.json(
        { error: "Question is required for ASK action" },
        { status: 400 }
      );
    }
    await prisma.mentorApplication.update({
      where: { id: applicationId },
      data: {
        status: "QUESTION_ASKED",
        mentorQuestion: q,
        questionAskedAt: now,
        updatedAt: now,
      },
    });
    const menteeEmail = application.mentee.email;
    if (menteeEmail) {
      await sendMentorQuestionToMentee({
        to: menteeEmail,
        mentorName: application.mentorProfile.user.name ?? "Your mentor",
        question: q,
        applicationsUrl: `${baseUrl}/mentorship/applications`,
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}
