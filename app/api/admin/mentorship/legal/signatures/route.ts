import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { LegalDocumentType } from "@prisma/client";

const VALID_TYPES: LegalDocumentType[] = [
  "MENTORSHIP_MARKETPLACE_ADDENDUM",
  "MENTOR_CONDUCT_AGREEMENT",
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim() || undefined;
  const type = searchParams.get("type") as LegalDocumentType | null;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (type && VALID_TYPES.includes(type)) where.document = { type };
  if (from || to) {
    where.signedAt = {};
    if (from) (where.signedAt as Record<string, Date>).gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      (where.signedAt as Record<string, Date>).lte = toDate;
    }
  }

  const signatures = await prisma.legalDocumentSignature.findMany({
    where,
    include: {
      document: { select: { type: true, version: true, title: true } },
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { signedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    items: signatures.map((s) => ({
      id: s.id,
      documentId: s.documentId,
      type: s.document.type,
      version: s.document.version,
      title: s.document.title,
      userId: s.userId,
      userEmail: s.user.email,
      userName: s.user.name,
      signedAt: s.signedAt.toISOString(),
      ipAddress: s.ipAddress,
    })),
  });
}
