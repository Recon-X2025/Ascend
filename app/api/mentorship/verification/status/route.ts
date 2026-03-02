import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getMentorProfileOrThrow } from "@/lib/mentorship/verification-helpers";
import { VERIFICATION_REASON_CODES } from "@/lib/mentorship/verification-codes";

export async function GET() {
  let profile;
  try {
    profile = await getMentorProfileOrThrow();
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
    where: { mentorProfileId: profile.id },
    include: {
      documents: {
        select: {
          id: true,
          type: true,
          fileName: true,
          uploadedAt: true,
          accepted: true,
        },
      },
      auditLog: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!verification) {
    return NextResponse.json({
      status: "UNVERIFIED",
      submittedAt: null,
      documents: [],
      linkedInUrl: null,
      nextReviewDue: null,
      verifiedAt: null,
      lastDecision: null,
    });
  }

  const auditLog = verification.auditLog.map((e) => ({
    decision: e.decision,
    reasonCode:
      VERIFICATION_REASON_CODES[e.reasonCode as keyof typeof VERIFICATION_REASON_CODES] ?? e.reasonCode,
    note: e.note,
    createdAt: e.createdAt,
  }));
  const lastDecision = auditLog[0] ?? null;

  return NextResponse.json({
    status: verification.status,
    submittedAt: verification.submittedAt,
    documents: verification.documents.map((d) => ({
      id: d.id,
      type: d.type,
      fileName: d.fileName,
      uploadedAt: d.uploadedAt,
      accepted: d.accepted,
    })),
    linkedInUrl: verification.linkedInUrl,
    nextReviewDue: verification.nextReviewDue,
    verifiedAt: verification.verifiedAt,
    lastDecision,
    auditLog,
  });
}
