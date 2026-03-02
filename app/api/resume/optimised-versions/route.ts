import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const versions = await prisma.resumeVersion.findMany({
    where: {
      userId,
      jobPostId: { not: null },
    },
    include: {
      jobPost: {
        select: {
          id: true,
          title: true,
          slug: true,
          companyName: true,
          companyId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ versions });
}
