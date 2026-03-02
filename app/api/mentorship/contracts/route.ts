import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

/** List contracts for the current user (as mentor or mentee). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contracts = await prisma.mentorshipContract.findMany({
    where: {
      OR: [
        { mentorUserId: session.user.id },
        { menteeUserId: session.user.id },
      ],
    },
    select: {
      id: true,
      status: true,
      mentorUserId: true,
      menteeUserId: true,
      mentorSignDeadline: true,
      menteeSignDeadline: true,
      contractContent: true,
      mentor: { select: { name: true } },
      mentee: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const list = contracts.map((c) => {
    const content = c.contractContent as { engagementScope?: { engagementType?: string } } | null;
    const engagementType = content?.engagementScope?.engagementType ?? "—";
    const isMentor = c.mentorUserId === session.user!.id;
    const otherParty = isMentor ? c.mentee?.name : c.mentor?.name;
    const firstName = otherParty?.split(" ")[0] ?? "Mentee";
    return {
      id: c.id,
      status: c.status,
      mentorSignDeadline: c.mentorSignDeadline?.toISOString() ?? null,
      menteeSignDeadline: c.menteeSignDeadline?.toISOString() ?? null,
      otherPartyFirstName: firstName,
      engagementType,
    };
  });

  return NextResponse.json({ contracts: list });
}
