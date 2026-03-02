/**
 * Admin audit — backward-compatible wrapper. Delegates to Phase 17 logAudit.
 */
import { logAudit } from "@/lib/audit/log";

export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  targetLabel,
  metadata,
}: {
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
}) {
  await logAudit({
    actorId: adminId,
    actorRole: "PLATFORM_ADMIN",
    category: "ADMIN_ACTION",
    action,
    targetType,
    targetId,
    targetLabel,
    metadata,
    severity: "WARNING",
  });
}
