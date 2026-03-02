/**
 * Phase 17: Extract request context for audit (IP, User-Agent).
 */
const X_FORWARDED_FOR = "x-forwarded-for";
const X_REAL_IP = "x-real-ip";
const USER_AGENT = "user-agent";
const MAX_AGENT_LEN = 500;

export function getRequestContext(req: Request): { actorIp: string | null; actorAgent: string | null } {
  const headers = req.headers;
  const forwarded = headers.get(X_FORWARDED_FOR);
  const ip = forwarded?.split(",")[0]?.trim() ?? headers.get(X_REAL_IP) ?? null;
  const ua = headers.get(USER_AGENT);
  const actorAgent = ua ? ua.slice(0, MAX_AGENT_LEN) : null;
  return { actorIp: ip, actorAgent };
}
