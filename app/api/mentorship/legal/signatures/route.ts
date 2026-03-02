import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signatures = await prisma.legalDocumentSignature.findMany({
    where: { userId: session.user.id },
    include: {
      document: { select: { id: true, type: true, version: true, title: true } },
    },
    orderBy: { signedAt: "desc" },
  });

  return NextResponse.json({
    items: signatures.map((s) => ({
      id: s.id,
      documentId: s.documentId,
      type: s.document.type,
      version: s.document.version,
      title: s.document.title,
      signedAt: s.signedAt.toISOString(),
    })),
  });
}
