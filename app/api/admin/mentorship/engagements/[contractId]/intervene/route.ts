import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { logMentorshipAction } from "@/lib/mentorship/audit";
import { z } from "zod";

const interveneSchema = z.object({
  action: z.enum(["WARN_MENTOR", "WARN_MENTEE", "PAUSE_ENGAGEMENT", "TERMINATE_BY_MENTOR", "TERMINATE_BY_MENTEE"]),
  reason: z.string().min(20, "Reason must be at least 20 characters"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { contractId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = interveneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      mentor: { select: { id: true, name: true, email: true } },
      mentee: { select: { id: true, name: true, email: true } },
    },
  });
  if (!contract) return NextResponse.json({ success: false, error: "Contract not found" }, { status: 404 });
  if (contract.status !== "ACTIVE" && contract.status !== "PAUSED") {
    return NextResponse.json(
      { error: "Intervention only allowed on ACTIVE or PAUSED contracts" },
      { status: 400 }
    );
  }

  const { action, reason } = parsed.data;
  const actorIp = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;

  await logMentorshipAction({
    actorId: session.user.id,
    action: "ENGAGEMENT_INTERVENED",
    category: "INTERVENTION",
    entityType: "MentorshipContract",
    entityId: contractId,
    newState: { action, reason: reason.slice(0, 200) },
    reason,
    actorIp,
  });

  if (action === "TERMINATE_BY_MENTOR" || action === "TERMINATE_BY_MENTEE") {
    const status = action === "TERMINATE_BY_MENTOR" ? "TERMINATED_BY_MENTOR" : "TERMINATED_BY_MENTEE";
    await prisma.mentorshipContract.update({
      where: { id: contractId },
      data: { status, terminatedAt: new Date(), terminatedBy: session.user.id },
    });
    try {
      const { terminateEscrow } = await import("@/lib/escrow");
      await terminateEscrow(contractId, action === "TERMINATE_BY_MENTOR" ? "MENTOR" : "MENTEE");
    } catch (e) {
      console.error("[intervene] terminateEscrow failed:", e);
    }
  } else if (action === "PAUSE_ENGAGEMENT") {
    await prisma.mentorshipContract.update({
      where: { id: contractId },
      data: { status: "PAUSED" },
    });
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    try {
      const { sendEngagementPaused } = await import(
        "@/lib/email/templates/mentorship/engagement-paused"
      );
      await sendEngagementPaused({
        mentorEmail: contract.mentor.email,
        menteeEmail: contract.mentee.email,
        mentorName: contract.mentor.name ?? "Mentor",
        menteeName: contract.mentee.name ?? "Mentee",
        reason,
        engagementUrl: `${baseUrl}/mentorship/engagements/${contractId}`,
      });
    } catch (e) {
      console.error("[intervene] engagement-paused email failed:", e);
    }
  } else if (action === "WARN_MENTOR") {
    try {
      const { sendMentorWarning } = await import("@/lib/email/templates/mentorship/mentor-warning");
      await sendMentorWarning({
        to: contract.mentor.email,
        mentorName: contract.mentor.name ?? "Mentor",
        reason,
        engagementUrl: `${process.env.NEXTAUTH_URL ?? ""}/mentorship/engagements/${contractId}`,
      });
    } catch (e) {
      console.error("[intervene] mentor-warning email failed:", e);
    }
  } else if (action === "WARN_MENTEE") {
    try {
      const { sendMenteeWarning } = await import("@/lib/email/templates/mentorship/mentee-warning");
      await sendMenteeWarning({
        to: contract.mentee.email,
        menteeName: contract.mentee.name ?? "Mentee",
        reason,
        engagementUrl: `${process.env.NEXTAUTH_URL ?? ""}/mentorship/engagements/${contractId}`,
      });
    } catch (e) {
      console.error("[intervene] mentee-warning email failed:", e);
    }
  }

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  await trackOutcome(session.user.id, "M16_ENGAGEMENT_INTERVENED", {
    entityId: contractId,
    entityType: "MentorshipContract",
    metadata: { action, contractId, adminId: session.user.id },
  });

  return NextResponse.json({ success: true, action });
}
