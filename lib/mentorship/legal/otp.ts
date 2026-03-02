/**
 * M-15: OTP for legal document signing. Same pattern as M-5 contract OTP: 3/hr, 10min TTL, 6-digit.
 */

import crypto from "crypto";
import { redis } from "@/lib/redis/client";

const OTP_TTL_SECONDS = 600; // 10 min
const OTP_RATE_LIMIT_KEY = (documentId: string, userId: string) =>
  `legal-otp-limit:${documentId}:${userId}`;
const OTP_RATE_LIMIT_MAX = 3;
const OTP_RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour
const OTP_KEY = (documentId: string, userId: string) =>
  `legal-otp:${documentId}:${userId}`;

export async function requestLegalOTP(documentId: string, userId: string): Promise<string> {
  const limitKey = OTP_RATE_LIMIT_KEY(documentId, userId);
  const count = await redis.incr(limitKey);
  if (count === 1) await redis.expire(limitKey, OTP_RATE_LIMIT_WINDOW_SECONDS);
  if (count > OTP_RATE_LIMIT_MAX) {
    throw new Error("Too many OTP requests. Try again later.");
  }

  const otp = String(Math.floor(100_000 + Math.random() * 900_000));
  const hash = crypto.createHash("sha256").update(otp).digest("hex");
  const key = OTP_KEY(documentId, userId);
  await redis.setex(key, OTP_TTL_SECONDS, hash);
  return otp;
}

export async function verifyLegalOTP(
  documentId: string,
  userId: string,
  otp: string
): Promise<boolean> {
  const key = OTP_KEY(documentId, userId);
  const storedHash = await redis.get(key);
  if (!storedHash) return false;
  const hash = crypto.createHash("sha256").update(otp).digest("hex");
  if (hash !== storedHash) return false;
  await redis.del(key);
  return true;
}
