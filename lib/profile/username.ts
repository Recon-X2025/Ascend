import { prisma } from "@/lib/prisma/client";

const USERNAME_MAX_LENGTH = 30;
const USERNAME_MIN_LENGTH = 3;

/**
 * Generate a URL-safe username from a display name.
 * e.g. "John O'Brien" → "johnobrien"
 */
export function slugFromName(name: string | null | undefined): string {
  if (!name?.trim()) return "";
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, USERNAME_MAX_LENGTH);
}

/**
 * Ensure username is unique by appending a 4-digit number if needed.
 */
export async function generateUniqueUsername(base: string): Promise<string> {
  let candidate = base.slice(0, USERNAME_MAX_LENGTH);
  if (candidate.length < USERNAME_MIN_LENGTH) {
    candidate = candidate + "user";
  }
  candidate = candidate.slice(0, USERNAME_MAX_LENGTH);

  const exists = await prisma.jobSeekerProfile.findUnique({
    where: { username: candidate },
  });
  if (!exists) return candidate;

  const random = Math.floor(1000 + Math.random() * 9000);
  const withNumber = `${candidate.slice(0, USERNAME_MAX_LENGTH - 4)}${random}`;
  const again = await prisma.jobSeekerProfile.findUnique({
    where: { username: withNumber },
  });
  if (!again) return withNumber;

  // Fallback: base + random (ensure we don't exceed max length)
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const fallback = `${slugFromName(base).slice(0, USERNAME_MAX_LENGTH - 4)}${suffix}`;
  return fallback;
}

export const usernameRegex = /^[a-z0-9](?:[a-z0-9]-?)*[a-z0-9]$/;

/**
 * Validate username: 3–30 chars, alphanumeric + single hyphens, no leading/trailing hyphen.
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const t = username.trim();
  if (t.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  if (t.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: "Username must be at most 30 characters" };
  }
  if (!/^[a-z0-9-]+$/.test(t)) {
    return { valid: false, error: "Only lowercase letters, numbers, and hyphens allowed" };
  }
  if (t.startsWith("-") || t.endsWith("-")) {
    return { valid: false, error: "Username cannot start or end with a hyphen" };
  }
  if (/--/.test(t)) {
    return { valid: false, error: "No consecutive hyphens" };
  }
  return { valid: true };
}

export async function isUsernameTaken(username: string, excludeProfileId?: string): Promise<boolean> {
  const existing = await prisma.jobSeekerProfile.findUnique({
    where: { username: username.toLowerCase().trim() },
  });
  if (!existing) return false;
  if (excludeProfileId && existing.id === excludeProfileId) return false;
  return true;
}
