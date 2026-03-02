import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getActiveDocument, hasSignedDocument, recordSignature } from "@/lib/mentorship/legal/signatures";
import { verifyLegalOTP } from "@/lib/mentorship/legal/otp";
import { logMentorshipAction } from "@/lib/mentorship/audit";
import { z } from "zod";
import type { LegalDocumentType } from "@prisma/client";

const VALID_TYPES: LegalDocumentType[] = [
  "MENTORSHIP_MARKETPLACE_ADDENDUM",
  "MENTOR_CONDUCT_AGREEMENT",
];

const signSchema = z.object({ otp: z.string().length(6) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  if (!VALID_TYPES.includes(type as LegalDocumentType)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }

  const doc = await getActiveDocument(type as LegalDocumentType);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const alreadySigned = await hasSignedDocument(session.user.id, doc.type);
  if (alreadySigned) {
    return NextResponse.json({ error: "Already signed" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const valid = await verifyLegalOTP(doc.id, session.user.id, parsed.data.otp);
  if (!valid) {
    return NextResponse.json({ error: "INVALID_OTP" }, { status: 400 });
  }

  const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const signature = await recordSignature({
    userId: session.user.id,
    documentId: doc.id,
    ipAddress: ipAddress ?? undefined,
    userAgent,
  });

  await logMentorshipAction({
    actorId: session.user.id,
    action: "LEGAL_DOCUMENT_SIGNED",
    category: "CONTRACT",
    entityType: "LegalDocumentSignature",
    entityId: signature.id,
    newState: { documentId: doc.id, type: doc.type, version: doc.version },
    actorIp: ipAddress ?? undefined,
  });

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  await trackOutcome(session.user.id, "M15_DOCUMENT_SIGNED", {
    entityId: signature.id,
    entityType: "LegalDocumentSignature",
    metadata: {
      documentType: doc.type,
      documentVersion: doc.version,
      signedAt: signature.signedAt.toISOString(),
    },
  });

  try {
    const { prisma } = await import("@/lib/prisma/client");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });
    if (user?.email) {
      const { sendLegalDocumentSigned } = await import(
        "@/lib/email/templates/mentorship/legal-document-signed"
      );
      await sendLegalDocumentSigned({
        to: user.email,
        userName: user.name ?? "User",
        documentTitle: doc.title,
        documentVersion: doc.version,
      });
    }
  } catch {
    // ignore email failure
  }

  return NextResponse.json({
    success: true,
    signedAt: signature.signedAt.toISOString(),
  });
}
