import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { trackOutcome } from "@/lib/tracking/outcomes";

const outcomeBodySchema = z.object({
  outcomeAchieved: z.boolean(),
  originalGoal: z.string().min(1),
  actualOutcome: z.string().min(1),
  mentorReflection: z.string().min(1),
  recommendMentee: z.boolean(),
  testimonialConsent: z.boolean(),
});

/**
 * POST /api/mentorship/documents/[id]/outcome — id = contractId
 * Mentor only. Creates Outcome Document.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contractId = (await params).id;

  let body: z.infer<typeof outcomeBodySchema>;
  try {
    body = outcomeBodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e }, { status: 400 });
  }

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      documents: true,
      mentee: { select: { email: true, name: true } },
    },
  });

  if (!contract || contract.mentorUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = contract.documents.find((d) => d.type === "OUTCOME_DOCUMENT");
  if (existing) {
    return NextResponse.json({ error: "Outcome document already exists" }, { status: 400 });
  }

  const content = {
    version: 1,
    outcomeAchieved: body.outcomeAchieved,
    originalGoal: body.originalGoal,
    actualOutcome: body.actualOutcome,
    mentorReflection: body.mentorReflection,
    menteeReflection: null as string | null,
    recommendMentee: body.recommendMentee,
    testimonialConsent: body.testimonialConsent,
    createdAt: new Date().toISOString(),
  };

  const doc = await prisma.engagementDocument.create({
    data: {
      contractId,
      type: "OUTCOME_DOCUMENT",
      content: content as object,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendOutcomeDocumentCreated } = await import(
    "@/lib/email/templates/mentorship/engagement-outcome-document-created"
  );
  await sendOutcomeDocumentCreated({
    to: contract.mentee.email,
    menteeName: contract.mentee.name ?? "Mentee",
    documentUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
  });

  await trackOutcome(contract.mentorUserId, "M8_OUTCOME_DOCUMENT_CREATED", {
    entityId: contractId,
    entityType: "MentorshipContract",
    metadata: { contractId, documentId: doc.id },
  });

  return NextResponse.json({ success: true, documentId: doc.id });
}
