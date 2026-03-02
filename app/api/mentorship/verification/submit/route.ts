import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getMentorProfileOrThrow } from "@/lib/mentorship/verification-helpers";
import { createNotification } from "@/lib/notifications/create";
import { NotificationType } from "@prisma/client";

export async function POST() {
  let mentorProfileId: string;
  try {
    const profile = await getMentorProfileOrThrow();
    mentorProfileId = profile.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Mentor profile required" },
      { status: 403 }
    );
  }

  const verification = await prisma.mentorVerification.findUnique({
    where: { mentorProfileId },
    include: {
      documents: true,
    },
  });

  if (!verification) {
    return NextResponse.json(
      { error: "No verification record. Upload at least one document first." },
      { status: 400 }
    );
  }

  if (
    verification.status !== "UNVERIFIED" &&
    verification.status !== "REVERIFICATION_REQUIRED"
  ) {
    return NextResponse.json(
      { error: "Submission only allowed when status is UNVERIFIED or REVERIFICATION_REQUIRED" },
      { status: 400 }
    );
  }

  const hasGovernmentId = verification.documents.some(
    (d) => d.type === "GOVERNMENT_ID"
  );
  if (!hasGovernmentId) {
    return NextResponse.json(
      { error: "At least one Government ID document is required" },
      { status: 400 }
    );
  }

  const hasEmploymentProof = verification.documents.some(
    (d) => d.type === "EMPLOYMENT_PROOF"
  );
  const hasLinkedIn = !!verification.linkedInUrl?.trim();
  if (!hasEmploymentProof && !hasLinkedIn) {
    return NextResponse.json(
      {
        error:
          "At least one Employment Proof document or a LinkedIn Profile URL is required",
      },
      { status: 400 }
    );
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.mentorVerification.update({
      where: { mentorProfileId },
      data: {
        status: "PENDING",
        submittedAt: now,
      },
    }),
    prisma.mentorProfile.update({
      where: { id: mentorProfileId },
      data: { verificationStatus: "PENDING" },
    }),
  ]);

  const admins = await prisma.user.findMany({
    where: { role: "PLATFORM_ADMIN" },
    select: { id: true },
  });
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: NotificationType.MENTOR_VERIFICATION_SUBMITTED,
      title: "New mentor verification submitted",
      body: "A mentor has submitted documents for verification. Review in the admin queue.",
      linkUrl: "/dashboard/admin/mentorship/verification",
    });
  }

  return NextResponse.json({
    status: "PENDING",
    message: "Submitted. Review within 48 hours.",
  });
}
