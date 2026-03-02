import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getActiveDocument, hasSignedDocument } from "@/lib/mentorship/legal/signatures";
import { requestLegalOTP } from "@/lib/mentorship/legal/otp";
import { logMentorshipAction } from "@/lib/mentorship/audit";
import type { LegalDocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

const VALID_TYPES: LegalDocumentType[] = [
  "MENTORSHIP_MARKETPLACE_ADDENDUM",
  "MENTOR_CONDUCT_AGREEMENT",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  if (!VALID_TYPES.includes(type as LegalDocumentType)) {
    return NextResponse.json({ success: false, error: "Invalid document type" }, { status: 400 });
  }

  const doc = await getActiveDocument(type as LegalDocumentType);
  if (!doc) {
    return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
  }

  const alreadySigned = await hasSignedDocument(session.user.id, doc.type);
  if (alreadySigned) {
    return NextResponse.json({ success: false, error: "Already signed" }, { status: 400 });
  }

  const otp = await requestLegalOTP(doc.id, session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  const email = user?.email;
  if (email) {
    const { sendLegalSignOTP } = await import(
      "@/lib/email/templates/mentorship/legal-sign-otp"
    );
    await sendLegalSignOTP({ to: email, otp, documentTitle: doc.title });
  }

  await logMentorshipAction({
    actorId: session.user.id,
    action: "LEGAL_OTP_REQUESTED",
    category: "CONTRACT",
    entityType: "LegalDocument",
    entityId: doc.id,
    newState: { type: doc.type, version: doc.version },
  });

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  await trackOutcome(session.user.id, "M15_LEGAL_OTP_REQUESTED", {
    entityId: doc.id,
    entityType: "LegalDocument",
    metadata: { documentType: doc.type },
  });

  return NextResponse.json({ success: true });
}
