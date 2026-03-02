import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { HiringVolume, RecruiterPainPoint } from "@prisma/client";

const VALID_HIRING_VOLUMES: HiringVolume[] = ["OCCASIONAL", "REGULAR", "HIGH_VOLUME"];
const VALID_PAIN_POINTS: RecruiterPainPoint[] = [
  "CANDIDATE_QUALITY",
  "TIME_TO_HIRE",
  "PIPELINE_VISIBILITY",
  "JD_WRITING",
  "SOURCING",
  "OFFER_ACCEPTANCE",
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await prisma.userRecruiterContext.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true, recruiterContext: ctx });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { hiringFor?: string[]; hiringVolume?: string; painPoints?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const hiringFor = Array.isArray(body.hiringFor)
    ? body.hiringFor.filter((x): x is string => typeof x === "string")
    : undefined;
  const hiringVolume =
    body.hiringVolume && VALID_HIRING_VOLUMES.includes(body.hiringVolume as HiringVolume)
      ? (body.hiringVolume as HiringVolume)
      : undefined;
  const painPoints = Array.isArray(body.painPoints)
    ? body.painPoints.filter((p): p is RecruiterPainPoint => VALID_PAIN_POINTS.includes(p as RecruiterPainPoint))
    : undefined;

  const updated = await prisma.userRecruiterContext.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      hiringFor: hiringFor ?? [],
      hiringVolume: hiringVolume ?? undefined,
      painPoints: painPoints ?? [],
    },
    update: {
      ...(hiringFor !== undefined && { hiringFor }),
      ...(hiringVolume !== undefined && { hiringVolume }),
      ...(painPoints !== undefined && { painPoints }),
    },
  });

  return NextResponse.json({ success: true, recruiterContext: updated });
}
