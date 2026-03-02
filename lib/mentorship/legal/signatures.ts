/**
 * M-15: Legal document signatures — check, get active doc, record, marketplace access.
 */

import { prisma } from "@/lib/prisma/client";
import type { LegalDocumentType } from "@prisma/client";

export type { LegalDocumentType };

/**
 * Check if user has signed the currently active version of a document type.
 */
export async function hasSignedDocument(
  userId: string,
  type: LegalDocumentType
): Promise<boolean> {
  const active = await prisma.legalDocument.findFirst({
    where: { type, isActive: true },
    select: { id: true },
  });
  if (!active) return false;
  const sig = await prisma.legalDocumentSignature.findUnique({
    where: { documentId_userId: { documentId: active.id, userId } },
  });
  return !!sig;
}

/**
 * Get the currently active document of a given type.
 */
export async function getActiveDocument(type: LegalDocumentType) {
  return prisma.legalDocument.findFirst({
    where: { type, isActive: true },
  });
}

/**
 * Record a signature (called after OTP verification). Signatures are immutable.
 */
export async function recordSignature(params: {
  userId: string;
  documentId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.legalDocumentSignature.create({
    data: {
      userId: params.userId,
      documentId: params.documentId,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      method: "OTP_EMAIL",
    },
  });
}

/**
 * Check all required signatures for marketplace access.
 * Mentors need both MENTORSHIP_MARKETPLACE_ADDENDUM and MENTOR_CONDUCT_AGREEMENT.
 * Mentees need only MENTORSHIP_MARKETPLACE_ADDENDUM.
 */
export async function checkMarketplaceAccess(
  userId: string,
  role: "MENTOR" | "MENTEE"
): Promise<{ hasAccess: boolean; missing: LegalDocumentType[] }> {
  const addendumSigned = await hasSignedDocument(userId, "MENTORSHIP_MARKETPLACE_ADDENDUM");
  const conductSigned = await hasSignedDocument(userId, "MENTOR_CONDUCT_AGREEMENT");

  const missing: LegalDocumentType[] = [];
  if (!addendumSigned) missing.push("MENTORSHIP_MARKETPLACE_ADDENDUM");
  if (role === "MENTOR" && !conductSigned) missing.push("MENTOR_CONDUCT_AGREEMENT");

  return {
    hasAccess: missing.length === 0,
    missing,
  };
}
