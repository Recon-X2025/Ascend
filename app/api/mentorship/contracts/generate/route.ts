import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { createContract } from "@/lib/mentorship/contract";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

/**
 * Internal only — called server-side when mentor accepts application.
 * Not called directly by client; triggered from POST .../applications/[id]/respond with action ACCEPT.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { applicationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const applicationId = body.applicationId;
  if (!applicationId) {
    return NextResponse.json({ success: false, error: "applicationId required" }, { status: 400 });
  }

  const application = await prisma.mentorApplication.findUnique({
    where: { id: applicationId },
    include: { mentorProfile: { select: { userId: true } } },
  });
  if (!application) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (application.mentorProfile.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  if (application.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: "Application must be ACCEPTED to generate contract" },
      { status: 400 }
    );
  }

  try {
    const contract = await createContract(applicationId);
    try {
      const { actorIp, actorAgent } = getRequestContext(req);
      await logAudit({
        actorId: session.user.id,
        actorRole: (session.user as { role?: string }).role,
        actorIp: actorIp ?? undefined,
        actorAgent: actorAgent ?? undefined,
        category: "MENTORSHIP",
        action: AUDIT_ACTIONS.CONTRACT_GENERATED,
        severity: "CRITICAL",
        targetType: "MentorshipContract",
        targetId: contract.id,
        metadata: { applicationId, contractId: contract.id },
      });
    } catch {
      // non-blocking
    }
    return NextResponse.json({
      id: contract.id,
      status: contract.status,
      mentorSignDeadline: contract.mentorSignDeadline?.toISOString() ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create contract";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
