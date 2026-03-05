/**
 * BL-9: POST join cohort.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { joinCohort } from "@/lib/cohorts";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const cohort = await prisma.cohort.findUnique({ where: { slug } });
  if (!cohort) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  await joinCohort(cohort.id, session.user.id);
  return NextResponse.json({ success: true });
}
