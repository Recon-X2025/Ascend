import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { AdminDisputeResolveClient } from "@/components/dashboard/admin/AdminDisputeResolveClient";

export default async function AdminDisputePage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  const { disputeId } = await params;

  const dispute = await prisma.mentorshipDispute.findUnique({
    where: { id: disputeId },
    include: {
      contract: {
        include: {
          mentor: { select: { id: true, name: true, email: true } },
          mentee: { select: { id: true, name: true, email: true } },
        },
      },
      milestone: { select: { milestoneNumber: true, type: true } },
      tranche: { select: { trancheNumber: true, amountPaise: true, status: true } },
      evidence: true,
    },
  });

  if (!dispute) notFound();

  const payload = {
    id: dispute.id,
    contractId: dispute.contractId,
    mentor: dispute.contract.mentor,
    mentee: dispute.contract.mentee,
    milestone: dispute.milestone,
    tranche: dispute.tranche,
    category: dispute.category,
    description: dispute.description,
    status: dispute.status,
    outcome: dispute.outcome,
    opsNote: dispute.opsNote,
    evidence: dispute.evidence.map((e) => ({
      evidenceType: e.evidenceType,
      content: e.content,
    })),
    createdAt: dispute.createdAt.toISOString(),
    resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
  };

  return (
    <div className="p-6 max-w-3xl">
      <AdminDisputeResolveClient dispute={payload} />
    </div>
  );
}
