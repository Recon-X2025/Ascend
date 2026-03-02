import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const bodySchema = z.object({
  body: z.string().min(1).max(10000),
  jobPostId: z.number().int().optional(),
  companyId: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { body, jobPostId, companyId } = parsed.data;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (
    conversation.participantA !== session.user.id &&
    conversation.participantB !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cleanBody = body.replace(/<[^>]*>/g, "").trim();
  if (!cleanBody) {
    return NextResponse.json({ error: "Message body required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.user.id,
      body: cleanBody,
      jobPostId: jobPostId ?? null,
      companyId: companyId ?? null,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      jobPost: { select: { id: true, slug: true, title: true } },
      company: { select: { id: true, slug: true, name: true } },
    },
  });

  // M-7: Fire-and-forget scan for off-platform solicitation (mentorship contracts only)
  const contract = await prisma.mentorshipContract.findFirst({
    where: {
      status: "ACTIVE",
      OR: [
        { mentorUserId: conversation.participantA, menteeUserId: conversation.participantB },
        { mentorUserId: conversation.participantB, menteeUserId: conversation.participantA },
      ],
    },
    select: { id: true },
  });
  if (contract) {
    import("@/lib/sessions/monitor")
      .then(({ scanMessage }) =>
        scanMessage(contract.id, session.user.id, message.id, cleanBody)
      )
      .catch(() => {});
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({ success: true, data: message }, { status: 201 });
}
