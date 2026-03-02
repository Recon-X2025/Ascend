import { resumeQueue, fitScoreQueue, optimiserQueue } from "@/lib/queues";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { NextRequest, NextResponse } from "next/server";

const queues = [resumeQueue, fitScoreQueue, optimiserQueue];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> | { jobId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const jobId = params.jobId;

  const stateToStatus = (state: string) => {
    if (state === "completed") return "done";
    if (state === "failed") return "failed";
    if (state === "active") return "processing";
    return "pending";
  };

  for (const queue of queues) {
    const job = await queue.getJob(jobId);
    if (job) {
      const state = await job.getState();
      const status = stateToStatus(state);
      return NextResponse.json({
        success: true,
        data: {
          jobId: job.id,
          status,
          state,
          progress: job.progress,
          result: state === "completed" ? job.returnvalue : undefined,
          error: state === "failed" ? job.failedReason : undefined,
        },
      });
    }
  }

  return NextResponse.json(
    { success: false, error: "Job not found" },
    { status: 404 }
  );
}
