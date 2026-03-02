import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
  }
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ success: false, error: "Link expired or invalid" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
    select: { id: true },
  });
  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: { token },
    }),
  ]);
  try {
    const { actorIp, actorAgent } = getRequestContext(req);
    await logAudit({
      actorId: user?.id,
      actorIp: actorIp ?? undefined,
      actorAgent: actorAgent ?? undefined,
      category: "AUTH",
      action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFIED,
      severity: "INFO",
      targetType: "User",
      targetId: user?.id ?? record.identifier,
    });
  } catch {
    // non-blocking
  }
  return NextResponse.json({ success: true, data: { message: "Email verified" } });
}
