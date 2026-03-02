import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { TierHistoryClient } from "@/components/mentorship/mentor-dashboard/TierHistoryClient";

const REASON_LABELS: Record<string, string> = {
  WEEKLY_CALC: "Automatic weekly recalculation",
  OUTCOME_VERIFIED: "New verified outcome",
  ADMIN_OVERRIDE: "Manual adjustment by Ascend team",
  DEMOTION_DISPUTE_RATE: "Dispute rate exceeded threshold",
  DEMOTION_VERIFICATION_LAPSED: "Verification period lapsed",
};

export default async function MentorTierHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/mentor/tier-history");
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    redirect("/mentorship/become-a-mentor");
  }

  const history = await prisma.mentorTierHistory.findMany({
    where: { mentorId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      previousTier: true,
      newTier: true,
      reason: true,
      createdAt: true,
    },
  });

  const rows = history.map((h) => ({
    previousTier: h.previousTier,
    newTier: h.newTier,
    reason: REASON_LABELS[h.reason] ?? h.reason,
    createdAt: h.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#F7F6F1] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <TierHistoryClient rows={rows} />
      </div>
    </div>
  );
}
