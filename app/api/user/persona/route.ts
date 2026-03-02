import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { track, EVENTS } from "@/lib/analytics/track";
import type { UserPersona } from "@prisma/client";

const VALID_PERSONAS: UserPersona[] = [
  "ACTIVE_SEEKER",
  "PASSIVE_SEEKER",
  "EARLY_CAREER",
  "RECRUITER",
];

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { persona?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const persona = body.persona;
  if (!persona || typeof persona !== "string" || !VALID_PERSONAS.includes(persona as UserPersona)) {
    return NextResponse.json(
      { success: false, error: "Invalid persona. Must be one of: ACTIVE_SEEKER, PASSIVE_SEEKER, EARLY_CAREER, RECRUITER" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      persona: persona as UserPersona,
      personaSetAt: new Date(),
    },
  });

  track(EVENTS.PERSONA_SELECTED, { persona }, { userId: session.user.id, persona: persona as UserPersona }).catch(() => {});

  return NextResponse.json({ success: true, persona });
}
