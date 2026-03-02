import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { availabilityWindowsPutSchema } from "@/lib/mentorship/profile";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = availabilityWindowsPutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json(
      { error: "Mentor profile not found" },
      { status: 404 }
    );
  }

  await prisma.$transaction([
    prisma.availabilityWindow.deleteMany({
      where: { mentorProfileId: profile.id },
    }),
    prisma.availabilityWindow.createMany({
      data: parsed.data.windows.map((w) => ({
        mentorProfileId: profile.id,
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
      })),
    }),
  ]);

  const windows = await prisma.availabilityWindow.findMany({
    where: { mentorProfileId: profile.id },
  });

  return NextResponse.json({ windows });
}
