import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { rateAIInteraction } from "@/lib/tracking/outcomes";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  interactionId: z.string(),
  rating: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  await rateAIInteraction(parsed.data.interactionId, parsed.data.rating);
  return NextResponse.json({ success: true });
}
