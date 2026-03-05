/**
 * BL-3: POST create success story, GET list eligible outcomes.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import {
  createSuccessStory,
  getMyEligibleOutcomes,
} from "@/lib/mentorship/success-stories";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const outcomeId = typeof body.outcomeId === "string" ? body.outcomeId.trim() : null;
  const includeEmployer = body.includeEmployer === true;

  if (!outcomeId) {
    return NextResponse.json(
      { success: false, error: "outcomeId required" },
      { status: 400 }
    );
  }

  const result = await createSuccessStory(outcomeId, session.user.id, includeEmployer);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error ?? "Failed" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const shareUrl = `${baseUrl}/stories/${result.slug}`;
  return NextResponse.json({
    success: true,
    slug: result.slug,
    shareUrl,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const outcomes = await getMyEligibleOutcomes(session.user.id);
  return NextResponse.json({ success: true, data: outcomes });
}
