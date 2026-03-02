import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { computeReadiness } from "@/lib/mentorship/readiness";
import { prisma } from "@/lib/prisma/client";
import { TargetTransitionSchema } from "@/lib/mentorship/validate";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { check, targetTransition } = await computeReadiness(session.user.id);

    return NextResponse.json({
      allGatesPassed: check.allGatesPassed,
      profileComplete: check.profileComplete,
      careerContextComplete: check.careerContextComplete,
      transitionDeclared: check.transitionDeclared,
      targetTransition: targetTransition ?? undefined,
    });
  } catch (e) {
    const err = e as Error & { code?: string };
    console.error("[mentorship/readiness] GET error:", err);
    const message =
      process.env.NODE_ENV === "development" && err?.message
        ? err.message
        : "Failed to load readiness";
    return NextResponse.json(
      { error: message, ...(process.env.NODE_ENV === "development" && { stack: err?.stack }) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TargetTransitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const now = new Date();

  await prisma.menteeReadinessCheck.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      targetFromRole: data.targetFromRole,
      targetFromIndustry: data.targetFromIndustry,
      targetToRole: data.targetToRole,
      targetToIndustry: data.targetToIndustry,
      targetCity: data.targetCity,
      targetTimelineMonths: data.targetTimelineMonths,
      updatedAt: now,
    },
    update: {
      targetFromRole: data.targetFromRole,
      targetFromIndustry: data.targetFromIndustry,
      targetToRole: data.targetToRole,
      targetToIndustry: data.targetToIndustry,
      targetCity: data.targetCity,
      targetTimelineMonths: data.targetTimelineMonths,
      updatedAt: now,
    },
  });

  const { check, targetTransition } = await computeReadiness(session.user.id);

  return NextResponse.json({
    allGatesPassed: check.allGatesPassed,
    profileComplete: check.profileComplete,
    careerContextComplete: check.careerContextComplete,
    transitionDeclared: check.transitionDeclared,
    targetTransition: targetTransition ?? undefined,
  });
}
