import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { OutcomeEventType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  eventType: z.nativeEnum(OutcomeEventType),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid event" }, { status: 400 });
  }

  await trackOutcome(session.user.id, parsed.data.eventType, {
    entityId: parsed.data.entityId,
    entityType: parsed.data.entityType,
    metadata: parsed.data.metadata,
  });

  return NextResponse.json({ success: true });
}
