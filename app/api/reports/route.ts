import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { createReportSchema, REPORT_DESCRIPTION_MAX } from "@/lib/validations/report";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit/log";
import { getRequestContext } from "@/lib/audit/context";
import { trackOutcome } from "@/lib/tracking/outcomes";
import { sendReportReceivedEmail } from "@/lib/email/templates/report-received";
import { isIpBlocked } from "@/lib/blocklist";
import { reportRateLimitHit } from "@/lib/rate-limit";
import sanitizeHtml from "sanitize-html";

const REPORTS_PER_HOUR = 5;
const WINDOW_SECONDS = 3600;

function sanitizeDescription(raw: string | undefined): string | null {
  if (raw == null || raw.trim() === "") return null;
  const stripped = sanitizeHtml(raw.trim(), { allowedTags: [], allowedAttributes: {} });
  return stripped.slice(0, REPORT_DESCRIPTION_MAX) || null;
}

export async function POST(req: Request) {
  const { actorIp } = getRequestContext(req);
  if (actorIp && (await isIpBlocked(actorIp))) {
    return NextResponse.json(
      { code: "IP_BLOCKED", message: "Access denied" },
      { status: 403 }
    );
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, resetIn } = await checkRateLimit(
    `report:${userId}`,
    REPORTS_PER_HOUR,
    WINDOW_SECONDS
  );
  if (!allowed) {
    reportRateLimitHit(req, `report:${userId}`, REPORTS_PER_HOUR, WINDOW_SECONDS, userId).catch(
      () => {}
    );
    return NextResponse.json(
      { error: "You've submitted several reports recently. Please wait before submitting another.", resetIn },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const description = sanitizeDescription(parsed.data.description);

  const report = await prisma.userReport.create({
    data: {
      reporterId: userId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      description,
    },
  });

  trackOutcome(userId, "PHASE17_REPORT_SUBMITTED", {
    entityId: report.id,
    entityType: "UserReport",
    metadata: { targetType: parsed.data.targetType, targetId: parsed.data.targetId },
  }).catch(() => {});

  try {
    const reporter = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (reporter?.email) {
      await sendReportReceivedEmail(reporter.email, reporter.name ?? "User", report.id);
    }
  } catch {
    // non-blocking
  }

  try {
    const { actorIp, actorAgent } = getRequestContext(req);
    await logAudit({
      actorId: userId,
      actorIp: actorIp ?? undefined,
      actorAgent: actorAgent ?? undefined,
      category: "DATA_MUTATION",
      action: "REPORT_SUBMITTED",
      severity: "INFO",
      targetType: "UserReport",
      targetId: report.id,
      metadata: {
        reportId: report.id,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        reason: parsed.data.reason,
      },
    });
  } catch {
    // non-blocking
  }

  return NextResponse.json({
    success: true,
    id: report.id,
    message: "Thank you — our team will review this.",
  });
}
