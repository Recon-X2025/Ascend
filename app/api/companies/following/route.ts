import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const follows = await prisma.companyFollow.findMany({
    where: { userId: session.user.id },
    include: { company: { select: { id: true, slug: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const data = follows.map((f) => ({
    id: f.company.id,
    slug: f.company.slug,
    name: f.company.name,
  }));

  return NextResponse.json({ success: true, data });
}
