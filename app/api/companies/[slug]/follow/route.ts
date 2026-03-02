import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

type Params = { params: Promise<{ slug: string }> };

async function getCompanyId(slug: string): Promise<string | null> {
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true },
  });
  return company?.id ?? null;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { slug } = await params;
  const companyId = await getCompanyId(slug);
  if (!companyId) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const followerCount = await prisma.companyFollow.count({
    where: { companyId },
  });

  if (!session?.user?.id) {
    return NextResponse.json({
      success: true,
      data: { following: false, followerCount },
    });
  }

  const follow = await prisma.companyFollow.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  });

  return NextResponse.json({
    success: true,
    data: { following: !!follow, followerCount },
  });
}

export async function POST(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const companyId = await getCompanyId(slug);
  if (!companyId) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const existing = await prisma.companyFollow.findUnique({
    where: { userId_companyId: { userId: session.user.id, companyId } },
  });

  if (existing) {
    await prisma.companyFollow.delete({
      where: { userId_companyId: { userId: session.user.id, companyId } },
    });
    const followerCount = await prisma.companyFollow.count({ where: { companyId } });
    return NextResponse.json({
      success: true,
      data: { following: false, followerCount },
    });
  }

  await prisma.companyFollow.create({
    data: { userId: session.user.id, companyId },
  });
  const followerCount = await prisma.companyFollow.count({ where: { companyId } });
  return NextResponse.json({
    success: true,
    data: { following: true, followerCount },
  });
}
