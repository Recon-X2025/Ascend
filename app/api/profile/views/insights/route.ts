import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { getProfileViewInsights } from "@/lib/profile-views";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
  }
  try {
    const insights = await getProfileViewInsights(session.user.id);
    return NextResponse.json({ success: true, data: insights });
  } catch (e) {
    console.error("[profile/views/insights] GET error:", e);
    return NextResponse.json({ success: false, error: "Failed to load insights" }, { status: 500 });
  }
}
