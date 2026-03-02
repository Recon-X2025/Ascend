import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { ResumeVersionsList } from "@/components/resume/ResumeVersionsList";
import { OptimisedVersionsList } from "@/components/resume/OptimisedVersionsList";

export default async function ResumeVersionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/resume/versions");
  if (session.user.role !== "JOB_SEEKER") redirect("/dashboard/seeker");

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: session.user.id! },
  });
  if (!profile) redirect("/profile/edit");

  return (
    <div className="min-h-screen bg-surface">
      <div className="page-container py-8 space-y-10">
        <ResumeVersionsList />
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Optimised for specific jobs
          </h2>
          <OptimisedVersionsList />
        </section>
      </div>
    </div>
  );
}
