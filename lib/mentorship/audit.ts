/**
 * M-16: Single source of truth for all mentorship audit logging.
 * Writes to MentorshipAuditLog and to platform AuditLog. Never throws.
 */

import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/audit/log";
import type { MentorshipAuditCategory } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type { MentorshipAuditCategory };

export interface LogMentorshipActionParams {
  actorId: string;
  action: string;
  category: MentorshipAuditCategory;
  entityType: string;
  entityId: string;
  previousState?: object;
  newState?: object;
  reason?: string;
  actorIp?: string;
}

export async function logMentorshipAction(params: LogMentorshipActionParams): Promise<void> {
  try {
    await prisma.mentorshipAuditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        category: params.category,
        entityType: params.entityType,
        entityId: params.entityId,
        previousState: (params.previousState ?? undefined) as Prisma.InputJsonValue | undefined,
        newState: (params.newState ?? undefined) as Prisma.InputJsonValue | undefined,
        reason: params.reason ?? null,
        actorIp: params.actorIp ?? null,
      },
    });
  } catch (e) {
    console.error("[logMentorshipAction] MentorshipAuditLog failed — must not break app:", e);
  }

  try {
    await logAudit({
      actorId: params.actorId,
      category: "MENTORSHIP",
      action: params.action,
      targetType: params.entityType,
      targetId: params.entityId,
      previousState: params.previousState as Record<string, unknown> | undefined,
      newState: params.newState as Record<string, unknown> | undefined,
      metadata: params.reason ? { reason: params.reason } : undefined,
    });
  } catch (e) {
    console.error("[logMentorshipAction] AuditLog failed — must not break app:", e);
  }

  if (Math.random() < 0.1) {
    try {
      const { trackOutcome } = await import("@/lib/tracking/outcomes");
      await trackOutcome(params.actorId, "M16_AUDIT_LOG_WRITTEN", {
        entityId: params.entityId,
        entityType: params.entityType,
        metadata: { category: params.category, action: params.action },
      });
    } catch {
      // ignore
    }
  }
}
