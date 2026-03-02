/**
 * M-7: Ascend Steno — transcription & extraction.
 * Audio NEVER stored. Steno runs only if BOTH acknowledge.
 */

import { prisma } from "@/lib/prisma/client";
import type { StenoStatus } from "@prisma/client";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function isDeepgramConfigured(): boolean {
  return !!(DEEPGRAM_API_KEY && DEEPGRAM_API_KEY !== "placeholder");
}

function isOpenAIConfigured(): boolean {
  return !!(OPENAI_API_KEY && OPENAI_API_KEY !== "placeholder");
}

/** Record steno consent. participantType: "MENTOR" | "MENTEE" */
export async function recordStenoConsent(
  sessionId: string,
  userId: string,
  participantType: "MENTOR" | "MENTEE",
  acknowledged: boolean,
  ipAddress?: string
): Promise<void> {
  await prisma.stenoConsentLog.upsert({
    where: {
      sessionId_userId: { sessionId, userId },
    },
    create: {
      sessionId,
      userId,
      participantType,
      acknowledged,
      ipAddress,
    },
    update: {
      participantType,
      acknowledged,
      ipAddress,
    },
  });
}

/** Steno should run only if both mentor and mentee acknowledged. */
export async function stenoShouldRun(sessionId: string): Promise<boolean> {
  const session = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { contract: true, stenoConsents: true },
  });
  if (!session) return false;

  const mentorId = session.contract.mentorUserId;
  const menteeId = session.contract.menteeUserId;

  const mentorConsent = session.stenoConsents.find((c) => c.userId === mentorId);
  const menteeConsent = session.stenoConsents.find((c) => c.userId === menteeId);

  return !!(mentorConsent?.acknowledged && menteeConsent?.acknowledged);
}

/** User waived dispute rights if they did not acknowledge steno (FULL_UPFRONT or declined). */
export async function hasWaivedDisputeRights(sessionId: string, userId: string): Promise<boolean> {
  const consent = await prisma.stenoConsentLog.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  return consent ? !consent.acknowledged : false;
}

/** Start transcription (Deepgram WebSocket). Stub if key missing. Audio never persisted. */
export async function startTranscription(sessionId: string): Promise<void> {
  if (!stenoShouldRun(sessionId)) return;
  if (!isDeepgramConfigured()) return;

  await prisma.engagementSession.update({
    where: { id: sessionId },
    data: { stenoStatus: "ACTIVE" as StenoStatus },
  });
  // Actual Deepgram WebSocket connection would be initiated from client/media server
  // piping audio in real-time. No audio storage. Implementation depends on Daily.co
  // streaming integration; here we only update status.
}

/** Stop transcription and optionally save. */
export async function stopTranscription(sessionId: string, reason: string): Promise<void> {
  await prisma.engagementSession.update({
    where: { id: sessionId },
    data: {
      stenoStatus: reason === "complete" ? ("COMPLETED" as StenoStatus) : ("PARTIAL" as StenoStatus),
    },
  });
}

/** Flush transcript to SessionTranscript. */
export async function saveTranscript(sessionId: string, content: string): Promise<void> {
  await prisma.sessionTranscript.create({
    data: {
      sessionId,
      content: content.trim(),
    },
  });
}

export interface StenoExtractionResult {
  summary?: string;
  mentorCommitments: string[];
  menteeCommitments: string[];
  actionItems: string[];
  nextSessionFocus?: string;
  goalProgressSignal?: string;
}

/** M-12: Multi-mentee attribution for circle sessions. */
export interface CircleStenoExtraction {
  summary?: string;
  mentorCommitments: string[];
  /** Per mentee: { menteeId, commitments } */
  menteeCommitments: Array<{ menteeId: string; commitments: string[] }>;
  actionItems: string[];
  nextSessionFocus?: string;
  goalProgressSignal?: string;
}

/**
 * M-12: Build speaker map for circle session (mentor + multiple mentees).
 * Returns map of participantId -> { userId, displayName }.
 */
export async function buildCircleSpeakerMap(
  circleSessionId: string
): Promise<Record<string, { userId: string; displayName: string }>> {
  const circleSession = await prisma.circleSession.findUnique({
    where: { id: circleSessionId },
    include: {
      circle: {
        include: {
          mentor: { select: { id: true, name: true } },
          members: {
            where: { status: { in: ["ACCEPTED", "CONFIRMED"] } },
            include: { mentee: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  if (!circleSession) return {};

  const circle = circleSession.circle;
  const map: Record<string, { userId: string; displayName: string }> = {};

  if (circle.mentor) {
    map["mentor"] = {
      userId: circle.mentor.id,
      displayName: circle.mentor.name ?? "Mentor",
    };
  }
  for (const member of circle.members) {
    map[member.mentee.id] = {
      userId: member.mentee.id,
      displayName: member.mentee.name ?? "Mentee",
    };
  }
  return map;
}

/** Extract structured JSON from transcript using GPT-4o Mini. */
export async function extractFromTranscript(sessionId: string): Promise<StenoExtractionResult | null> {
  const transcript = await prisma.sessionTranscript.findFirst({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
  });
  if (!transcript?.content || !transcript.content.trim()) return null;
  if (!isOpenAIConfigured()) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Extract from this mentorship session transcript a JSON object with:
- summary (string, brief)
- mentorCommitments (string[])
- menteeCommitments (string[])
- actionItems (string[])
- nextSessionFocus (string, optional)
- goalProgressSignal (string, optional)
Return ONLY valid JSON, no markdown.`,
          },
          { role: "user", content: transcript.content },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI error: ${res.status}`);
    }
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;

    const parsed = JSON.parse(text) as Record<string, unknown>;
    const result: StenoExtractionResult = {
      mentorCommitments: Array.isArray(parsed.mentorCommitments) ? parsed.mentorCommitments : [],
      menteeCommitments: Array.isArray(parsed.menteeCommitments) ? parsed.menteeCommitments : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
      nextSessionFocus: typeof parsed.nextSessionFocus === "string" ? parsed.nextSessionFocus : undefined,
      goalProgressSignal: typeof parsed.goalProgressSignal === "string" ? parsed.goalProgressSignal : undefined,
    };

    await prisma.stenoExtraction.create({
      data: {
        sessionId,
        summary: result.summary,
        mentorCommitments: result.mentorCommitments,
        menteeCommitments: result.menteeCommitments,
        actionItems: result.actionItems,
        nextSessionFocus: result.nextSessionFocus,
        goalProgressSignal: result.goalProgressSignal,
      },
    });

    return result;
  } catch (e) {
    console.error("[Steno] extract error:", e);
    return null;
  }
}
