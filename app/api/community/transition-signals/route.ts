/**
 * BL-4: Transition Community Signals — aggregate counts for "X people on the same path."
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getTransitionPathCount, getTransitionPathFromContext } from "@/lib/community/transition-signals";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pathParam = searchParams.get("path");

  let path: string | null = pathParam;

  if (!path) {
    const context = await prisma.userCareerContext.findUnique({
      where: { userId: session.user.id },
      select: { currentRole: true, targetRole: true },
    });
    path = getTransitionPathFromContext(
      context?.currentRole ?? null,
      context?.targetRole ?? null
    );
  }

  if (!path) {
    return NextResponse.json({
      success: true,
      data: { hasPath: false, count: 0, rounded: 0, pathLabel: null, completions: 0 },
    });
  }

  const result = await getTransitionPathCount(path);
  return NextResponse.json({
    success: true,
    data: {
      hasPath: true,
      pathLabel: result.pathLabel,
      count: result.count,
      rounded: result.rounded,
      completions: result.completions,
    },
  });
}
