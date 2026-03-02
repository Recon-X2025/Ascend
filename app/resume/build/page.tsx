import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { ResumeBuildWizard } from "@/components/resume/ResumeBuildWizard";

export default async function ResumeBuildPage({
  searchParams,
}: {
  searchParams: Promise<{ careerIntentId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?callbackUrl=/resume/build");
  if (session.user.role !== "JOB_SEEKER") redirect("/dashboard/seeker");

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: session.user.id! },
  });
  if (!profile) redirect("/profile/edit");

  const params = await searchParams;
  const initialCareerIntentId = typeof params?.careerIntentId === "string" ? params.careerIntentId : undefined;

  return (
    <div className="min-h-screen bg-surface">
      <ResumeBuildWizard initialCareerIntentId={initialCareerIntentId} />
    </div>
  );
}
