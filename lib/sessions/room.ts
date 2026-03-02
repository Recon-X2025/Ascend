/**
 * M-7: Daily.co session room management.
 * createSessionRoom, getOrCreateSessionRoom, generateRoomToken, expireSessionRoom.
 */

import { prisma } from "@/lib/prisma/client";
import { addMinutes } from "date-fns";

const DAILYCO_API_KEY = process.env.DAILYCO_API_KEY;
const DAILYCO_DOMAIN = process.env.DAILYCO_DOMAIN;

function isDailyConfigured(): boolean {
  return !!(DAILYCO_API_KEY && DAILYCO_DOMAIN && DAILYCO_API_KEY !== "placeholder");
}

/** Create a Daily.co room. Stub if API key missing. */
async function createDailyRoom(params: {
  name: string;
  privacy: "public" | "private";
  exp: number;
}): Promise<{ name: string; url: string } | null> {
  if (!isDailyConfigured()) {
    return null;
  }
  try {
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILYCO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: params.name,
        privacy: params.privacy,
        properties: {
          exp: params.exp,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Daily.co create room failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { name: string; url: string };
    return { name: data.name, url: data.url };
  } catch (e) {
    console.error("[DailyCo] create room error:", e);
    throw e;
  }
}

/** Create a Daily.co meeting token. Stub if API key missing. */
async function createDailyToken(params: {
  room_name: string;
  user_id: string;
  user_name: string;
  is_owner: boolean;
  exp: number;
}): Promise<string | null> {
  if (!isDailyConfigured()) {
    return null;
  }
  try {
    const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILYCO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: params.room_name,
          user_id: params.user_id,
          user_name: params.user_name,
          is_owner: params.is_owner,
          exp: params.exp,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Daily.co create token failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as { token: string };
    return data.token;
  } catch (e) {
    console.error("[DailyCo] create token error:", e);
    throw e;
  }
}

/** Create a session room linked to EngagementSession. */
export async function createSessionRoom(sessionId: string): Promise<{
  roomId: string;
  dailyRoomName: string;
  dailyRoomUrl: string;
}> {
  const session = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { sessionRoom: true, contract: true },
  });
  if (!session) throw new Error("Session not found");
  if (session.sessionRoom) {
    return {
      roomId: session.sessionRoom.id,
      dailyRoomName: session.sessionRoom.dailyRoomName,
      dailyRoomUrl: session.sessionRoom.dailyRoomUrl,
    };
  }

  const sessionEnd = session.scheduledAt ? addMinutes(session.scheduledAt, session.slotDurationMins ?? 45) : addMinutes(new Date(), 60);
  const expDate = addMinutes(sessionEnd, 30);
  const expUnix = Math.floor(expDate.getTime() / 1000);

  const roomName = `ascend-${sessionId}`;
  const daily = await createDailyRoom({
    name: roomName,
    privacy: "private",
    exp: expUnix,
  });

  if (!daily) {
    throw new Error("Daily.co not configured; set DAILYCO_API_KEY and DAILYCO_DOMAIN");
  }

  const room = await prisma.sessionRoom.create({
    data: {
      dailyRoomName: daily.name,
      dailyRoomUrl: daily.url,
      expiresAt: expDate,
    },
  });

  await prisma.engagementSession.update({
    where: { id: sessionId },
    data: { sessionRoomId: room.id },
  });

  return {
    roomId: room.id,
    dailyRoomName: room.dailyRoomName,
    dailyRoomUrl: room.dailyRoomUrl,
  };
}

/** Get or create room (idempotent). */
export async function getOrCreateSessionRoom(sessionId: string): Promise<{
  roomId: string;
  dailyRoomName: string;
  dailyRoomUrl: string;
}> {
  const session = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { sessionRoom: true },
  });
  if (!session) throw new Error("Session not found");
  if (session.sessionRoom) {
    return {
      roomId: session.sessionRoom.id,
      dailyRoomName: session.sessionRoom.dailyRoomName,
      dailyRoomUrl: session.sessionRoom.dailyRoomUrl,
    };
  }
  return createSessionRoom(sessionId);
}

/** Generate meeting token for mentor or mentee. role: "mentor" | "mentee" */
export async function generateRoomToken(
  sessionId: string,
  userId: string,
  role: "mentor" | "mentee",
  userName: string
): Promise<string> {
  const { dailyRoomName } = await getOrCreateSessionRoom(sessionId);
  const session = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { contract: true },
  });
  if (!session) throw new Error("Session not found");

  const isOwner = role === "mentor";
  const expDate = addMinutes(new Date(), 120);
  const expUnix = Math.floor(expDate.getTime() / 1000);

  const token = await createDailyToken({
    room_name: dailyRoomName,
    user_id: userId,
    user_name: userName,
    is_owner: isOwner,
    exp: expUnix,
  });

  if (!token) {
    throw new Error("Daily.co token creation failed; check API keys");
  }
  return token;
}

/** M-12: Create session room for CircleSession (group cohort). */
export async function createSessionRoomForCircle(circleSessionId: string): Promise<{
  roomId: string;
  dailyRoomName: string;
  dailyRoomUrl: string;
}> {
  const circleSession = await prisma.circleSession.findUnique({
    where: { id: circleSessionId },
    include: { sessionRoom: true },
  });
  if (!circleSession) throw new Error("Circle session not found");
  if (circleSession.sessionRoom) {
    return {
      roomId: circleSession.sessionRoom.id,
      dailyRoomName: circleSession.sessionRoom.dailyRoomName,
      dailyRoomUrl: circleSession.sessionRoom.dailyRoomUrl,
    };
  }

  const sessionEnd = circleSession.scheduledAt
    ? addMinutes(circleSession.scheduledAt, 90)
    : addMinutes(new Date(), 120);
  const expDate = addMinutes(sessionEnd, 30);
  const expUnix = Math.floor(expDate.getTime() / 1000);

  const roomName = `ascend-circle-${circleSessionId}`;
  const daily = await createDailyRoom({
    name: roomName,
    privacy: "private",
    exp: expUnix,
  });

  if (!daily) {
    throw new Error("Daily.co not configured; set DAILYCO_API_KEY and DAILYCO_DOMAIN");
  }

  const room = await prisma.sessionRoom.create({
    data: {
      dailyRoomName: daily.name,
      dailyRoomUrl: daily.url,
      expiresAt: expDate,
    },
  });

  await prisma.circleSession.update({
    where: { id: circleSessionId },
    data: { sessionRoomId: room.id },
  });

  return {
    roomId: room.id,
    dailyRoomName: room.dailyRoomName,
    dailyRoomUrl: room.dailyRoomUrl,
  };
}

/** M-12: Get or create room for circle session (idempotent). */
export async function getOrCreateCircleSessionRoom(circleSessionId: string): Promise<{
  roomId: string;
  dailyRoomName: string;
  dailyRoomUrl: string;
}> {
  const circleSession = await prisma.circleSession.findUnique({
    where: { id: circleSessionId },
    include: { sessionRoom: true },
  });
  if (!circleSession) throw new Error("Circle session not found");
  if (circleSession.sessionRoom) {
    return {
      roomId: circleSession.sessionRoom.id,
      dailyRoomName: circleSession.sessionRoom.dailyRoomName,
      dailyRoomUrl: circleSession.sessionRoom.dailyRoomUrl,
    };
  }
  return createSessionRoomForCircle(circleSessionId);
}

/** Expire session room via Daily API (optional cleanup). */
export async function expireSessionRoom(sessionId: string): Promise<void> {
  const session = await prisma.engagementSession.findUnique({
    where: { id: sessionId },
    include: { sessionRoom: true },
  });
  if (!session?.sessionRoom) return;

  if (isDailyConfigured()) {
    try {
      await fetch(`https://api.daily.co/v1/rooms/${session.sessionRoom.dailyRoomName}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${DAILYCO_API_KEY}` },
      });
    } catch (e) {
      console.error("[DailyCo] expire room error:", e);
    }
  }

  await prisma.engagementSession.update({
    where: { id: sessionId },
    data: { sessionRoomId: null },
  });
  await prisma.sessionRoom.delete({
    where: { id: session.sessionRoom.id },
  }).catch(() => {});
}
