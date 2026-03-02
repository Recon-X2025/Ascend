import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { trackOutcome } from "@/lib/tracking/outcomes";

const bodySchema = z.object({ action: z.literal("sign") });

/**
 * POST /api/mentorship/documents/[id]/sign — id = documentId
 * Mentor or mentee signs a document (Goal or Outcome). No OTP — simple confirm.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const documentId = (await params).id;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid body", details: e }, { status: 400 });
  }

  if (body.action !== "sign") {
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  }

  const document = await prisma.engagementDocument.findUnique({
    where: { id: documentId },
    include: {
      contract: {
        include: {
          mentor: { select: { id: true, email: true, name: true } },
          mentee: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
  }

  const isMentor = document.contract.mentorUserId === session.user.id;
  const isMentee = document.contract.menteeUserId === session.user.id;
  if (!isMentor && !isMentee) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  if (isMentor) {
    if (document.mentorSigned) {
      return NextResponse.json({ success: false, error: "Already signed" }, { status: 400 });
    }
    await prisma.engagementDocument.update({
      where: { id: documentId },
      data: { mentorSigned: true, mentorSignedAt: now },
    });
  } else {
    if (document.menteeSigned) {
      return NextResponse.json({ success: false, error: "Already signed" }, { status: 400 });
    }
    await prisma.engagementDocument.update({
      where: { id: documentId },
      data: { menteeSigned: true, menteeSignedAt: now },
    });
  }

  const updated = await prisma.engagementDocument.findUniqueOrThrow({
    where: { id: documentId },
  });

  await trackOutcome(session.user.id, "M8_DOCUMENT_SIGNED", {
    entityId: document.contractId,
    entityType: "MentorshipContract",
    metadata: {
      contractId: document.contractId,
      documentId,
      documentType: document.type,
      signedBy: isMentor ? "MENTOR" : "MENTEE",
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const contractId = document.contractId;

  if (updated.mentorSigned && updated.menteeSigned) {
    const { sendGoalDocumentFinal } = await import(
      "@/lib/email/templates/mentorship/engagement-goal-document-final"
    );
    const { sendOutcomeDocumentFinal } = await import(
      "@/lib/email/templates/mentorship/engagement-outcome-document-final"
    );
    if (document.type === "GOAL_DOCUMENT") {
      await sendGoalDocumentFinal({
        mentorEmail: document.contract.mentor.email,
        menteeEmail: document.contract.mentee.email,
        mentorName: document.contract.mentor.name ?? "Mentor",
        menteeName: document.contract.mentee.name ?? "Mentee",
        engagementUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
      });
    } else {
      await sendOutcomeDocumentFinal({
        mentorEmail: document.contract.mentor.email,
        menteeEmail: document.contract.mentee.email,
        mentorName: document.contract.mentor.name ?? "Mentor",
        menteeName: document.contract.mentee.name ?? "Mentee",
        engagementUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
      });
    }
  } else {
    const { sendDocumentSigned } = await import(
      "@/lib/email/templates/mentorship/engagement-document-signed"
    );
    const otherEmail = isMentor ? document.contract.mentee.email : document.contract.mentor.email;
    const otherName = isMentor
      ? document.contract.mentee.name ?? "Mentee"
      : document.contract.mentor.name ?? "Mentor";
    await sendDocumentSigned({
      to: otherEmail,
      recipientName: otherName,
      documentType: document.type,
      signedBy: isMentor ? "mentor" : "mentee",
      engagementUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
    });
  }

  return NextResponse.json({ success: true });
}
