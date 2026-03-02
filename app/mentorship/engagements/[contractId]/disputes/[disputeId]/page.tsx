import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { DisputeStatusClient } from "@/components/mentorship/DisputeStatusClient";

export default async function DisputeStatusPage({
  params,
}: {
  params: Promise<{ contractId: string; disputeId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const { contractId, disputeId } = await params;

  const dispute = await prisma.mentorshipDispute.findUnique({
    where: { id: disputeId },
    include: {
      contract: { select: { mentorUserId: true, menteeUserId: true } },
      milestone: { select: { milestoneNumber: true, type: true } },
      tranche: { select: { trancheNumber: true, amountPaise: true, status: true } },
    },
  });

  if (!dispute) notFound();
  if (dispute.contractId !== contractId) notFound();

  const isParticipant =
    dispute.contract.mentorUserId === session.user.id ||
    dispute.contract.menteeUserId === session.user.id;
  if (!isParticipant) redirect(`/mentorship/engagements/${contractId}`);

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="max-w-xl mx-auto">
        <DisputeStatusClient
          dispute={{
            id: dispute.id,
            contractId: dispute.contractId,
            milestoneNumber: dispute.milestone.milestoneNumber,
            trancheNumber: dispute.tranche.trancheNumber,
            amountPaise: dispute.tranche.amountPaise,
            trancheStatus: dispute.tranche.status,
            category: dispute.category,
            description: dispute.description,
            status: dispute.status,
            outcome: dispute.outcome,
            opsNote: dispute.opsNote,
            createdAt: dispute.createdAt.toISOString(),
            resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
            filedByUserId: dispute.filedByUserId,
          }}
          isMentee={dispute.contract.menteeUserId === session.user.id}
          engagementUrl={`${baseUrl}/mentorship/engagements/${contractId}`}
        />
      </div>
    </div>
  );
}
