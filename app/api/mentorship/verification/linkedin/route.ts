import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getMentorProfileOrThrow } from "@/lib/mentorship/verification-helpers";

const LINKEDIN_PATTERN =
  /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i;
const MAX_LENGTH = 200;

export async function PATCH(req: Request) {
  let mentorProfileId: string;
  try {
    const profile = await getMentorProfileOrThrow();
    mentorProfileId = profile.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Mentor profile required" },
      { status: 403 }
    );
  }

  let body: { linkedInUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const linkedInUrl =
    typeof body.linkedInUrl === "string" ? body.linkedInUrl.trim() : "";
  if (linkedInUrl.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: "LinkedIn URL must be at most 200 characters" },
      { status: 400 }
    );
  }
  if (linkedInUrl && !LINKEDIN_PATTERN.test(linkedInUrl)) {
    return NextResponse.json(
      {
        error:
          "LinkedIn URL must match https://linkedin.com/in/username or https://www.linkedin.com/in/username",
      },
      { status: 400 }
    );
  }

  let verification = await prisma.mentorVerification.findUnique({
    where: { mentorProfileId },
  });
  if (!verification) {
    verification = await prisma.mentorVerification.create({
      data: {
        mentorProfileId,
        status: "UNVERIFIED",
        linkedInUrl: linkedInUrl || null,
      },
    });
  } else {
    await prisma.mentorVerification.update({
      where: { mentorProfileId },
      data: { linkedInUrl: linkedInUrl || null },
    });
  }

  return NextResponse.json({ saved: true });
}
