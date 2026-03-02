import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { isEnabled } from "@/lib/feature-flags";
import { rateLimit } from "@/lib/redis/ratelimit";
import { profileOptimiseQueue } from "@/lib/queues";
import { track, EVENTS } from "@/lib/analytics/track";

const PROFILE_OPTIMISE_LIMIT = 1;
const WINDOW_SECONDS = 48 * 60 * 60; // 48 hours

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "JOB_SEEKER") {
      return NextResponse.json({ success: false, error: "Only job seekers can run profile optimiser" }, { status: 403 });
    }
    if (!(await isEnabled("profile_optimiser"))) {
      return NextResponse.json({ success: false, error: "Feature not available" }, { status: 503 });
    }

    const rlKey = `profile-optimise:${session.user.id}`;
    const { success, remaining } = await rateLimit(rlKey, PROFILE_OPTIMISE_LIMIT, WINDOW_SECONDS);
    if (!success) {
      return NextResponse.json(
        { error: "You can run profile analysis once every 48 hours", remaining: 0 },
        { status: 429 }
      );
    }

    await profileOptimiseQueue.add("analyse", {
      userId: session.user.id,
    });

    track(
      EVENTS.PROFILE_OPTIMISER_RUN,
      {},
      { userId: session.user.id, persona: (session.user as { persona?: string }).persona }
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Profile analysis started",
      remaining,
    });
  } catch (e) {
    console.error("[ProfileOptimise POST]", e);
    return NextResponse.json({ success: false, error: "Failed to queue profile optimiser" }, { status: 500 });
  }
}
