import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { JobAlertsManager } from "./JobAlertsManager";

export const dynamic = "force-dynamic";

const MAX_ALERTS_FREE = 3;

export default async function JobAlertsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/settings/job-alerts");

  const alerts = await prisma.jobAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, query: true, frequency: true, active: true, lastSentAt: true, createdAt: true },
  });
  const count = alerts.length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-text-primary">Job alerts</h1>
      <p className="text-text-secondary">
        Get email digests when new jobs match your saved searches. You have {count}/{MAX_ALERTS_FREE} alerts. Upgrade for up to 20.
      </p>
      <JobAlertsManager initialAlerts={alerts} />
    </div>
  );
}
