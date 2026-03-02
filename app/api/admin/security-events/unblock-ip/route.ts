import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { unblockIp } from "@/lib/blocklist";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { ip?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ip = typeof body.ip === "string" ? body.ip.trim() : null;
  if (!ip) return NextResponse.json({ error: "ip required" }, { status: 400 });

  await unblockIp(ip);
  return NextResponse.json({ success: true, ip });
}
