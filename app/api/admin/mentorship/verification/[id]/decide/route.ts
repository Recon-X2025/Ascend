import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logAdminAction } from "@/lib/admin/audit";
import { createNotification } from "@/lib/notifications/create";
import {
  VERIFICATION_REASON_CODES,
  isValidReasonCode,
} from "@/lib/mentorship/verification-codes";
import { NotificationType } from "@prisma/client";
import type { VerificationDecision } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id: mentorVerificationId } = await params;
  let body: { decision?: VerificationDecision; reasonCode?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const decision = body.decision as VerificationDecision | undefined;
  if (
    !decision ||
    !["APPROVED", "REJECTED", "MORE_INFO_REQUESTED"].includes(decision)
  ) {
    return NextResponse.json(
      { error: "decision must be APPROVED, REJECTED, or MORE_INFO_REQUESTED" },
      { status: 400 }
    );
  }

  const reasonCode = typeof body.reasonCode === "string" ? body.reasonCode.trim() : "";
  if (!reasonCode || !isValidReasonCode(reasonCode)) {
    return NextResponse.json(
      {
        error:
          "reasonCode is required and must be one of: " +
          Object.keys(VERIFICATION_REASON_CODES).join(", "),
      },
      { status: 400 }
    );
  }

  const note = typeof body.note === "string" ? body.note.trim() : null;

  const verification = await prisma.mentorVerification.findUnique({
    where: { id: mentorVerificationId },
    include: {
      mentorProfile: {
        include: {
          user: { select: { id: true, email: true } },
          availabilityWindows: { take: 1 },
        },
      },
      documents: true,
    },
  });

  if (!verification) {
    return NextResponse.json(
      { error: "Verification record not found" },
      { status: 404 }
    );
  }

  const now = new Date();
  const mentorUserId = verification.mentorProfile.user.id;
  const humanReason = VERIFICATION_REASON_CODES[reasonCode as keyof typeof VERIFICATION_REASON_CODES];

  await prisma.verificationAuditLog.create({
    data: {
      mentorVerificationId,
      adminId: session.user.id,
      decision,
      reasonCode,
      note: note ?? undefined,
    },
  });

  await logAdminAction({
    adminId: session.user.id,
    action: "MENTOR_VERIFICATION_DECISION",
    targetType: "MentorVerification",
    targetId: mentorVerificationId,
    targetLabel: verification.mentorProfile.userId,
    metadata: { decision, reasonCode },
  });

  if (decision === "APPROVED") {
    const nextReviewDue = new Date(now);
    nextReviewDue.setFullYear(nextReviewDue.getFullYear() + 1);

    const hasGovernmentId = verification.documents.some((d) => d.type === "GOVERNMENT_ID");
    const hasEmploymentProof = verification.documents.some((d) => d.type === "EMPLOYMENT_PROOF");

    const mp = verification.mentorProfile;
    const hasM2Profile =
      mp.fromRole != null &&
      mp.toRole != null &&
      mp.keyFactor1 != null &&
      mp.statementTransitionMade != null &&
      (mp.m2FocusAreas?.length ?? 0) > 0 &&
      (mp.availabilityWindows?.length ?? 0) > 0;

    await prisma.$transaction([
      prisma.mentorVerification.update({
        where: { id: mentorVerificationId },
        data: {
          status: "VERIFIED",
          reviewedAt: now,
          reviewedBy: session.user.id,
          verifiedAt: now,
          nextReviewDue,
          idVerified: hasGovernmentId,
          employmentVerified: hasEmploymentProof || !!verification.linkedInUrl,
          linkedInChecked: !!verification.linkedInUrl,
        },
      }),
      prisma.mentorProfile.update({
        where: { id: verification.mentorProfileId },
        data: {
          verificationStatus: "VERIFIED",
          isDiscoverable: true,
          isPublic: hasM2Profile,
        },
      }),
      ...verification.documents.map((d) =>
        prisma.verificationDocument.update({
          where: { id: d.id },
          data: {
            reviewedAt: now,
            accepted: true,
            rejectionReason: null,
          },
        })
      ),
    ]);

    await createNotification({
      userId: mentorUserId,
      type: NotificationType.MENTOR_VERIFICATION_APPROVED,
      title: "Your mentor profile has been verified",
      body: hasM2Profile
        ? "Your identity has been verified. Your mentor profile is now live in our matching system."
        : "You are now visible in mentor discovery.",
      linkUrl: "/dashboard/mentor",
    });

    if (mp.user?.email) {
      try {
        const { sendMentorApprovedEmail } = await import("@/lib/email/mentor");
        await sendMentorApprovedEmail(mp.user.email, hasM2Profile);
      } catch {
        // Resend not configured or failed
      }
    }
    const { queueMatchRefreshAll } = await import("@/lib/mentorship/refresh-matches");
    queueMatchRefreshAll().catch(() => {});
  } else if (decision === "REJECTED") {
    await prisma.$transaction([
      prisma.mentorVerification.update({
        where: { id: mentorVerificationId },
        data: { status: "UNVERIFIED" },
      }),
      prisma.mentorProfile.update({
        where: { id: verification.mentorProfileId },
        data: {
          verificationStatus: "UNVERIFIED",
          isDiscoverable: false,
        },
      }),
    ]);

    await createNotification({
      userId: mentorUserId,
      type: NotificationType.MENTOR_VERIFICATION_REJECTED,
      title: "Mentor verification update",
      body: note || humanReason,
      linkUrl: "/mentorship/verify",
    });
    if (verification.mentorProfile.user?.email) {
      try {
        const { sendMentorRejectedEmail } = await import("@/lib/email/mentor");
        await sendMentorRejectedEmail(verification.mentorProfile.user.email, note ?? humanReason);
      } catch {
        // ignore
      }
    }
  } else {
    // MORE_INFO_REQUESTED
    await createNotification({
      userId: mentorUserId,
      type: NotificationType.MENTOR_VERIFICATION_MORE_INFO,
      title: "More information needed for verification",
      body: note || humanReason,
      linkUrl: "/mentorship/verify",
    });
    if (verification.mentorProfile.user?.email) {
      try {
        const { sendMentorMoreInfoEmail } = await import("@/lib/email/mentor");
        await sendMentorMoreInfoEmail(verification.mentorProfile.user.email, note ?? humanReason);
      } catch {
        // ignore
      }
    }
  }

  return NextResponse.json({ success: true, decision });
}
