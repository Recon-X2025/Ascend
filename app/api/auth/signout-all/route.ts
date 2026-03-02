import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { denyAllUserTokens } from "@/lib/auth/denylist";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  await denyAllUserTokens(session.user.id);
  return NextResponse.json({
    success: true,
    message: "All sessions have been invalidated",
  });
}
