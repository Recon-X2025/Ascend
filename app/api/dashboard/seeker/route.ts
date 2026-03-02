import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }
    const userId = session.user.id;

    const [
      profile,
      careerContext,
      recentApplications,
      savedJobs,
      recentAlerts,
      optimisedResumes,
      unreadNotifications,
      employeePortalsRaw,
    ] = await Promise.all([
      prisma.jobSeekerProfile.findUnique({
        where: { userId },
        select: {
          completionScore: true,
          headline: true,
          profileViews: true,
          user: { select: { name: true, image: true, persona: true } },
        },
      }),
      prisma.userCareerContext.findUnique({
        where: { userId },
        select: { isSwitchingField: true },
      }),

      prisma.jobApplication.findMany({
        where: { applicantId: userId },
        orderBy: { submittedAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          jobPost: {
            select: {
              id: true,
              title: true,
              slug: true,
              companyName: true,
              companyRef: { select: { name: true, logo: true } },
            },
          },
        },
      }),

      prisma.savedJob.findMany({
        where: { userId },
        orderBy: { savedAt: "desc" },
        take: 5,
        select: {
          jobPost: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              companyName: true,
              companyRef: { select: { name: true } },
            },
          },
        },
      }),

      prisma.jobAlert.findMany({
        where: { userId, active: true },
        take: 5,
        select: { id: true, name: true, query: true, frequency: true },
      }),

      prisma.resumeVersion.findMany({
        where: { userId, jobPostId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          name: true,
          createdAt: true,
          jobPost: { select: { title: true, slug: true } },
        },
      }),

      prisma.notification.count({
        where: { userId, isRead: false },
      }),

      prisma.companyEmployee
        .findMany({
          where: { userId },
          select: { company: { select: { slug: true, name: true } } },
        })
        .catch(() => [] as { company: { slug: string; name: string } }[]),
    ]);

  const applicationStats = await prisma.jobApplication.groupBy({
    by: ["status"],
    where: { applicantId: userId },
    _count: { status: true },
  });

  const statusMap = Object.fromEntries(
    applicationStats.map((s) => [s.status, s._count.status])
  );

  const applicationsWithCompany = recentApplications.map((app) => ({
    id: app.id,
    status: app.status,
    createdAt: app.submittedAt,
    jobPost: {
      id: app.jobPost.id,
      title: app.jobPost.title,
      slug: app.jobPost.slug,
      company: {
        name: app.jobPost.companyRef?.name ?? app.jobPost.companyName ?? "Company",
        logo: app.jobPost.companyRef?.logo ?? null,
      },
    },
  }));

  const savedJobsWithCompany = savedJobs.map((s) => ({
    ...s.jobPost,
    company: {
      name: s.jobPost.companyRef?.name ?? s.jobPost.companyName ?? "Company",
    },
  }));

  const alertsForClient = recentAlerts.map((a) => ({
    id: a.id,
    keywords: a.name,
    query: a.query,
    location: null as string | null,
    frequency: a.frequency,
  }));

  const persona = profile?.user ? (profile.user as { persona?: string | null }).persona : null;
  const hasMentorMatch =
    persona === "EARLY_CAREER" || careerContext?.isSwitchingField === true;

  const reviewEligibleApplications = await prisma.jobApplication.findMany({
    where: {
      applicantId: userId,
      status: { in: ["INTERVIEW_SCHEDULED", "OFFERED"] },
      jobPost: { companyId: { not: null } },
    },
    select: {
      jobPost: {
        select: {
          companyId: true,
          companyRef: { select: { name: true, slug: true } },
        },
      },
    },
  });

  const companyIdsToCheck = Array.from(
    new Set(
      reviewEligibleApplications
        .map((a) => a.jobPost.companyId)
        .filter((id): id is string => id != null)
    )
  );

  const existingReviews = await prisma.companyReview.findMany({
    where: { userId, companyId: { in: companyIdsToCheck } },
    select: { companyId: true },
  });
  const reviewedCompanyIds = new Set(existingReviews.map((r) => r.companyId));

  const companiesForReviewPrompt = reviewEligibleApplications
    .filter((a) => a.jobPost.companyId && !reviewedCompanyIds.has(a.jobPost.companyId))
    .map((a) => ({
      companyId: a.jobPost.companyId!,
      companyName: a.jobPost.companyRef?.name ?? "Company",
      companySlug: a.jobPost.companyRef?.slug ?? "",
    }))
    .filter((c, i, arr) => arr.findIndex((x) => x.companyId === c.companyId) === i);

  const employeePortals = (employeePortalsRaw ?? []).map((e: { company: { slug: string; name: string } }) => ({
    companySlug: e.company.slug,
    companyName: e.company.name,
  }));

    return NextResponse.json({
      profile: {
        name: profile?.user?.name,
        image: profile?.user?.image,
        headline: profile?.headline,
        completionScore: profile?.completionScore ?? 0,
        profileViews: profile?.profileViews ?? 0,
      },
      hasMentorMatch,
      applications: {
        recent: applicationsWithCompany,
        stats: {
          total: Object.values(statusMap).reduce((a, b) => a + b, 0),
          applied: statusMap.SUBMITTED ?? 0,
          viewed: statusMap.UNDER_REVIEW ?? 0,
          shortlisted: statusMap.SHORTLISTED ?? 0,
          interview: statusMap.INTERVIEW_SCHEDULED ?? 0,
          offered: statusMap.OFFERED ?? 0,
          rejected: statusMap.REJECTED ?? 0,
        },
      },
      savedJobs: savedJobsWithCompany,
      alerts: alertsForClient,
      optimisedResumes,
      unreadNotifications,
      companiesForReviewPrompt: companiesForReviewPrompt.slice(0, 5),
      employeePortals,
    });
  } catch (e) {
    console.error("[dashboard/seeker] GET error:", e);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
