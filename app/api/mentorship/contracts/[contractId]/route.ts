import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { verifyContractIntegrity } from "@/lib/mentorship/contract";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await params;

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      signatures: {
        select: {
          signerRole: true,
          signer: { select: { name: true } },
          otpVerifiedAt: true,
          ipAddress: true,
          declaration: true,
        },
      },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (contract.mentorUserId !== session.user.id && contract.menteeUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (contract.status === "ACTIVE" || contract.status === "COMPLETED") {
    const { flagged } = await verifyContractIntegrity(contractId);
    if (flagged) {
      return NextResponse.json({
        ...toPublicContract(contract),
        flagged: true,
      });
    }
  }

  const out = toPublicContract(contract);
  return NextResponse.json(out);
}

function toPublicContract(
  contract: {
    id: string;
    status: string;
    contractContent: unknown;
    tcVersion: string;
    pdfUrl: string | null;
    pdfHash?: string | null;
    pdfGeneratedAt: Date | null;
    mentorSignDeadline: Date | null;
    menteeSignDeadline: Date | null;
    generatedAt: Date;
    activatedAt: Date | null;
    voidedAt: Date | null;
    signatures: Array<{
      signerRole: string;
      signer: { name: string | null };
      otpVerifiedAt: Date;
      ipAddress: string;
      declaration: string;
    }>;
  }
) {
  return {
    id: contract.id,
    status: contract.status,
    contractContent: contract.contractContent,
    tcVersion: contract.tcVersion,
    pdfUrl: contract.pdfUrl,
    pdfGeneratedAt: contract.pdfGeneratedAt?.toISOString() ?? null,
    mentorSignDeadline: contract.mentorSignDeadline?.toISOString() ?? null,
    menteeSignDeadline: contract.menteeSignDeadline?.toISOString() ?? null,
    generatedAt: contract.generatedAt.toISOString(),
    activatedAt: contract.activatedAt?.toISOString() ?? null,
    voidedAt: contract.voidedAt?.toISOString() ?? null,
    signatures: contract.signatures.map((s) => ({
      signerRole: s.signerRole,
      signerName: s.signer.name,
      signedAt: s.otpVerifiedAt.toISOString(),
      ipAddress: s.ipAddress,
      declaration: s.declaration,
    })),
  };
}
