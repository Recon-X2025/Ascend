import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const docs = await prisma.legalDocument.findMany({
    where: { isActive: true },
    include: { _count: { select: { signatures: true } } },
    orderBy: { type: "asc" },
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const withStats = await Promise.all(
    docs.map(async (d) => {
      const signedLast7 = await prisma.legalDocumentSignature.count({
        where: { documentId: d.id, signedAt: { gte: sevenDaysAgo } },
      });
      return {
        id: d.id,
        type: d.type,
        version: d.version,
        title: d.title,
        effectiveAt: d.effectiveAt.toISOString(),
        totalSignatures: d._count?.signatures ?? 0,
        signedLast7Days: signedLast7,
      };
    })
  );

  return NextResponse.json({ documents: withStats });
}