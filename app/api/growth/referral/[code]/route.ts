import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { trackReferralClick } from "@/lib/growth/referral";
import { randomUUID } from "crypto";

const REF_SID = "ref_sid";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const codeTrimmed = code?.trim();
  if (!codeTrimmed) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const { searchParams } = new URL(_req.url);
  const referredEmail = searchParams.get("email")?.trim() || null;

  let sessionId: string;
  const cookieStore = await cookies();
  const existing = cookieStore.get(REF_SID)?.value;
  if (existing) {
    sessionId = existing;
  } else {
    sessionId = randomUUID();
    cookieStore.set(REF_SID, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  const result = await trackReferralClick(codeTrimmed, sessionId, referredEmail);

  if (!result) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    referrerName: result.referrerFirstName,
  });
}
