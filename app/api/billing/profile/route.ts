import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const putSchema = z.object({
  legalName: z.string().min(1).max(200).optional(),
  billingAddress: z.string().max(500).optional(),
  gstin: z.union([z.string().regex(GSTIN_REGEX), z.literal("")]).optional(),
  stateCode: z.string().length(2).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.billingProfile.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json(profile ?? null);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const parsed = putSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });

  const { legalName, billingAddress, gstin, stateCode } = parsed.data;
  const hasGstin = !!(gstin && gstin !== "");
  const derivedStateCode = hasGstin ? gstin.slice(0, 2) : stateCode ?? null;

  const profile = await prisma.billingProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      legalName: legalName ?? null,
      billingAddress: billingAddress ?? null,
      gstin: hasGstin ? gstin : null,
      stateCode: derivedStateCode,
      gstinVerified: false,
    },
    update: {
      ...(legalName !== undefined && { legalName: legalName || null }),
      ...(billingAddress !== undefined && { billingAddress: billingAddress || null }),
      ...(gstin !== undefined && {
        gstin: hasGstin ? gstin : null,
        gstinVerified: false,
      }),
      stateCode: derivedStateCode ?? undefined,
    },
  });

  const { trackOutcome } = await import("@/lib/tracking/outcomes");
  trackOutcome(session.user.id, "BILLING_PROFILE_UPDATED", {
    entityId: profile.id,
    entityType: "BillingProfile",
    metadata: { hasGstin },
  }).catch(() => {});

  return NextResponse.json(profile);
}
