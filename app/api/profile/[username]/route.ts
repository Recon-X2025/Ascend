import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { profileInclude } from "@/lib/profile/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const currentUserId = await getSessionUserId();
  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { username: username.trim().toLowerCase() },
    include: {
      ...profileInclude,
      user: { select: { name: true, image: true } },
    },
  });
  if (!profile) {
    return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
  }
  const isOwner = currentUserId === profile.userId;
  if (profile.visibility === "PRIVATE" && !isOwner) {
    return NextResponse.json({
      success: true,
      data: { profile: null, visibility: "PRIVATE", message: "This profile is private" },
    });
  }
  if (
    (profile.visibility === "CONNECTIONS_ONLY" || profile.visibility === "RECRUITERS_ONLY") &&
    !isOwner
  ) {
    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          username: profile.username,
          headline: profile.headline,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          visibility: profile.visibility,
          user: profile.user,
        },
        visibility: profile.visibility,
        message: `This profile is only visible to ${profile.visibility === "RECRUITERS_ONLY" ? "recruiters" : "connections"}.`,
      },
    });
  }
  return NextResponse.json({
    success: true,
    data: { profile, isOwner },
  });
}
