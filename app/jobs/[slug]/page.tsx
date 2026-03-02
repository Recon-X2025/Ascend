import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getJobBySlug, getSimilarJobs, getCompanyRatingForJob } from "@/lib/jobs/queries";
import { sanitizeRichText } from "@/lib/html/sanitize";
import { buildMetadata } from "@/lib/seo/metadata";
import { BASE_URL } from "@/lib/seo/metadata";
import { buildJobPostingSchema, buildBreadcrumbSchema } from "@/lib/seo/schemas";
import { JsonLd } from "@/components/seo/JsonLd";
import { ViewCountTracker } from "@/components/jobs/ViewCountTracker";
import { CompanySnippetCard } from "@/components/jobs/CompanySnippetCard";
import { SimilarJobs } from "@/components/jobs/SimilarJobs";
import { JobDetailSidebar } from "@/components/jobs/JobDetailSidebar";
import { JobDetailStickyCTA } from "@/components/jobs/JobDetailStickyCTA";
import { JobDetailTabs } from "@/components/jobs/JobDetailTabs";
import { FitScoreCard } from "@/components/jobs/FitScoreCard";
import { OptimiseResumeButton } from "@/components/resume/OptimiseResumeButton";
import { ReportButton } from "@/components/common/ReportButton";
import { ReferColleagueButton } from "@/components/jobs/ReferColleagueButton";
import { ShareButton } from "@/components/growth/ShareButton";
import { Container } from "@/components/layout/Container";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { prisma } from "@/lib/prisma/client";
import { MapPin } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await prisma.jobPost.findUnique({
    where: { slug },
    select: {
      title: true,
      slug: true,
      locations: true,
      type: true,
      workMode: true,
      salaryMin: true,
      salaryMax: true,
      companyRef: { select: { name: true, slug: true } },
    },
  });

  if (!job)
    return buildMetadata({ title: "Job Not Found", path: "/jobs", noIndex: true });

  const companyName = job.companyRef?.name ?? "Company";
  const location = job.locations?.[0] ?? "India";
  const salaryStr =
    job.salaryMin != null && job.salaryMax != null
      ? ` · ₹${(job.salaryMin / 100000).toFixed(0)}–${(job.salaryMax / 100000).toFixed(0)} LPA`
      : "";

  return buildMetadata({
    title: `${job.title} at ${companyName}`,
    description: `Apply for ${job.title} at ${companyName} in ${location}${salaryStr}. ${job.workMode.charAt(0) + job.workMode.slice(1).toLowerCase()} · ${job.type.replace(/_/g, " ").toLowerCase()} role on Ascend.`,
    path: `/jobs/${job.slug}`,
  });
}

function formatSalary(job: {
  salaryVisible: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
}) {
  if (!job.salaryVisible || (job.salaryMin == null && job.salaryMax == null)) return "Not disclosed";
  const sym = job.salaryCurrency === "INR" ? "₹" : job.salaryCurrency === "USD" ? "$" : job.salaryCurrency;
  const min = job.salaryMin != null ? (job.salaryCurrency === "INR" ? job.salaryMin / 100000 : job.salaryMin) : null;
  const max = job.salaryMax != null ? (job.salaryCurrency === "INR" ? job.salaryMax / 100000 : job.salaryMax) : null;
  if (min != null && max != null) return sym + min + " – " + sym + max + " LPA";
  if (min != null) return sym + min + "+ LPA";
  if (max != null) return "Up to " + sym + max + " LPA";
  return "Not disclosed";
}

function formatDate(d: Date | null) {
  if (!d) return "";
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  if (diff < 30) return `${diff} days ago`;
  return `${Math.floor(diff / 30)} months ago`;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [session, job] = await Promise.all([
    getServerSession(authOptions),
    getJobBySlug(slug),
  ]);
  if (!job) notFound();

  const jobWithVisibility = job as typeof job & { visibility?: string };
  let canRefer = false;
  if (session?.user?.id) {
    if (jobWithVisibility.visibility === "PUBLIC") {
      canRefer = true;
    } else if (jobWithVisibility.visibility === "INTERNAL" && job.companyId) {
      const employee = await prisma.companyEmployee.findUnique({
        where: { userId_companyId: { userId: session.user.id, companyId: job.companyId } },
      });
      canRefer = !!employee;
    }
  }
  if (jobWithVisibility.visibility === "INTERNAL" && job.companyId) {
    const userId = session?.user?.id;
    if (!userId) notFound();
    const employee = await prisma.companyEmployee.findUnique({
      where: { userId_companyId: { userId, companyId: job.companyId } },
    });
    if (!employee) notFound();
  }
  if (session?.user?.id && jobWithVisibility.visibility === "INTERNAL") {
    const { trackOutcome } = await import("@/lib/tracking/outcomes");
    trackOutcome(session.user.id, "INTERNAL_JOB_VIEWED", {
      entityId: String(job.id),
      entityType: "JobPost",
      metadata: { jobId: job.id },
    }).catch(() => {});
  }

  const isSeeker = (session?.user as { role?: string } | undefined)?.role === "JOB_SEEKER";

  const [companyRating, similarJobs] = await Promise.all([
    getCompanyRatingForJob(job.companyId),
    getSimilarJobs(job.id, 6),
  ]);

  const companyName = job.companyRef?.name ?? job.companyName ?? "Company";
  const companySlug = job.companyRef?.slug ?? "";
  const isActive = job.status === "ACTIVE";

  const jobSchema = buildJobPostingSchema({
    id: job.id,
    title: job.title,
    slug: job.slug,
    description: job.description,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: "YEAR",
    locations: job.locations,
    workMode: job.workMode,
    type: job.type,
    postedAt: job.publishedAt,
    deadline: job.deadline,
    company: {
      name: companyName,
      website: job.companyRef?.website ?? null,
      logo: job.companyRef?.logo ?? null,
      slug: companySlug,
    },
    skills: job.skills?.map((s) => s.skill.name) ?? [],
    experienceMin: job.experienceMin,
    experienceMax: job.experienceMax,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Jobs", url: `${BASE_URL}/jobs` },
    ...(companySlug ? [{ name: companyName, url: `${BASE_URL}/companies/${companySlug}` }] : []),
    { name: job.title, url: `${BASE_URL}/jobs/${job.slug}` },
  ]);

  return (
    <>
      <JsonLd schema={jobSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <Container className="py-6">
      <ViewCountTracker jobId={job.id} />
      {!isActive && (
        <div className="mb-4 rounded-lg bg-amber-100 px-4 py-3 text-sm text-amber-800">
          This job is no longer accepting applications.
        </div>
      )}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
          <Link
            href={job.companyRef ? "/companies/" + job.companyRef.slug : "#"}
            className="text-muted-foreground hover:underline mt-1 block"
          >
            {companyName}
            {job.companyRef?.verified && (
              <span className="ml-1 text-green-600 text-xs">Verified</span>
            )}
          </Link>
          <div className="flex flex-wrap gap-2 mt-3 text-sm text-muted-foreground">
            {job.locations.length > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.locations.join(", ")}
              </span>
            )}
            <span>{job.workMode.replace(/_/g, " ")}</span>
            <span>{job.type.replace(/_/g, " ")}</span>
            {(job.experienceMin != null || job.experienceMax != null) && (
              <span>
                {job.experienceMin != null && job.experienceMax != null
                  ? job.experienceMin + "–" + job.experienceMax + " yrs"
                  : job.experienceMin != null
                    ? job.experienceMin + "+ yrs"
                    : "Up to " + job.experienceMax + " yrs"}
              </span>
            )}
            <span>{job.educationLevel.replace(/_/g, " ")}</span>
          </div>
          <p className="mt-2 text-sm font-medium">{formatSalary(job)}</p>
          {job.salaryVisible && (job.salaryMin != null || job.salaryMax != null) && (
            <p className="text-xs mt-1">
              <Link
                href={`/salary/roles/${job.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}?city=${encodeURIComponent((job.locations?.[0] ?? "").trim())}`}
                className="text-green-600 hover:underline"
              >
                See how this compares →
              </Link>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(job.publishedAt)} · {job.applicationCount} applicants · {job.openings} openings
          </p>
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {job.tags.map((t) => (
                <span key={t} className="rounded border border-border px-2 py-0.5 text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
          <JobDetailTabs
            jobPostId={job.id}
            overviewContent={
              <>
                <hr className="my-6 border-border" />
                <h2 className="text-lg font-semibold mb-2">About the role</h2>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(job.description) }}
                />
                {job.skills.length > 0 && (
                  <>
                    <h3 className="font-medium mt-6 mb-2">Must-have skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.filter((s) => s.required).map((s) => (
                        <span key={s.skill.id} className="rounded border border-green-500/50 bg-green-500/10 px-2 py-1 text-sm">
                          {s.skill.name}
                        </span>
                      ))}
                    </div>
                    {job.skills.some((s) => !s.required) && (
                      <>
                        <h3 className="font-medium mt-4 mb-2">Nice-to-have skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.filter((s) => !s.required).map((s) => (
                            <span key={s.skill.id} className="rounded border border-border bg-muted/50 px-2 py-1 text-sm">
                              {s.skill.name}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
                {job.easyApply && job.screeningQuestions.length > 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    This role has {job.screeningQuestions.length} screening question(s).
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <ShareButton
                    entityType="JOB"
                    entityId={job.slug}
                    url={`${BASE_URL}/jobs/${job.slug}`}
                    title={`${job.title} at ${companyName}`}
                  />
                  <ReportButton
                    targetType="JOB_POST"
                    targetId={String(job.id)}
                    canReport={!!session?.user?.id && session.user.id !== job.recruiterId}
                  />
                  <ReferColleagueButton
                    jobId={job.id}
                    jobSlug={job.slug}
                    jobTitle={job.title}
                    companyName={companyName}
                    canRefer={canRefer}
                  />
                </div>
              </>
            }
          />
        </div>
        <aside className="mt-6 lg:mt-0">
          <div className="lg:sticky lg:top-20 space-y-4">
            <JobDetailSidebar
              jobId={job.id}
              slug={job.slug}
              easyApply={job.easyApply}
              applicationUrl={job.applicationUrl}
              viewCount={job.viewCount}
              applicationCount={job.applicationCount}
            />
            <ErrorBoundary>
              <FitScoreCard jobPostId={job.id} jobSlug={job.slug} />
            </ErrorBoundary>
            {isSeeker && isActive && (
              <div className="hidden lg:block">
                <OptimiseResumeButton jobPostId={job.id} jobTitle={job.title} />
              </div>
            )}
            {job.companyRef && (
              <CompanySnippetCard
                company={job.companyRef}
                rating={companyRating && companyRating.reviewCount >= 3 ? { overallAvg: companyRating.overallAvg, reviewCount: companyRating.reviewCount } : null}
              />
            )}
          </div>
        </aside>
      </div>
      {isSeeker && (
        <JobDetailStickyCTA
          jobId={job.id}
          slug={job.slug}
          jobTitle={job.title}
          easyApply={job.easyApply}
          applicationUrl={job.applicationUrl}
          isActive={isActive}
        />
      )}
      <div className="mt-8">
        <SimilarJobs
          jobs={similarJobs.map((s) => {
            const row = s as typeof s & { companyRef?: { slug: string; name: string } | null };
            return {
              id: row.id,
              slug: row.slug,
              title: row.title,
              type: row.type,
              workMode: row.workMode,
              locations: row.locations,
              salaryVisible: row.salaryVisible,
              salaryMin: row.salaryMin,
              salaryMax: row.salaryMax,
              salaryCurrency: row.salaryCurrency,
              companyName: row.companyName,
              company: row.companyRef ? { slug: row.companyRef.slug, name: row.companyRef.name } : null,
              publishedAt: row.publishedAt?.toISOString() ?? null,
            };
          })}
        />
      </div>
    </Container>
    </>
  );
}
