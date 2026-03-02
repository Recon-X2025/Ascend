/**
 * M-7: Get signed URL for session record, optionally verify integrity.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getSignedDownloadUrlWithExpiry } from "@/lib/storage";
import { verifySessionRecordIntegrity } from "@/lib/sessions/record";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(
  req: Request,
  { params }: Params
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const url = new URL(req.url);
  const verifyIntegrity = url.searchParams.get("verify") === "true";

  const eng = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { contract: true, sessionRecord: true },
  });
  if (!eng) return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });

  const isMentor = eng.contract.mentorUserId === session.user.id;
  const isMentee = eng.contract.menteeUserId === session.user.id;
  if (!isMentor && !isMentee) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (!eng.sessionRecord) {
    return NextResponse.json({ success: false, error: "Session record not yet available" }, { status: 404 });
  }

  if (verifyIntegrity) {
    const ok = await verifySessionRecordIntegrity(sessionId);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Integrity verification failed" }, { status: 500 });
    }
  }

  // 7 min TTL for API access (604800 = 7 days for email links)
  const signedUrl = await getSignedDownloadUrlWithExpiry(
    eng.sessionRecord.s3Key,
    420
  );
  return NextResponse.json({
    downloadUrl: signedUrl,
    sha256Hash: eng.sessionRecord.sha256Hash,
  });
}
