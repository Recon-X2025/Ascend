import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma/client";

const KEY_PREFIX = "asc_live_";
const TEST_KEY_PREFIX = "asc_test_";

export function generateAPIKey(isTest = false): { key: string; prefix: string } {
  const prefix = isTest ? TEST_KEY_PREFIX : KEY_PREFIX;
  const secret = randomBytes(32).toString("hex");
  const key = `${prefix}${secret}`;
  return {
    key,
    prefix: key.substring(0, 16),
  };
}

export async function hashAPIKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10);
}

export async function validateAPIKey(key: string): Promise<{
  valid: boolean;
  userId?: string;
  keyId?: string;
}> {
  const prefix = key.substring(0, 16);

  const apiKeys = await prisma.aPIKey.findMany({
    where: { keyPrefix: prefix, isActive: true },
    select: { id: true, userId: true, keyHash: true },
  });

  for (const apiKey of apiKeys) {
    const matches = await bcrypt.compare(key, apiKey.keyHash);
    if (matches) {
      prisma.aPIKey
        .update({
          where: { id: apiKey.id },
          data: {
            lastUsedAt: new Date(),
            requestCount: { increment: 1 },
          },
        })
        .catch(() => {});

      return { valid: true, userId: apiKey.userId, keyId: apiKey.id };
    }
  }

  return { valid: false };
}
