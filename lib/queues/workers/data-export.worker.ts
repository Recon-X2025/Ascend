import { Worker, type Job } from "bullmq";
import type { DataExportJobData } from "../index";
import { prisma } from "@/lib/prisma/client";
import { storeFile, getSignedDownloadUrlWithExpiry } from "@/lib/storage";
import { sendDataExportReadyEmail } from "@/lib/email/templates/data-export-ready";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const EXPIRY_SECONDS = 7 * 24 * 3600; // 7 days

export const dataExportWorker = new Worker<DataExportJobData>(
  "data-export",
  async (job: Job<DataExportJobData>) => {
    const { dataRequestId, userId } = job.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        onboardingComplete: true,
        persona: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const [
      profile,
      applications,
      savedJobs,
      savedSearches,
      jobAlerts,
      connections,
      companyReviews,
      paymentEvents,
      auditLogs,
      mentorApplicationsAsMentee,
      mentorApplicationsAsMentor,
      contractsAsMentee,
      contractsAsMentor,
    ] = await Promise.all([
      prisma.jobSeekerProfile.findUnique({
        where: { userId },
        include: {
          experiences: true,
          educations: true,
          certifications: true,
          projects: true,
          awards: true,
          languages: true,
          skills: { include: { skill: { select: { name: true } } } },
        },
      }),
      prisma.jobApplication.findMany({
        where: { applicantId: userId },
        select: {
          id: true,
          jobPostId: true,
          status: true,
          submittedAt: true,
          coverLetter: true,
          responses: true,
          fitScoreSnapshot: true,
        },
      }),
      prisma.savedJob.findMany({ where: { userId } }),
      prisma.savedSearch.findMany({ where: { userId } }),
      prisma.jobAlert.findMany({ where: { userId } }),
      prisma.connection.findMany({
        where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
      }),
      prisma.companyReview.findMany({ where: { userId } }),
      prisma.paymentEvent.findMany({ where: { userId } }),
      prisma.auditLog.findMany({
        where: { actorId: userId },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.mentorApplication.findMany({
        where: { menteeId: userId },
        select: { id: true, status: true, createdAt: true },
      }),
      prisma.mentorApplication.findMany({
        where: { mentorProfile: { userId } },
        select: { id: true, status: true, createdAt: true },
      }),
      prisma.mentorshipContract.findMany({
        where: { menteeUserId: userId },
        select: { id: true, status: true, createdAt: true },
      }),
      prisma.mentorshipContract.findMany({
        where: { mentorUserId: userId },
        select: { id: true, status: true, createdAt: true },
      }),
    ]);

    const resumes = profile
      ? await prisma.resume.findMany({
          where: { profileId: profile.id },
          select: { id: true, label: true, visibility: true, createdAt: true },
        })
      : [];

    const payload = {
      exportedAt: new Date().toISOString(),
      userId,
      user,
      profile,
      resumes,
      applications,
      savedJobs,
      savedSearches,
      jobAlerts,
      connections,
      companyReviews,
      paymentEvents,
      auditLogs,
      mentorApplicationsAsMentee,
      mentorApplicationsAsMentor,
      contractsAsMentee,
      contractsAsMentor,
    };

    const key = `data-exports/${userId}-${dataRequestId}.json`;
    const body = Buffer.from(JSON.stringify(payload, null, 2), "utf-8");
    await storeFile(key, body, "application/json");

    const downloadUrl = await getSignedDownloadUrlWithExpiry(key, EXPIRY_SECONDS);
    const expiryDate = new Date(Date.now() + EXPIRY_SECONDS * 1000).toISOString().slice(0, 10);

    await prisma.dataRequest.update({
      where: { id: dataRequestId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        exportUrl: downloadUrl,
      },
    });

    const userWithEmail = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (userWithEmail?.email) {
      await sendDataExportReadyEmail(
        userWithEmail.email,
        userWithEmail.name ?? "User",
        downloadUrl,
        expiryDate
      );
    }
  },
  { connection }
);

dataExportWorker.on("completed", (job) => {
  console.log("[DataExportWorker] Completed:", job.id, job.data.dataRequestId);
});

dataExportWorker.on("failed", (job, err) => {
  console.error("[DataExportWorker] Failed:", job?.id, err.message);
});
