/**
 * Phase 18: Company-scoped B2B API keys.
 * Never store plaintext — only SHA-256 hash. Plaintext shown once in UI.
 */

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma/client";
import { trackOutcome } from "@/lib/tracking/outcomes";
import type { CompanyApiKey, Company } from "@prisma/client";
import type { ApiKeyEnvironment } from "@prisma/client";

const LIVE_PREFIX = "asc_live_";
const TEST_PREFIX = "asc_test_";
const KEY_PREFIX_LENGTH = 12; // first 12 chars shown in UI e.g. "asc_live_ab12"
const SECRET_LENGTH = 32; // 32 hex chars = 16 bytes

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export async function generateApiKey(params: {
  companyId: string;
  createdById: string;
  name: string;
  environment: ApiKeyEnvironment;
  scopes: string[];
  expiresAt?: Date;
}): Promise<{ key: string; record: CompanyApiKey }> {
  const prefix = params.environment === "TEST" ? TEST_PREFIX : LIVE_PREFIX;
  const secret = randomBytes(SECRET_LENGTH / 2).toString("hex");
  const key = `${prefix}${secret}`;
  const keyHash = sha256(key);
  const keyPrefix = key.substring(0, KEY_PREFIX_LENGTH);

  const record = await prisma.companyApiKey.create({
    data: {
      companyId: params.companyId,
      createdById: params.createdById,
      name: params.name,
      keyHash,
      keyPrefix,
      environment: params.environment,
      scopes: params.scopes,
      expiresAt: params.expiresAt ?? null,
    },
  });

  trackOutcome(params.createdById, "PHASE18_API_KEY_CREATED", {
    entityId: record.id,
    entityType: "CompanyApiKey",
    metadata: { companyId: params.companyId, environment: params.environment, scopes: params.scopes },
  }).catch(() => {});

  return { key, record };
}

export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  apiKey?: CompanyApiKey & { company: Company };
  error?: "INVALID" | "REVOKED" | "EXPIRED";
}> {
  if (!rawKey || (!rawKey.startsWith(LIVE_PREFIX) && !rawKey.startsWith(TEST_PREFIX))) {
    return { valid: false, error: "INVALID" };
  }

  const keyHash = sha256(rawKey);

  const apiKey = await prisma.companyApiKey.findUnique({
    where: { keyHash },
    include: { company: true },
  });

  if (!apiKey) {
    return { valid: false, error: "INVALID" };
  }

  if (apiKey.revokedAt) {
    return { valid: false, error: "REVOKED" };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: "EXPIRED" };
  }

  return { valid: true, apiKey: apiKey as CompanyApiKey & { company: Company } };
}

export function hasScope(apiKey: CompanyApiKey, required: string): boolean {
  return apiKey.scopes.includes(required) || apiKey.scopes.includes("*");
}

export async function revokeApiKey(id: string): Promise<void> {
  const key = await prisma.companyApiKey.findUnique({
    where: { id },
    select: { createdById: true, companyId: true },
  });
  await prisma.companyApiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  if (key) {
    trackOutcome(key.createdById, "PHASE18_API_KEY_REVOKED", {
      entityId: id,
      entityType: "CompanyApiKey",
      metadata: { companyId: key.companyId },
    }).catch(() => {});
  }
}
