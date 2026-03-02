import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/admin/mentorship/escrow
 * PLATFORM_ADMIN only. Paginated list with filters.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const status = searchParams.get("status") as string | null;
  const contractId = searchParams.get("contractId");

  const where: Prisma.MentorshipEscrowWhereInput = {};
  if (status) {
    if (status.includes(",")) {
      const vals = status.split(",").map((s) => s.trim()) as ("PENDING_PAYMENT" | "FUNDED" | "TERMINATED" | "VOIDED")[];
      where.status = { in: vals };
    } else {
      where.status = status as "PENDING_PAYMENT" | "FUNDED" | "TERMINATED" | "VOIDED";
    }
  }
  if (contractId) where.contractId = contractId;

  const [items, total] = await Promise.all([
    prisma.mentorshipEscrow.findMany({
      where,
      include: {
        contract: { select: { id: true, status: true, engagementType: true } },
        mentor: { select: { id: true, name: true, email: true } },
        mentee: { select: { id: true, name: true, email: true } },
        tranches: { orderBy: { trancheNumber: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.mentorshipEscrow.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((e) => ({
      id: e.id,
      contractId: e.contractId,
      status: e.status,
      totalAmountPaise: e.totalAmountPaise,
      razorpayOrderId: e.razorpayOrderId,
      fundedAt: e.fundedAt,
      mentor: e.mentor,
      mentee: e.mentee,
      contract: e.contract,
      tranches: e.tranches,
    })),
    total,
    page,
    limit,
  });
}
