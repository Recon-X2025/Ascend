/**
 * Phase 17: Single source of truth for all audit logging.
 * Non-throwing — audit failures must never break the primary action.
 */

import type { AuditCategory, AuditSeverity, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export type { AuditCategory, AuditSeverity };

export interface AuditEntry {
  actorId?: string;
  actorRole?: string;
  actorIp?: string;
  actorAgent?: string;
  category: AuditCategory;
  action: string;
  severity?: AuditSeverity;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  success?: boolean;
  errorCode?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const severity = entry.severity ?? "INFO";
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        actorIp: entry.actorIp ?? null,
        actorAgent: entry.actorAgent != null ? String(entry.actorAgent).slice(0, 500) : null,
        category: entry.category,
        action: entry.action,
        severity,
        targetType: entry.targetType ?? "",
        targetId: entry.targetId ?? "",
        targetLabel: entry.targetLabel ?? null,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        previousState: (entry.previousState ?? undefined) as Prisma.InputJsonValue | undefined,
        newState: (entry.newState ?? undefined) as Prisma.InputJsonValue | undefined,
        success: entry.success ?? true,
        errorCode: entry.errorCode ?? null,
        adminId: entry.actorId ?? null,
      },
    });
    if (severity === "CRITICAL") {
      console.error("[AuditLog CRITICAL]", entry.action, entry.targetType, entry.targetId, entry.errorCode ?? "");
    }
  } catch (e) {
    console.error("[logAudit] failed — audit must not break app:", e);
  }
}

/**
 * Backward-compatible wrapper for admin actions. Calls logAudit with category ADMIN_ACTION.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    actorId: adminId,
    actorRole: "PLATFORM_ADMIN",
    category: "ADMIN_ACTION",
    action,
    targetType,
    targetId,
    metadata,
    severity: "WARNING",
  });
}

/**
 * Writes to SecurityEvent table for high-frequency security events.
 * Samples 1-in-10 for PHASE17_SECURITY_EVENT_LOGGED outcome tracking.
 */
export async function logSecurityEvent(
  type: string,
  actorIp: string,
  endpoint: string,
  actorId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        type,
        actorIp: actorIp || null,
        actorId: actorId ?? null,
        endpoint,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    if (actorId && Math.random() < 0.1) {
      const { trackOutcome } = await import("@/lib/tracking/outcomes");
      trackOutcome(actorId, "PHASE17_SECURITY_EVENT_LOGGED", {
        entityType: "SecurityEvent",
        metadata: { type, endpoint },
      }).catch(() => {});
    }
  } catch (e) {
    console.error("[logSecurityEvent] failed:", e);
  }
}
