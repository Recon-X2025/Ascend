import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.companyAdmin.findFirst({
    where: { userId: session.user.id },
    include: { company: { include: { careersPageConfig: true } } },
  });
  if (!admin) {
    return NextResponse.json({ success: false, error: "Not a company admin" }, { status: 403 });
  }

  const config = admin.company.careersPageConfig;
  return NextResponse.json({
    success: true,
    data: config
      ? {
          ...config,
          companySlug: admin.company.slug,
        }
      : { companySlug: admin.company.slug, heroTitle: "", heroSubtitle: "" },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.companyAdmin.findFirst({
    where: { userId: session.user.id },
    include: { company: true },
  });
  if (!admin) {
    return NextResponse.json({ success: false, error: "Not a company admin" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.heroTitle === "string") updates.heroTitle = body.heroTitle;
  if (typeof body.heroSubtitle === "string") updates.heroSubtitle = body.heroSubtitle;

  const config = await prisma.careersPageConfig.upsert({
    where: { companyId: admin.companyId },
    create: {
      companyId: admin.companyId,
      heroTitle: (updates.heroTitle as string) ?? "",
      heroSubtitle: (updates.heroSubtitle as string) ?? "",
    },
    update: updates,
  });

  return NextResponse.json({ success: true, data: config });
}
