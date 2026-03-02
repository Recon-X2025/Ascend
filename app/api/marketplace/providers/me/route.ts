import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.marketplaceProvider.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, image: true, email: true } },
    },
  });
  if (!provider) return NextResponse.json({ provider: null });

  return NextResponse.json({
    provider: {
      id: provider.id,
      type: provider.type,
      status: provider.status,
      bio: provider.bio,
      specialisations: provider.specialisations,
      languages: provider.languages,
      pricePerSession: provider.pricePerSession,
      currency: provider.currency,
      avgRating: provider.avgRating,
      totalReviews: provider.totalReviews,
      totalSessions: provider.totalSessions,
      isAvailable: provider.isAvailable,
      turnaroundHours: provider.turnaroundHours,
      calendarUrl: provider.calendarUrl,
      approvedAt: provider.approvedAt?.toISOString() ?? null,
      suspendedAt: provider.suspendedAt?.toISOString() ?? null,
      createdAt: provider.createdAt.toISOString(),
      user: provider.user,
    },
  });
}

const patchSchema = z.object({
  bio: z.string().min(1).max(500).optional(),
  specialisations: z.array(z.string()).min(1).max(20).optional(),
  languages: z.array(z.string()).min(1).max(10).optional(),
  pricePerSession: z.number().int().positive().optional(),
  currency: z.enum(["INR", "USD"]).optional(),
  isAvailable: z.boolean().optional(),
  turnaroundHours: z.number().int().positive().nullable().optional(),
  calendarUrl: z.string().url().nullable().or(z.literal("")).optional(),
});

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = await prisma.marketplaceProvider.findUnique({
    where: { userId },
  });
  if (!provider) return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
  if (provider.status === "SUSPENDED") {
    return NextResponse.json({ error: "Your provider account is suspended" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const d = parsed.data;
  const updated = await prisma.marketplaceProvider.update({
    where: { userId },
    data: {
      ...(d.bio !== undefined && { bio: d.bio }),
      ...(d.specialisations !== undefined && { specialisations: d.specialisations }),
      ...(d.languages !== undefined && { languages: d.languages }),
      ...(d.pricePerSession !== undefined && { pricePerSession: d.pricePerSession }),
      ...(d.currency !== undefined && { currency: d.currency }),
      ...(d.isAvailable !== undefined && { isAvailable: d.isAvailable }),
      ...(d.turnaroundHours !== undefined && { turnaroundHours: d.turnaroundHours }),
      ...(d.calendarUrl !== undefined && { calendarUrl: d.calendarUrl === "" ? null : d.calendarUrl }),
    },
  });

  return NextResponse.json({
    provider: {
      id: updated.id,
      status: updated.status,
      bio: updated.bio,
      specialisations: updated.specialisations,
      languages: updated.languages,
      pricePerSession: updated.pricePerSession,
      currency: updated.currency,
      isAvailable: updated.isAvailable,
      turnaroundHours: updated.turnaroundHours,
      calendarUrl: updated.calendarUrl,
    },
  });
}
