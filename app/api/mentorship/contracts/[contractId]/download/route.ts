import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import {
  verifyContractIntegrity,
  getContractDownloadKey,
  getContractSignedDownloadUrl,
} from "@/lib/mentorship/contract";
import { track } from "@/lib/analytics/track";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 min

export async function GET(
  req: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { actorIp, actorAgent } = getRequestContext(req);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await params;

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
  });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (contract.mentorUserId !== session.user.id && contract.menteeUserId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (contract.status !== "ACTIVE" && contract.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Contract not available for download" },
      { status: 400 }
    );
  }

  const { flagged } = await verifyContractIntegrity(contractId);
  if (flagged) {
    return NextResponse.json(
      { code: "CONTRACT_FLAGGED" },
      { status: 403 }
    );
  }

  const key = getContractDownloadKey(contract);
  if (!key) {
    return NextResponse.json(
      { error: "PDF not yet generated" },
      { status: 404 }
    );
  }

  const url = await getContractSignedDownloadUrl(key, SIGNED_URL_EXPIRY_SECONDS);
  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000).toISOString();

  await track("contract_downloaded", {
    contractId,
    userId: session.user.id,
  });
  try {
    await logAudit({
      actorId: session.user.id,
      actorRole: (session.user as { role?: string }).role ?? undefined,
      actorIp: actorIp ?? undefined,
      actorAgent: actorAgent ?? undefined,
      category: "DATA_ACCESS",
      action: AUDIT_ACTIONS.CONTRACT_PDF_DOWNLOADED,
      severity: "CRITICAL",
      targetType: "MentorshipContract",
      targetId: contractId,
      metadata: { contractId },
    });
  } catch {
    // non-blocking
  }

  return NextResponse.json({ url, expiresAt });
}
