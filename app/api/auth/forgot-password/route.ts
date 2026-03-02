import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import { generateToken } from "@/lib/auth/tokens";
import { forgotPasswordSchema } from "@/lib/validations/auth";

const RESET_EXPIRY_HOURS = 1;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = generateToken();
      const expires = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);
      await prisma.passwordResetToken.deleteMany({ where: { email } });
      await prisma.passwordResetToken.create({
        data: { email, token, expires },
      });
      await sendPasswordResetEmail(email, token);
    }
    return NextResponse.json({
      success: true,
      data: { message: "If this email exists, we've sent a reset link" },
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
