import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";
import { trackOutcome } from "@/lib/tracking/outcomes";

const goalBodySchema = z.object({
  primaryGoal: z.string().min(1).max(200),
  subGoals: z.array(z.string().min(1).max(300)).min(2).max(4),
  successMetrics: z.array(z.string().min(1).max(200)).min(2),
  mentorCommitments: z.array(z.string().min(1).max(300)).min(2),
  menteeCommitments: z.array(z.string().min(1).max(300)).min(2),
  timelineNotes: z.string().max(500).optional(),
});

/**
 * POST /api/mentorship/documents/[id]/goal — id = contractId
 * Mentor only. Creates Goal Document after session 1 is complete.
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

  let body: z.infer<typeof goalBodySchema>;
  try {
    body = goalBodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e }, { status: 400 });
  }

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: { sessions: true, documents: true, mentee: { select: { email: true, name: true } } },
  });

  if (!contract || contract.mentorUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session1 = contract.sessions.find((s) => s.sessionNumber === 1);
  if (!session1 || session1.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Session 1 must be completed before creating the goal document" },
      { status: 400 }
    );
  }

  const existing = contract.documents.find((d) => d.type === "GOAL_DOCUMENT");
  if (existing) {
    return NextResponse.json({ error: "Goal document already exists" }, { status: 400 });
  }

  const content = {
    version: 1,
    primaryGoal: body.primaryGoal,
    subGoals: body.subGoals,
    successMetrics: body.successMetrics,
    mentorCommitments: body.mentorCommitments,
    menteeCommitments: body.menteeCommitments,
    timelineNotes: body.timelineNotes ?? null,
    createdAt: new Date().toISOString(),
  };

  const doc = await prisma.engagementDocument.create({
    data: {
      contractId,
      type: "GOAL_DOCUMENT",
      content: content as object,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendGoalDocumentCreated } = await import(
    "@/lib/email/templates/mentorship/engagement-goal-document-created"
  );
  await sendGoalDocumentCreated({
    to: contract.mentee.email,
    menteeName: contract.mentee.name ?? "Mentee",
    documentUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
  });

  await trackOutcome(contract.mentorUserId, "M8_GOAL_DOCUMENT_CREATED", {
    entityId: contractId,
    entityType: "MentorshipContract",
    metadata: { contractId, documentId: doc.id },
  });

  return NextResponse.json({ success: true, documentId: doc.id });
}
