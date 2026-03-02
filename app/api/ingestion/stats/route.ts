import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalRaw,
    parsedCount,
    embeddedCount,
    salarySignalCount,
    topRoles,
    topSources,
  ] = await Promise.all([
    prisma.rawJD.count(),
    prisma.parsedJD.count(),
    prisma.jDEmbedding.count(),
    prisma.jDSalarySignal.count(),
    prisma.parsedJD.groupBy({
      by: ["title"],
      _count: { title: true },
      orderBy: { _count: { title: "desc" } },
      take: 20,
    }),
    prisma.rawJD.groupBy({
      by: ["source"],
      _count: { source: true },
      orderBy: { _count: { source: "desc" } },
    }),
  ]);

  return NextResponse.json({
    totalRaw,
    parsedCount,
    embeddedCount,
    salarySignalCount,
    unparsed: totalRaw - parsedCount,
    unembedded: parsedCount - embeddedCount,
    topRoles: topRoles.map((r) => ({ title: r.title, count: r._count.title })),
    topSources: topSources.map((s) => ({ source: s.source, count: s._count.source })),
  });
}
