import { prisma } from "@/lib/prisma/client";

/**
 * Returns whether a feature flag is enabled. Never throws — returns false if DB fails
 * so that feature-gated routes can degrade gracefully instead of 503.
 */
export async function isEnabled(key: string): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    return flag?.enabled ?? false;
  } catch {
    return false;
  }
}

export async function getFlags(keys: string[]): Promise<Record<string, boolean>> {
  try {
    const flags = await prisma.featureFlag.findMany({
      where: { key: { in: keys } },
    });
    return Object.fromEntries(flags.map((f) => [f.key, f.enabled]));
  } catch {
    return Object.fromEntries(keys.map((k) => [k, false]));
  }
}
