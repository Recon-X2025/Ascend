import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { MenteeAnswerSchema } from "@/lib/mentorship/validate";
import { sendMenteeAnswerToMentor } from "@/lib/email/templates/mentorship/mentee-answer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;

  const application = await prisma.mentorApplication.findUnique({
    where: { id: applicationId },
    include: {
      mentorProfile: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      mentee: { select: { id: true, name: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isMentee = application.menteeId === session.user.id;
  const isMentor = application.mentorProfile.userId === session.user.id;

  if (!isMentee && !isMentor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload: Record<string, unknown> = {
    id: application.id,
    status: application.status,
    submittedAt: application.submittedAt.toISOString(),
    expiresAt: application.expiresAt.toISOString(),
    mentorRespondedAt: application.mentorRespondedAt?.toISOString() ?? null,
    questionAskedAt: application.questionAskedAt?.toISOString() ?? null,
    answerSubmittedAt: application.answerSubmittedAt?.toISOString() ?? null,
    mentorName: application.mentorProfile.user.name,
    mentorUserId: application.mentorProfile.userId,
    matchReason: application.matchReason,
    whyThisMentor: application.whyThisMentor,
    goalStatement: application.goalStatement,
    commitment: application.commitment,
    timeline: application.timeline,
    whatAlreadyTried: application.whatAlreadyTried,
    mentorQuestion: application.mentorQuestion,
    menteeAnswer: application.menteeAnswer,
  };

  if (isMentee) {
    delete (payload as Record<string, unknown>).declineReason;
  } else {
    payload.declineReason = application.declineReason;
    payload.menteeName = application.mentee.name;
  }

  return NextResponse.json(payload);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;

  const application = await prisma.mentorApplication.findUnique({
    where: { id: applicationId },
    include: {
      mentorProfile: { include: { user: { select: { email: true, name: true } } } },
      mentee: { select: { email: true, name: true } },
    },
  });

  if (!application || application.menteeId !== session.user.id) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }

  let body: { action?: string; answer?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "WITHDRAW") {
    if (application.status !== "PENDING" && application.status !== "QUESTION_ASKED") {
      return NextResponse.json(
        { error: "Can only withdraw PENDING or QUESTION_ASKED applications" },
        { status: 400 }
      );
    }
    await prisma.mentorApplication.update({
      where: { id: applicationId },
      data: { status: "WITHDRAWN", updatedAt: new Date() },
    });
    const { sendApplicationWithdrawnToMentor } = await import(
      "@/lib/email/templates/mentorship/application-withdrawn"
    );
    const mentorEmail = application.mentorProfile.user.email;
    if (mentorEmail) {
      await sendApplicationWithdrawnToMentor({
        to: mentorEmail,
        menteeName: application.mentee.name ?? "A mentee",
      });
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === "ANSWER") {
    if (application.status !== "QUESTION_ASKED") {
      return NextResponse.json(
        { error: "Can only answer when mentor has asked a question" },
        { status: 400 }
      );
    }
    const parsed = MenteeAnswerSchema.safeParse({ answer: body.answer });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const now = new Date();
    await prisma.mentorApplication.update({
      where: { id: applicationId },
      data: {
        menteeAnswer: parsed.data.answer,
        answerSubmittedAt: now,
        updatedAt: now,
      },
    });
    const mentorEmail = application.mentorProfile.user.email;
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    if (mentorEmail) {
      await sendMenteeAnswerToMentor({
        to: mentorEmail,
        menteeName: application.mentee.name ?? "A mentee",
        answer: parsed.data.answer,
        dashboardUrl: `${baseUrl}/dashboard/mentor`,
      });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
