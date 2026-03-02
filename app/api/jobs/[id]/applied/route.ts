import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ applied: false });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "JOB_SEEKER") {
    return NextResponse.json({ applied: false });
  }

  const id = parseId((await params).id);
  if (id == null) {
    return NextResponse.json({ applied: false });
  }

  const app = await prisma.jobApplication.findUnique({
    where: {
      jobPostId_applicantId: { jobPostId: id, applicantId: session.user.id },
    },
    select: { id: true, status: true },
  });

  if (!app) {
    return NextResponse.json({ applied: false });
  }
  return NextResponse.json({
    applied: true,
    applicationId: app.id,
    status: app.status,
  });
}
