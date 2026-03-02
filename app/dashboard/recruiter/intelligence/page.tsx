import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import { track } from "@/lib/analytics/track";
import { EVENTS } from "@/lib/analytics/track";
import { IntelligenceClient } from "@/components/dashboard/recruiter/IntelligenceClient";

export default async function RecruiterIntelligencePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/dashboard/recruiter/intelligence");
  const role = (session.user as { role?: string }).role;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  await track(EVENTS.RECRUITER_INTELLIGENCE_VIEWED, {}, { userId: session.user.id });

  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-semibold">Hiring Intelligence</h1>
      <p className="text-muted-foreground mt-1">
        Time to hire, funnel, benchmarking, and D&I metrics
      </p>
      <IntelligenceClient />
    </div>
  );
}
