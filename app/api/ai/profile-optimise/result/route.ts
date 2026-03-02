import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { isEnabled } from "@/lib/feature-flags";
import { canUseFeature } from "@/lib/payments/gate";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isEnabled("profile_optimiser"))) {
      return NextResponse.json({ result: null });
    }

    const result = await prisma.profileOptimiserResult.findUnique({
      where: { userId: session.user.id },
      select: {
        result: true,
        analysedAt: true,
        promptVersion: true,
      },
    });

    if (!result) {
      return NextResponse.json({ result: null });
    }

    const { allowed: premiumAllowed } = await canUseFeature(session.user.id, "profileOptimiser");
    const raw = result.result as {
      headline?: unknown;
      summary?: unknown;
      skillGaps?: unknown[];
      bulletSuggestions?: unknown[];
    };
    const freeResult = {
      headline: raw?.headline ?? null,
      summary: raw?.summary ?? null,
      skillGaps: premiumAllowed ? (raw?.skillGaps ?? []) : [],
      bulletSuggestions: premiumAllowed ? (raw?.bulletSuggestions ?? []) : [],
    };

    return NextResponse.json({
      result: freeResult,
      analysedAt: result.analysedAt.toISOString(),
      promptVersion: result.promptVersion,
      premiumUnlocked: premiumAllowed,
    });
  } catch (e) {
    console.error("[ai/profile-optimise/result] GET error:", e);
    return NextResponse.json({ result: null });
  }
}
