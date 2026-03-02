import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getFinancialYear } from "@/lib/invoice/config";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const userId = searchParams.get("userId") ?? undefined;
  const financialYear = searchParams.get("financialYear") ?? undefined;
  const type = searchParams.get("type") as "SUBSCRIPTION" | "MARKETPLACE_ORDER" | "MENTORSHIP_TRANCHE" | undefined;
  const status = searchParams.get("status") as "DRAFT" | "FINALISED" | "VOID" | undefined;
  const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
  const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;
  const csv = searchParams.get("csv") === "1";

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (dateFrom) dateFilter.gte = dateFrom;
  if (dateTo) dateFilter.lte = dateTo;

  const where = {
    ...(userId && { userId }),
    ...(financialYear && { financialYear }),
    ...(type && { paymentType: type }),
    ...(status && { status }),
    ...(Object.keys(dateFilter).length > 0 && { invoiceDate: dateFilter }),
  };

  const fy = financialYear ?? getFinancialYear(new Date());

  if (csv) {
    const invoices = await prisma.invoice.findMany({
      where: { ...where, financialYear: fy },
      orderBy: { invoiceDate: "asc" },
      include: { user: { select: { name: true, email: true } }, lineItems: { take: 1 } },
    });
    const rows = invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      date: inv.invoiceDate.toISOString().slice(0, 10),
      buyerName: inv.payerName,
      buyerGSTIN: inv.payerGstin ?? "",
      buyerState: inv.payerStateCode ?? "",
      subtotal: inv.subtotalPaise / 100,
      cgst: inv.cgstPaise / 100,
      sgst: inv.sgstPaise / 100,
      igst: inv.igstPaise / 100,
      total: inv.totalPaise / 100,
      paymentType: inv.paymentType,
    }));
    const header = "invoiceNumber,date,buyerName,buyerGSTIN,buyerState,subtotal,cgst,sgst,igst,total,paymentType\n";
    const body = rows
      .map((r) =>
        [
          r.invoiceNumber,
          r.date,
          `"${(r.buyerName ?? "").replace(/"/g, '""')}"`,
          r.buyerGSTIN,
          r.buyerState,
          r.subtotal,
          r.cgst,
          r.sgst,
          r.igst,
          r.total,
          r.paymentType,
        ].join(",")
      )
      .join("\n");
    return new NextResponse(header + body, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="gst-invoices-${fy}.csv"`,
      },
    });
  }

  const [invoices, total, aggregates] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } }, lineItems: { take: 1 } },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where: { ...where, status: { not: "VOID" } },
      _sum: {
        subtotalPaise: true,
        cgstPaise: true,
        sgstPaise: true,
        igstPaise: true,
        totalPaise: true,
      },
    }),
  ]);

  return NextResponse.json({
    items: invoices,
    total,
    page,
    limit,
    totals: aggregates._sum
      ? {
          totalRevenuePaise: aggregates._sum.subtotalPaise ?? 0,
          totalGstPaise:
            (aggregates._sum.cgstPaise ?? 0) +
            (aggregates._sum.sgstPaise ?? 0) +
            (aggregates._sum.igstPaise ?? 0),
          cgstPaise: aggregates._sum.cgstPaise ?? 0,
          sgstPaise: aggregates._sum.sgstPaise ?? 0,
          igstPaise: aggregates._sum.igstPaise ?? 0,
        }
      : null,
  });
}
