import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit } from "@/lib/redis/ratelimit";
import { sendRecruiterInviteEmail } from "@/lib/email/growth";
import { generateReferralCode, trackReferralClick } from "@/lib/growth/referral";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { OutcomeEventType } from "@prisma/client";
import { z } from "zod";

const MAX_INVITES_PER_DAY = 10;
const DAY_SECONDS = 24 * 60 * 60;

const bodySchema = z.object({
  emails: z.string().min(1), // comma-separated
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://ascend.careers";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "RECRUITER" && role !== "COMPANY_ADMIN") {
    return NextResponse.json({ error: "Only recruiters can invite teammates" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "emails required" }, { status: 400 });
  }

  const emails = parsed.data.emails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (emails.length === 0) {
    return NextResponse.json({ error: "At least one valid email required" }, { status: 400 });
  }
  if (emails.length > 10) {
    return NextResponse.json({ error: "Maximum 10 invites at a time" }, { status: 400 });
  }

  const { success, remaining } = await rateLimit(
    `recruiter-invite:${session.user.id}`,
    MAX_INVITES_PER_DAY,
    DAY_SECONDS
  );
  if (!success) {
    return NextResponse.json(
      { error: "You have reached the daily invite limit (10). Try again tomorrow." },
      { status: 429 }
    );
  }
  if (emails.length > remaining) {
    return NextResponse.json(
      { error: `You can send at most ${remaining} more invite(s) today.` },
      { status: 429 }
    );
  }

  const code = await generateReferralCode(session.user.id);
  const referrer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  const inviterName = referrer?.name ?? "A colleague";
  const joinUrl = `${BASE_URL.replace(/\/$/, "")}/join?ref=${code}`;

  const results: { email: string; sent: boolean }[] = [];
  for (const email of emails) {
    try {
      const sessionId = `invite-${session.user.id}-${email}-${Date.now()}`;
      await trackReferralClick(code, sessionId, email);
      await sendRecruiterInviteEmail({
        to: email,
        inviterName,
        joinUrl,
      });
      results.push({ email, sent: true });
      trackOutcome(session.user.id, "PHASE19_RECRUITER_INVITE_SENT" as OutcomeEventType, {
        entityId: email,
        metadata: { email },
      }).catch(() => {});
    } catch {
      results.push({ email, sent: false });
    }
  }

  return NextResponse.json({
    success: true,
    sent: results.filter((r) => r.sent).length,
    results,
  });
}
