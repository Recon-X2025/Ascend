import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
    select: {
      id: true,
      key: true,
      enabled: true,
      description: true,
      updatedAt: true,
      updatedBy: { select: { name: true, email: true } },
    },
  });

  const list = flags.map((f) => ({
    id: f.id,
    key: f.key,
    enabled: f.enabled,
    description: f.description,
    updatedAt: f.updatedAt,
    updatedByName: f.updatedBy?.name ?? f.updatedBy?.email ?? null,
  }));

  return NextResponse.json({ flags: list });
}
