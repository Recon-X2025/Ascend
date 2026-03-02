import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendVerificationEmail } from "@/lib/email/resend";
import { generateToken } from "@/lib/auth/tokens";
import { checkResendVerificationRateLimit } from "@/lib/redis/ratelimit";

const VERIFICATION_EXPIRY_HOURS = 24;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : null;
    if (!email) {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }
    const allowed = await checkResendVerificationRateLimit(email);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Please wait 1 minute before requesting another email" },
        { status: 429 }
      );
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true, data: { message: "If this email exists, we sent a verification link" } });
    }
    if (user.emailVerified) {
      return NextResponse.json({ success: true, data: { message: "Email already verified" } });
    }
    const token = generateToken();
    const expires = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });
    await sendVerificationEmail(email, token);
    return NextResponse.json({ success: true, data: { message: "Verification email sent" } });
  } catch (err) {
    console.error("Resend verification error:", err);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
