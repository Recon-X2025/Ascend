import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { z } from "zod";
import type { ProviderType } from "@prisma/client";

const bodySchema = z.object({
  type: z.enum(["RESUME_REVIEWER", "MOCK_INTERVIEWER", "CAREER_COACH"]),
  bio: z.string().min(1).max(500),
  specialisations: z.array(z.string()).min(1).max(20),
  languages: z.array(z.string()).min(1).max(10),
  pricePerSession: z.number().int().positive(),
  currency: z.enum(["INR", "USD"]).default("INR"),
  turnaroundHours: z.number().int().positive().optional(),
  calendarUrl: z.string().url().optional().or(z.literal("")),
  linkedInUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.marketplaceProvider.findUnique({
    where: { userId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have a provider profile. Use PATCH /api/marketplace/providers/me to update." },
      { status: 409 }
    );
  }

  const { type, bio, specialisations, languages, pricePerSession, currency, turnaroundHours, calendarUrl } =
    parsed.data;
  const provider = await prisma.marketplaceProvider.create({
    data: {
      userId,
      type: type as ProviderType,
      status: "PENDING_REVIEW",
      bio,
      specialisations,
      languages,
      pricePerSession,
      currency,
      turnaroundHours: turnaroundHours ?? null,
      calendarUrl: calendarUrl || null,
    },
  });

  await trackOutcome(userId, "PHASE22_PROVIDER_APPLIED", {
    entityId: provider.id,
    entityType: "MarketplaceProvider",
    metadata: { providerType: type },
  });

  return NextResponse.json({ provider: { id: provider.id, status: provider.status, type: provider.type } });
}
