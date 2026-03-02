import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { computeReadiness } from "@/lib/mentorship/readiness";
import { discoverMentors } from "@/lib/mentorship/discover";
import { prisma } from "@/lib/prisma/client";
import { MentorApplicationSchema } from "@/lib/mentorship/validate";
import { sendApplicationReceivedToMentor } from "@/lib/email/templates/mentorship/application-received";

const MAX_ACTIVE_APPLICATIONS = 2;
const EXPIRY_DAYS = 5;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.mentorApplication.findMany({
    where: { menteeId: session.user.id },
    orderBy: { submittedAt: "desc" },
    include: {
      mentorProfile: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  const list = applications.map((a) => ({
    id: a.id,
    status: a.status,
    submittedAt: a.submittedAt.toISOString(),
    expiresAt: a.expiresAt.toISOString(),
    mentorName: a.mentorProfile.user.name,
    mentorUserId: a.mentorProfile.userId,
    mentorImage: a.mentorProfile.user.image,
    fromRole: a.mentorProfile.fromRole,
    toRole: a.mentorProfile.toRole,
    matchReason: a.matchReason,
    mentorQuestion: a.mentorQuestion,
    menteeAnswer: a.menteeAnswer,
  }));

  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { hasSignedDocument } = await import("@/lib/mentorship/legal/signatures");
  const addendumSigned = await hasSignedDocument(session.user.id, "MENTORSHIP_MARKETPLACE_ADDENDUM");
  if (!addendumSigned) {
    const { trackOutcome } = await import("@/lib/tracking/outcomes");
    await trackOutcome(session.user.id, "M15_LEGAL_GATE_BLOCKED", {
      entityType: "MentorshipApplication",
      metadata: { documentType: "MENTORSHIP_MARKETPLACE_ADDENDUM", blockedRoute: "POST /api/mentorship/applications" },
    });
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    return NextResponse.json(
      {
        error: "You must sign the Mentorship Marketplace Addendum before applying.",
        code: "LEGAL_SIGNATURE_REQUIRED",
        type: "MENTORSHIP_MARKETPLACE_ADDENDUM",
        redirectTo: `${baseUrl}/mentorship/legal/sign/MENTORSHIP_MARKETPLACE_ADDENDUM?next=${encodeURIComponent("/mentorship")}`,
      },
      { status: 403 }
    );
  }

  const { check } = await computeReadiness(session.user.id);
  if (!check.allGatesPassed) {
    return NextResponse.json(
      { error: "Readiness gates not passed", gateBlocked: true },
      { status: 403 }
    );
  }

  const activeCount = await prisma.mentorApplication.count({
    where: {
      menteeId: session.user.id,
      status: { in: ["PENDING", "QUESTION_ASKED"] },
    },
  });
  if (activeCount >= MAX_ACTIVE_APPLICATIONS) {
    return NextResponse.json(
      { error: "Maximum active applications reached (2)", code: "MAX_APPLICATIONS" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = MentorApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const matches = await discoverMentors(session.user.id);
  const match = matches.find((m) => m.mentorProfile.id === data.mentorProfileId);
  const matchScore = match?.matchScore ?? 0;
  const matchScoreAtApplication = match?.matchScore ?? null;
  const matchDimensionsSnapshot = match?.dimensions ?? null;

  const existing = await prisma.mentorApplication.findUnique({
    where: {
      menteeId_mentorProfileId: {
        menteeId: session.user.id,
        mentorProfileId: data.mentorProfileId,
      },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Application to this mentor already exists", code: "DUPLICATE" },
      { status: 409 }
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

  const application = await prisma.mentorApplication.create({
    data: {
      menteeId: session.user.id,
      mentorProfileId: data.mentorProfileId,
      whyThisMentor: data.whyThisMentor,
      goalStatement: data.goalStatement,
      commitment: data.commitment,
      timeline: data.timeline,
      whatAlreadyTried: data.whatAlreadyTried,
      matchReason: data.matchReason,
      matchScore,
      matchScoreAtApplication: matchScoreAtApplication ?? undefined,
      matchDimensionsSnapshot: matchDimensionsSnapshot ? (matchDimensionsSnapshot as object) : undefined,
      status: "PENDING",
      expiresAt,
    },
    include: {
      mentorProfile: {
        include: {
          user: { select: { email: true, name: true } },
        },
      },
      mentee: { select: { name: true } },
    },
  });

  const mentorEmail = application.mentorProfile.user.email;
  const menteeName = application.mentee.name ?? "A mentee";
  const mentorName = application.mentorProfile.user.name ?? "Mentor";
  if (mentorEmail) {
    await sendApplicationReceivedToMentor({
      to: mentorEmail,
      menteeName,
      mentorName,
      whyExcerpt: data.whyThisMentor.slice(0, 200),
      dashboardUrl: `${process.env.NEXTAUTH_URL ?? ""}/dashboard/mentor`,
    });
  }

  return NextResponse.json({
    success: true,
    applicationId: application.id,
  });
}
