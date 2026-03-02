import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { EngagementDashboardClient } from "@/components/mentorship/EngagementDashboardClient";

export default async function EngagementPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/mentorship/engagements/${(await params).contractId}`);
  }

  const { contractId } = await params;
  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      sessions: { orderBy: { sessionNumber: "asc" } },
      milestones: { orderBy: { milestoneNumber: "asc" } },
      documents: true,
      outcome: true,
      escrow: {
        include: { tranches: { orderBy: { trancheNumber: "asc" } } },
      },
    },
  });

  if (!contract) notFound();
  if (contract.mentorUserId !== session.user.id && contract.menteeUserId !== session.user.id) {
    redirect("/mentorship/dashboard");
  }

  const isMentor = contract.mentorUserId === session.user.id;
  const goalDocument = contract.documents.find((d) => d.type === "GOAL_DOCUMENT") ?? null;
  const outcomeDocument = contract.documents.find((d) => d.type === "OUTCOME_DOCUMENT") ?? null;

  const payload = {
    contract: {
      id: contract.id,
      engagementType: contract.engagementType,
      engagementStart: contract.engagementStart?.toISOString() ?? null,
      engagementEnd: contract.engagementEnd?.toISOString() ?? null,
      status: contract.status,
    },
    sessions: contract.sessions.map((s) => ({
      id: s.id,
      sessionNumber: s.sessionNumber,
      scheduledAt: s.scheduledAt?.toISOString() ?? null,
      status: s.status,
      sharedNotes: s.sharedNotes,
      durationMinutes: s.durationMinutes,
    })),
    milestones: contract.milestones.map((m) => ({
      id: m.id,
      milestoneNumber: m.milestoneNumber,
      type: m.type,
      dueDate: m.dueDate.toISOString(),
      status: m.status,
      mentorAssessment: m.mentorAssessment,
      menteeAssessment: m.menteeAssessment,
    })),
    goalDocument: goalDocument
      ? {
          id: goalDocument.id,
          type: goalDocument.type,
          content: goalDocument.content,
          mentorSigned: goalDocument.mentorSigned,
          menteeSigned: goalDocument.menteeSigned,
        }
      : null,
    outcomeDocument: outcomeDocument
      ? {
          id: outcomeDocument.id,
          type: outcomeDocument.type,
          content: outcomeDocument.content,
          mentorSigned: outcomeDocument.mentorSigned,
          menteeSigned: outcomeDocument.menteeSigned,
        }
      : null,
    progressPercent:
      contract.sessions.length > 0
        ? Math.round(
            (contract.sessions.filter((s) => s.status === "COMPLETED").length / contract.sessions.length) * 100
          )
        : 0,
    outcome: contract.outcome
      ? {
          id: contract.outcome.id,
          status: contract.outcome.status,
          outcomeAchieved: contract.outcome.outcomeAchieved,
          transitionType: contract.outcome.transitionType,
          claimedOutcome: contract.outcome.claimedOutcome,
          mentorReflection: contract.outcome.mentorReflection,
          menteeNote: contract.outcome.menteeNote,
          acknowledgementDeadline: contract.outcome.acknowledgementDeadline.toISOString(),
          opsDecision: contract.outcome.opsDecision,
          opsNote: contract.outcome.opsNote,
          checkInStatus: contract.outcome.checkInStatus,
          checkInDueAt: contract.outcome.checkInDueAt?.toISOString() ?? null,
          checkInBadgeGranted: contract.outcome.checkInBadgeGranted,
        }
      : null,
    escrow: contract.escrow
      ? {
          id: contract.escrow.id,
          status: contract.escrow.status,
          totalAmountPaise: contract.escrow.totalAmountPaise,
          tranches: contract.escrow.tranches.map((t) => ({
            id: t.id,
            trancheNumber: t.trancheNumber,
            amountPaise: t.amountPaise,
            status: t.status,
            autoReleaseAt: t.autoReleaseAt?.toISOString() ?? null,
            milestoneId: t.milestoneId ?? null,
          })),
        }
      : null,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <EngagementDashboardClient
          contractId={contractId}
          initialData={payload}
          isMentor={isMentor}
        />
      </div>
    </div>
  );
}
