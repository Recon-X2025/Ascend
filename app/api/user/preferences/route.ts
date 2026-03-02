import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { SUPPORTED_CURRENCIES } from "@/lib/i18n/currency";

const VALID_CURRENCIES = Object.keys(SUPPORTED_CURRENCIES);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredCurrency: true },
  });
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    data: {
      preferredCurrency: user.preferredCurrency,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferredCurrency: true },
  });
  if (!current) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }
  const updates: { preferredCurrency?: string } = {};
  if (typeof body.preferredCurrency === "string" && VALID_CURRENCIES.includes(body.preferredCurrency)) {
    updates.preferredCurrency = body.preferredCurrency;
  }
  if (Object.keys(updates).length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferredCurrency: true },
    });
    return NextResponse.json({ success: true, data: user });
  }
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { preferredCurrency: true },
  });
  if (updates.preferredCurrency && updates.preferredCurrency !== current.preferredCurrency) {
    trackOutcome(session.user.id, "PHASE21_CURRENCY_CHANGED", {
      metadata: { fromCurrency: current.preferredCurrency, toCurrency: updates.preferredCurrency },
    });
  }
  return NextResponse.json({ success: true, data: updated });
}
