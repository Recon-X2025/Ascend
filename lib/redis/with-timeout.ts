/**
 * Wraps Redis operations with a 3s timeout to prevent hanging when Redis (e.g. Vultr-hosted)
 * is unreachable from Vercel. Returns fallback on timeout.
 */
const REDIS_TIMEOUT_MS = 3000;

export const REDIS_TIMEOUT = REDIS_TIMEOUT_MS;

export async function withTimeout<T>(
  promise: Promise<T>,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(fallback), REDIS_TIMEOUT_MS)
    ),
  ]).catch(() => fallback);
}
