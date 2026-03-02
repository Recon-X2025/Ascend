import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getProfileOrThrow } from "@/lib/profile/api-helpers";
import { getFileUrl } from "@/lib/storage";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

async function auth() {
  const { getSessionUserId } = await import("@/lib/profile/api-helpers");
  return getSessionUserId();
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await getProfileOrThrow(userId);
  const resume = await prisma.resume.findFirst({ where: { id, profileId: profile.id } });
  if (!resume) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  try {
    const { actorIp, actorAgent } = getRequestContext(req);
    await logAudit({
      actorId: userId,
      actorIp: actorIp ?? undefined,
      actorAgent: actorAgent ?? undefined,
      category: "DATA_ACCESS",
      action: AUDIT_ACTIONS.RESUME_DOWNLOADED,
      severity: "INFO",
      targetType: "Resume",
      targetId: id,
      metadata: { resumeId: id },
    });
  } catch {
    // non-blocking
  }
  const url = await getFileUrl(resume.storageKey);
  return NextResponse.redirect(url);
}
