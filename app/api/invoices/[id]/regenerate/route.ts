import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { invoicePdfQueue } from "@/lib/queues";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "PLATFORM_ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (invoice.status === "FINALISED") {
    return NextResponse.json({ success: false, error: "Cannot regenerate finalised invoice" }, { status: 400 });
  }
  if (invoice.status === "VOID") {
    return NextResponse.json({ success: false, error: "Cannot regenerate void invoice" }, { status: 400 });
  }

  await invoicePdfQueue.add("regenerate", { invoiceId: id });
  return NextResponse.json({ queued: true });
}
