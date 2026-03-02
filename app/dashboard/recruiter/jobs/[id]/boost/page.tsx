import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { canManageJob } from "@/lib/jobs/permissions";
import Link from "next/link";
import { BoostPurchaseForm } from "@/components/payments/BoostPurchaseForm";

type Params = { params: Promise<{ id: string }> };

export default async function JobBoostPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (Number.isNaN(jobId)) notFound();

  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, slug: true, companyId: true },
  });
  if (!job || !(await canManageJob(session.user.id, jobId))) notFound();
  if (!job.companyId) redirect(`/dashboard/recruiter/jobs`);

  return (
    <div className="page-container py-6">
      <p className="text-sm text-muted-foreground mb-2">
        <Link href="/dashboard/recruiter/jobs" className="hover:underline">Jobs</Link>
        {" → "}
        <Link href={`/jobs/${job.slug}`} className="hover:underline">{job.title}</Link>
        {" → Boost"}
      </p>
      <h1 className="text-xl font-semibold mb-4">Boost this job</h1>
      <BoostPurchaseForm jobId={job.id} jobTitle={job.title} companyId={job.companyId} />
    </div>
  );
}
