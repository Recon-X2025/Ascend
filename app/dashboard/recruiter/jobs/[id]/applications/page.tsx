import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { canManageJob } from "@/lib/jobs/permissions";
import { RecruiterApplicationsClient } from "@/components/applications/RecruiterApplicationsClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecruiterJobApplicationsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/dashboard/recruiter");
  const role = (session.user as { role?: string }).role;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") redirect("/dashboard");

  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (Number.isNaN(jobId)) notFound();

  const canManage = await canManageJob(session.user.id, jobId);
  if (!canManage) notFound();

  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, slug: true, companyName: true },
  });
  if (!job) notFound();

  return (
    <div className="page-container py-6">
      <h1 className="text-2xl font-semibold">Applications</h1>
      <p className="text-muted-foreground mt-1">
        {job.title} · {job.companyName ?? "Company"}
      </p>
      <RecruiterApplicationsClient jobId={job.id} jobTitle={job.title} companyName={job.companyName ?? "Company"} />
    </div>
  );
}
