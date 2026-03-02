import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@prisma/client";
import type { SignalType } from "@prisma/client";

export interface EmitSignalInput {
  type: SignalType;
  actorId?: string;
  audienceUserIds: string[];
  companyId?: string;
  jobPostId?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create CareerSignal records for each audience member.
 * Skips empty audience; uses createMany with skipDuplicates to avoid duplicate signals.
 */
export async function emitSignal({
  type,
  actorId,
  audienceUserIds,
  companyId,
  jobPostId,
  metadata,
}: EmitSignalInput): Promise<void> {
  if (audienceUserIds.length === 0) return;

  const data: Prisma.CareerSignalCreateManyInput[] = audienceUserIds.map((userId) => ({
    userId,
    actorId: actorId ?? null,
    type,
    companyId: companyId ?? null,
    jobPostId: jobPostId ?? null,
    metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
  }));

  await prisma.careerSignal.createMany({
    data,
    skipDuplicates: true,
  });
}
