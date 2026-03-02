import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { verifyOTPAndSign } from "@/lib/mentorship/contract";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { isIpBlocked } from "@/lib/blocklist";
import { z } from "zod";

const BodySchema = z.object({ otp: z.string().length(6) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { actorIp } = getRequestContext(req);
  if (actorIp && (await isIpBlocked(actorIp))) {
    return NextResponse.json(
      { code: "IP_BLOCKED", message: "Access denied" },
      { status: 403 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await params;

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
  });
  if (!contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (contract.mentorUserId !== session.user.id && contract.menteeUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "otp must be 6 digits", code: "INVALID_OTP" },
      { status: 400 }
    );
  }

  const { actorAgent } = getRequestContext(req);
  const ipAddress = actorIp ?? req.headers.get("x-real-ip") ?? "unknown";
  const userAgent = actorAgent ?? req.headers.get("user-agent") ?? "";

  try {
    const updated = await verifyOTPAndSign(
      session.user.id,
      contractId,
      parsed.data.otp,
      ipAddress,
      userAgent
    );
    if (updated.status === "ACTIVE") {
      try {
        await logAudit({
          actorId: session.user.id,
          actorRole: (session.user as { role?: string }).role,
          actorIp: actorIp ?? undefined,
          actorAgent: actorAgent ?? undefined,
          category: "MENTORSHIP",
          action: AUDIT_ACTIONS.CONTRACT_SIGNED,
          severity: "CRITICAL",
          targetType: "MentorshipContract",
          targetId: contractId,
          metadata: { contractId },
        });
      } catch {
        // non-blocking
      }
      return NextResponse.json({
        status: "ACTIVE",
        message: "Contract signed. Your engagement begins now.",
      });
    }
    return NextResponse.json({
      status: updated.status,
      mentorSignDeadline: updated.mentorSignDeadline?.toISOString() ?? null,
      menteeSignDeadline: updated.menteeSignDeadline?.toISOString() ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "INVALID_OTP") {
      return NextResponse.json({ code: "INVALID_OTP" }, { status: 400 });
    }
    if (message === "OTP_EXPIRED") {
      return NextResponse.json({ code: "OTP_EXPIRED" }, { status: 400 });
    }
    return NextResponse.json({ error: message || "Sign failed" }, { status: 400 });
  }
}
