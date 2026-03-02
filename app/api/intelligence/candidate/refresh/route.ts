import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { rateLimit } from "@/lib/redis/ratelimit";
import { candidateIntelligenceQueue } from "@/lib/queues";

const REFRESH_LIMIT = 3;
const REFRESH_WINDOW_SECONDS = 24 * 60 * 60;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }
  const userId = session.user.id;

  const { success } = await rateLimit(
    `intelligence-refresh:${userId}`,
    REFRESH_LIMIT,
    REFRESH_WINDOW_SECONDS
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many refresh requests. Try again in 24 hours." },
      { status: 429 }
    );
  }

  try {
    await candidateIntelligenceQueue.add("compute", { userId }, { jobId: `candidate-intel-${userId}-${Date.now()}` });
  } catch {
    return NextResponse.json(
      { error: "Failed to queue refresh" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    queued: true,
    estimatedSeconds: 10,
  });
}
