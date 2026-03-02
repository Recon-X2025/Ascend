import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const financialYear = searchParams.get("financialYear") ?? undefined;
  const type = searchParams.get("type") as "SUBSCRIPTION" | "MARKETPLACE_ORDER" | "MENTORSHIP_TRANCHE" | undefined;

  const where = {
    userId: session.user.id,
    ...(financialYear && { financialYear }),
    ...(type && { paymentType: type }),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lineItems: { take: 1, orderBy: { id: "asc" } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  const items = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    description: inv.lineItems[0]?.description ?? "—",
    totalPaise: inv.totalPaise,
    status: inv.status,
    pdfReady: inv.status === "FINALISED",
  }));

  return NextResponse.json({
    items,
    total,
    page,
    limit,
  });
}
