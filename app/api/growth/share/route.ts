import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { OutcomeEventType } from "@prisma/client";
import { z } from "zod";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://ascend.careers";

const shareBodySchema = z.object({
  entityType: z.enum(["JOB", "COMPANY", "PROFILE", "SALARY_INSIGHT", "MENTOR"]),
  entityId: z.string().min(1),
  channel: z.enum(["COPY_LINK", "WHATSAPP", "LINKEDIN", "TWITTER", "EMAIL"]),
});

const UTM_MAP: Record<string, string> = {
  COPY_LINK: "copy",
  WHATSAPP: "whatsapp",
  LINKEDIN: "linkedin",
  TWITTER: "twitter",
  EMAIL: "email",
};

function buildShareUrl(entityType: string, entityId: string, channel: string): string {
  const base = BASE_URL.replace(/\/$/, "");
  const utmSource = UTM_MAP[channel] ?? channel.toLowerCase();
  const utmMedium = "share";
  const utmCampaign = `${entityType.toLowerCase()}_share`;

  switch (entityType) {
    case "JOB":
      return `${base}/jobs/${entityId}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    case "COMPANY":
      return `${base}/companies/${entityId}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    case "PROFILE":
      return `${base}/profile/${entityId}?utm_source=profile_share&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    case "SALARY_INSIGHT":
      return `${base}/salary?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    case "MENTOR":
      return `${base}/mentors/${entityId}?utm_source=mentor_share&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    default:
      return `${base}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = shareBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors?.entityType?.[0] ?? "Invalid input" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  const { entityType, entityId, channel } = parsed.data;

  await prisma.shareEvent.create({
    data: {
      userId: session?.user?.id ?? null,
      entityType,
      entityId,
      channel,
    },
  });

  if (session?.user?.id) {
    trackOutcome(session.user.id, "PHASE19_SHARE_EVENT" as OutcomeEventType, {
      entityId,
      entityType,
      metadata: { channel },
    }).catch(() => {});
  }

  const url = buildShareUrl(entityType, entityId, channel);
  return NextResponse.json({ url });
}
