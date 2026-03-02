import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { ContractPageClient, type ContractPayload } from "@/components/mentorship/ContractPageClient";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/mentorship/contracts/${(await params).contractId}`);
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

  if (!contract) notFound();
  if (contract.mentorUserId !== session.user.id && contract.menteeUserId !== session.user.id) {
    redirect("/mentorship");
  }

  const isMentor = contract.mentorUserId === session.user.id;
  const payload: ContractPayload = {
    id: contract.id,
    status: contract.status,
    contractContent: contract.contractContent as ContractPayload["contractContent"],
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

  return (
    <div className="min-h-screen bg-[#F7F6F1]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ContractPageClient
          contract={payload}
          isMentor={isMentor}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
