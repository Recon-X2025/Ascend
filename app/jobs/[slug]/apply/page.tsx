import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getJobBySlug } from "@/lib/jobs/queries";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";
import { ApplyForm } from "@/components/applications/ApplyForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function JobApplyPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent("/jobs/" + slug + "/apply")}`);
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "JOB_SEEKER") {
    redirect("/dashboard");
  }

  const job = await getJobBySlug(slug);
  if (!job) notFound();

  if (!job.easyApply) {
    if (job.applicationUrl) {
      redirect(job.applicationUrl);
    }
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <h1 className="text-xl font-semibold">Apply via company website</h1>
        <p className="text-muted-foreground mt-2">
          This job does not accept applications through Ascend. Please contact the recruiter or apply on the company website directly.
        </p>
        <Link href={`/jobs/${slug}`} className="text-primary hover:underline mt-4 inline-block">
          ← Back to job
        </Link>
      </div>
    );
  }

  const existing = await prisma.jobApplication.findUnique({
    where: {
      jobPostId_applicantId: { jobPostId: job.id, applicantId: session.user.id },
    },
  });
  if (existing) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <h1 className="text-xl font-semibold">Already applied</h1>
        <p className="text-muted-foreground mt-2">You have already applied to this job.</p>
        <Link
          href="/dashboard/seeker/applications"
          className="text-primary hover:underline mt-4 inline-block"
        >
          View your applications →
        </Link>
        <Link href={`/jobs/${slug}`} className="block text-muted-foreground hover:underline mt-2">
          ← Back to job
        </Link>
      </div>
    );
  }

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      headline: true,
      currentRole: true,
      city: true,
      state: true,
      country: true,
      totalExpYears: true,
      completionScore: true,
    },
  });

  const screeningQuestions = job.screeningQuestions ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold">Apply to {job.title}</h1>
      <p className="text-muted-foreground mt-1">
        {job.companyRef?.name ?? job.companyName ?? "Company"}
      </p>
      <ApplyForm
        jobId={job.id}
        jobSlug={job.slug}
        jobTitle={job.title}
        companyName={job.companyRef?.name ?? job.companyName ?? "Company"}
        screeningQuestions={screeningQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          required: q.required,
          order: q.order,
        }))}
        profile={{
          name: session.user.name ?? "",
          currentRole: profile?.currentRole ?? null,
          location: [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ") || null,
          yearsExperience: profile?.totalExpYears ?? null,
          completionScore: profile?.completionScore ?? 0,
        }}
      />
    </div>
  );
}
