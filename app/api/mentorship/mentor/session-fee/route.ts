/**
 * PATCH /api/mentorship/mentor/session-fee
 * Mentor only. Set session fee (validated against floor/ceiling).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { setSessionFee } from "@/lib/mentorship/monetisation";
import { z } from "zod";

const bodySchema = z.object({
  feePaise: z.number().int().min(0),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Mentor profile required" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: e }, { status: 400 });
  }

  const result = await setSessionFee(session.user.id, body.feePaise);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, sessionFeePaise: body.feePaise });
}
