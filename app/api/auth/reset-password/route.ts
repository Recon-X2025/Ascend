import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma/client";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

const SALT_ROUNDS = 12;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token : null;
    if (!token) {
      return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
    }
    const parsed = resetPasswordSchema.safeParse({
      password: body.password,
      confirmPassword: body.confirmPassword,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!record || record.expires < new Date()) {
      return NextResponse.json({ success: false, error: "Link expired or invalid" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { email: record.email },
      select: { id: true },
    });
    const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { token } }),
    ]);
    try {
      const { actorIp, actorAgent } = getRequestContext(req);
      await logAudit({
        actorId: user?.id,
        actorIp: actorIp ?? undefined,
        actorAgent: actorAgent ?? undefined,
        category: "AUTH",
        action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_COMPLETED,
        severity: "WARNING",
        targetType: "User",
        targetId: user?.id ?? record.email,
      });
    } catch {
      // non-blocking
    }
    return NextResponse.json({ success: true, data: { message: "Password updated" } });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ success: false, error: "Failed to update password" }, { status: 500 });
  }
}
