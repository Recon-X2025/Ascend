import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { DisputeFilingClient } from "@/components/mentorship/DisputeFilingClient";

export default async function DisputeFilingPage({
  params,
}: {
  params: Promise<{ contractId: string; milestoneId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { contractId, milestoneId } = await params;

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      milestones: {
        where: { id: milestoneId },
        include: { escrowTranche: true },
      },
      escrow: { include: { tranches: true } },
    },
  });

  if (!contract) notFound();
  if (contract.menteeUserId !== session.user.id) redirect(`/mentorship/engagements/${contractId}`);

  const milestone = contract.milestones[0];
  if (!milestone) notFound();

  const tranche = milestone.escrowTranche ?? contract.escrow?.tranches?.find((t) => t.milestoneId === milestoneId);
  if (!tranche || tranche.status !== "PENDING_RELEASE") {
    redirect(`/mentorship/engagements/${contractId}`);
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="max-w-xl mx-auto">
        <DisputeFilingClient
          contractId={contractId}
          milestoneId={milestoneId}
          milestoneNumber={milestone.milestoneNumber}
          amountPaise={tranche.amountPaise}
          engagementUrl={`${baseUrl}/mentorship/engagements/${contractId}`}
        />
      </div>
    </div>
  );
}
