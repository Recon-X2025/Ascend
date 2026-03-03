import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { denyAllUserTokens } from "@/lib/auth/denylist";
import bcrypt from "bcryptjs";
import { z } from "zod";

const postSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Validation failed";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return NextResponse.json(
      { success: false, error: "You do not have a password set. Sign in with your connected account." },
      { status: 400 }
    );
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: hashed },
  });
  await denyAllUserTokens(session.user.id);

  return NextResponse.json({ success: true, message: "Password updated. Please sign in again." });
}
