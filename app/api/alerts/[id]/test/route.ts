import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { processAlertById } from "@/lib/alerts/processor";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const alert = await prisma.jobAlert.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!alert) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  const { sent, error } = await processAlertById(id);
  return NextResponse.json({
    success: sent,
    data: { sent, message: sent ? "Test email sent." : error ?? "No jobs to send." },
  });
}
