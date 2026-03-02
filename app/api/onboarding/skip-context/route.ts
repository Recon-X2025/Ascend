import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { track, EVENTS } from "@/lib/analytics/track";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    track(EVENTS.CONTEXT_SKIPPED, {}, { userId: session.user.id, persona: (session.user as { persona?: string }).persona ?? undefined }).catch(() => {});

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingComplete: true },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[onboarding/skip-context] POST error:", e);
    return NextResponse.json({ success: false, error: "Failed to skip context" }, { status: 500 });
  }
}
