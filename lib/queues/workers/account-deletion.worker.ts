import { Worker, type Job } from "bullmq";
import type { AccountDeletionJobData } from "../index";
import { prisma } from "@/lib/prisma/client";
import { removeFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit/log";
import { sendAccountDeletionCompletedEmail } from "@/lib/email/templates/account-deletion-completed";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

// LegalDocumentSignature records are retained indefinitely (7 years) per legal obligation.
// Do not delete or anonymise LegalDocumentSignature on account deletion.
// Invoice records (including VOID) are retained for 7 years for GST/tax compliance. Do not delete.

export const accountDeletionWorker = new Worker<AccountDeletionJobData>(
  "account-deletion",
  async (job: Job<AccountDeletionJobData>) => {
    const { dataRequestId, userId } = job.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, deletedAt: true },
    });
    if (!user) {
      throw new Error("User not found");
    }
    if (user.deletedAt) {
      await prisma.dataRequest.update({
        where: { id: dataRequestId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      return;
    }

    const emailForConfirmation = user.email;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          email: `deleted-${userId}@ascend.deleted`,
          name: "Deleted User",
          image: null,
        },
      });

      await tx.session.deleteMany({ where: { userId } });
    });

    await prisma.userSubscription.updateMany({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (profile) {
      await prisma.jobSeekerProfile.update({
        where: { id: profile.id },
        data: {
          headline: null,
          summary: null,
          city: null,
          state: null,
          country: null,
        },
      });
      const resumes = await prisma.resume.findMany({
        where: { profileId: profile.id },
        select: { storageKey: true },
      });
      for (const r of resumes) {
        try {
          await removeFile(r.storageKey);
        } catch {
          // ignore
        }
      }
      await prisma.resume.deleteMany({ where: { profileId: profile.id } });
    }

    await prisma.dataRequest.update({
      where: { id: dataRequestId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    try {
      await logAudit({
        category: "COMPLIANCE",
        action: "ACCOUNT_DELETED",
        severity: "CRITICAL",
        targetType: "User",
        targetId: userId,
        metadata: { dataRequestId },
      });
    } catch {
      // non-blocking
    }

    try {
      await sendAccountDeletionCompletedEmail(emailForConfirmation);
    } catch (e) {
      console.error("[account-deletion] sendAccountDeletionCompletedEmail failed:", e);
    }
  },
  { connection }
);

accountDeletionWorker.on("completed", (job) => {
  console.log("[AccountDeletionWorker] Completed:", job.id, job.data.dataRequestId);
});

accountDeletionWorker.on("failed", (job, err) => {
  console.error("[AccountDeletionWorker] Failed:", job?.id, err.message);
});
