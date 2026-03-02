import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { blockIp } from "@/lib/blocklist";
import { logAdminAction } from "@/lib/admin/audit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let body: { ip?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const ip = typeof body.ip === "string" ? body.ip.trim() : null;
  if (!ip) return NextResponse.json({ success: false, error: "ip required" }, { status: 400 });

  await blockIp(ip);
  await logAdminAction({
    adminId: session.user.id,
    action: "IP_BLOCKED",
    targetType: "IP",
    targetId: ip,
    metadata: { ip },
  }).catch(() => {});

  return NextResponse.json({ success: true, ip });
}
