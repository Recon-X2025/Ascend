import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getJobBySlug } from "@/lib/jobs/queries";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";
import { InterviewPrepClient } from "@/components/jobs/InterviewPrepClient";
import { Container } from "@/components/layout/Container";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function JobInterviewPrepPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent("/jobs/" + slug + "/interview-prep")}`);
  }
  if ((session.user as { role?: string }).role !== "JOB_SEEKER") {
    redirect("/dashboard");
  }

  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const application = await prisma.jobApplication.findUnique({
    where: {
      jobPostId_applicantId: { jobPostId: job.id, applicantId: session.user.id },
    },
    select: { status: true },
  });

  const allowedStatuses = ["SHORTLISTED", "INTERVIEW_SCHEDULED"];
  const canAccess = application && allowedStatuses.includes(application.status);

  return (
    <Container className="py-8">
      <div className="mb-6">
        <Link
          href={`/jobs/${job.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to job
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          Prepare for interview: {job.title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {job.companyRef?.name ?? job.companyName ?? "Company"}
        </p>
      </div>
      {canAccess ? (
        <InterviewPrepClient jobId={job.id} jobSlug={job.slug} />
      ) : (
        <div className="rounded-lg border bg-muted/30 p-6 text-center">
          <p className="text-muted-foreground">
            Interview prep is available once your application is shortlisted or an interview is scheduled.
          </p>
          <Link
            href={`/jobs/${job.slug}`}
            className="inline-block mt-4 text-primary hover:underline"
          >
            Back to job
          </Link>
        </div>
      )}
    </Container>
  );
}
