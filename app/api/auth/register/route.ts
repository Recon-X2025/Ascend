import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { track, EVENTS } from "@/lib/analytics/track";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma/client";
import { resend, sendVerificationEmail } from "@/lib/email/resend";
import { generateToken } from "@/lib/auth/tokens";
import { registerSchema } from "@/lib/validations/auth";
import { isEnabled } from "@/lib/feature-flags";
import { generateReferralCode, attributeReferral } from "@/lib/growth/referral";

const SALT_ROUNDS = 12;
const VERIFICATION_EXPIRY_HOURS = 24;

/** Bypass email verification until email sending is configured. Set SKIP_VERIFICATION_EMAIL=false (with RESEND_API_KEY) to re-enable. */
const skipVerificationEmail =
  process.env.SKIP_VERIFICATION_EMAIL !== "false";

export const maxDuration = 30;

/** OPTIONS for CORS preflight */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: "POST" } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const msg =
        fieldErrors.name?.[0] ??
        fieldErrors.email?.[0] ??
        fieldErrors.password?.[0] ??
        fieldErrors.confirmPassword?.[0] ??
        fieldErrors.agreeTerms?.[0] ??
        "Invalid input";
      return NextResponse.json(
        { success: false, error: typeof msg === "string" ? msg : "Invalid input" },
        { status: 400 }
      );
    }
    const { name, email, password, marketingConsent } = parsed.data;

    // Allow registration if SEEKER_PILOT_OPEN env is set first (no DB), else check feature flag
    const envOpen = process.env.SEEKER_PILOT_OPEN === "true" || process.env.SEEKER_PILOT_OPEN === "1";
    const flagOpen = envOpen ? true : await isEnabled("seeker_pilot_open");
    if (!flagOpen && !envOpen) {
      return NextResponse.json(
        { success: false, error: "Ascend is currently in private beta. Check back soon." },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date();

    if (skipVerificationEmail) {
      // No email config (or SKIP_VERIFICATION_EMAIL): create user as already verified so you can log in immediately.
      await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          emailVerified: now,
          termsAcceptedAt: now,
          marketingConsent: marketingConsent ?? false,
        },
      });
      const newUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (newUser) {
        generateReferralCode(newUser.id).catch(() => {});
        const cookieStore = await cookies();
        const refSid = cookieStore.get("ref_sid")?.value;
        if (refSid) void attributeReferral(newUser.id, refSid);
      }
      return NextResponse.json({
        success: true,
        data: { message: "Account created. You can sign in now.", verificationSkipped: true },
      });
    }

    const token = generateToken();
    const expires = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          termsAcceptedAt: now,
          marketingConsent: marketingConsent ?? false,
        },
      }),
    ]);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not created");

    generateReferralCode(user.id).catch(() => {});
    const cookieStore = await cookies();
    const refSid = cookieStore.get("ref_sid")?.value;
    if (refSid) void attributeReferral(user.id, refSid);

    track(EVENTS.USER_REGISTERED, {}, { userId: user.id }).catch(() => {});

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    if (resend) {
      await sendVerificationEmail(email, token);
    } else {
      return NextResponse.json(
        { success: false, error: "Email is not configured. Set RESEND_API_KEY or SKIP_VERIFICATION_EMAIL=true for local testing." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Verification email sent" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Register error:", err);
    return NextResponse.json(
      { success: false, error: "Registration failed", debug: process.env.NODE_ENV === "development" ? msg : undefined },
      { status: 500 }
    );
  }
}
