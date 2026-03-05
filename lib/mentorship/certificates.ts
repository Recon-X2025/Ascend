/**
 * BL-14: Verified Career Certificates.
 * Trigger: Contract completed + outcome verified.
 */

import { prisma } from "@/lib/prisma/client";
import { randomBytes } from "crypto";

function genCode(): string {
  return randomBytes(12).toString("hex").toUpperCase();
}

export interface CertificateVerification {
  valid: boolean;
  menteeName?: string | null;
  mentorName?: string | null;
  transitionType?: string;
  claimedOutcome?: string;
  issuedAt?: Date;
}

export async function verifyCertificate(code: string): Promise<CertificateVerification> {
  const cert = await prisma.mentorCertificate.findUnique({
    where: { verificationCode: code.toUpperCase().trim() },
    include: {
      mentee: { select: { name: true } },
      outcome: { include: { mentor: { select: { name: true } } } },
    },
  });
  if (!cert) return { valid: false };
  return {
    valid: true,
    menteeName: cert.mentee.name,
    mentorName: cert.outcome.mentor.name,
    transitionType: cert.outcome.transitionType,
    claimedOutcome: cert.outcome.claimedOutcome,
    issuedAt: cert.issuedAt,
  };
}

export async function issueCertificateForOutcome(outcomeId: string): Promise<{ ok: boolean; code?: string; error?: string }> {
  const outcome = await prisma.mentorshipOutcome.findUnique({
    where: { id: outcomeId },
    include: { contract: true },
  });
  if (!outcome || outcome.status !== "VERIFIED") return { ok: false, error: "Outcome not verified" };
  if (outcome.contract.status !== "COMPLETED") return { ok: false, error: "Contract not completed" };
  const existing = await prisma.mentorCertificate.findUnique({ where: { outcomeId } });
  if (existing) return { ok: true, code: existing.verificationCode };
  let code = genCode();
  let attempts = 0;
  while (attempts < 5) {
    const collision = await prisma.mentorCertificate.findUnique({ where: { verificationCode: code } });
    if (!collision) break;
    code = genCode();
    attempts++;
  }
  await prisma.mentorCertificate.create({
    data: {
      contractId: outcome.contractId,
      outcomeId: outcome.id,
      menteeId: outcome.menteeId,
      verificationCode: code,
    },
  });
  return { ok: true, code };
}
