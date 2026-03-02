import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getActiveDocument, hasSignedDocument } from "@/lib/mentorship/legal/signatures";
import { formatContentWithEffectiveDate } from "@/lib/mentorship/legal/documents";
import type { LegalDocumentType } from "@prisma/client";

const VALID_TYPES: LegalDocumentType[] = [
  "MENTORSHIP_MARKETPLACE_ADDENDUM",
  "MENTOR_CONDUCT_AGREEMENT",
];

export async function GET(
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

  const signed = await hasSignedDocument(session.user.id, doc.type);

  const content = formatContentWithEffectiveDate(doc.content, doc.effectiveAt);

  let maskedEmail: string | null = null;
  if (!signed) {
    const { prisma } = await import("@/lib/prisma/client");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (user?.email) {
      const [local, domain] = user.email.split("@");
      maskedEmail = domain ? `${local?.slice(0, 2) ?? ""}***@${domain}` : "***";
    }
  }

  return NextResponse.json({
    id: doc.id,
    type: doc.type,
    version: doc.version,
    title: doc.title,
    content,
    effectiveAt: doc.effectiveAt.toISOString(),
    signed,
    maskedEmail,
  });
}
