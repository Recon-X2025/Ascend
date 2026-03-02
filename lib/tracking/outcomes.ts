import { prisma } from "@/lib/prisma/client";
import type { OutcomeEventType, AIFeature } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export async function trackOutcome(
  userId: string,
  eventType: OutcomeEventType,
  options?: {
    entityId?: string;
    entityType?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  prisma.outcomeEvent
    .create({
      data: {
        userId,
        eventType,
        entityId: options?.entityId,
        entityType: options?.entityType,
        metadata: (options?.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    .catch((err) => {
      console.error("[OutcomeTracking] Failed to track event:", err);
    });
}

export async function trackAIInteraction(
  userId: string,
  feature: AIFeature,
  promptVersion: string,
  options?: {
    inputTokens?: number;
    outputTokens?: number;
    latencyMs?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  try {
    const interaction = await prisma.aIInteraction.create({
      data: {
        userId,
        feature,
        promptVersion,
        inputTokens: options?.inputTokens,
        outputTokens: options?.outputTokens,
        latencyMs: options?.latencyMs,
        metadata: (options?.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return interaction.id;
  } catch (err) {
    console.error("[AITracking] Failed to track interaction:", err);
    return "";
  }
}

export async function rateAIInteraction(
  interactionId: string,
  rating: 1 | -1
): Promise<void> {
  if (!interactionId) return;
  prisma.aIInteraction
    .update({
      where: { id: interactionId },
      data: { rating },
    })
    .catch((err) => {
      console.error("[AITracking] Failed to rate interaction:", err);
    });
}

export async function updateUserJourney(
  userId: string,
  increment: Partial<{
    resumesBuilt: number;
    fitScoresRun: number;
    optimiserSessions: number;
    applicationsSubmitted: number;
    interviewsScheduled: number;
    offersReceived: number;
  }>
): Promise<void> {
  const updatePayload = Object.fromEntries(
    Object.entries(increment).map(([k, v]) => [k, { increment: v }])
  ) as Record<string, { increment: number }>;

  prisma.userJourney
    .upsert({
      where: { userId },
      create: { userId, ...increment, lastActiveAt: new Date() },
      update: {
        ...updatePayload,
        lastActiveAt: new Date(),
      },
    })
    .catch((err) => {
      console.error("[UserJourney] Failed to update journey:", err);
    });
}
