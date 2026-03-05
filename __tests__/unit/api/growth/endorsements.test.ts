/**
 * Phase 11 (BL-11) — Skill Endorsements: verify 1st-degree gate and rate limits.
 */
import { prisma } from "@/lib/prisma/client";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/redis/ratelimit", () => ({
  rateLimit: jest.fn(),
}));

jest.mock("@/lib/notifications/create", () => ({
  createNotification: jest.fn(),
}));

jest.mock("@/lib/tracking/outcomes", () => ({
  trackOutcome: jest.fn(),
}));

jest.mock("@/lib/prisma/client", () => ({
  prisma: {
    connection: { findFirst: jest.fn() },
    profileEndorsement: { create: jest.fn() },
    user: { findUnique: jest.fn() },
    jobSeekerProfile: { findUnique: jest.fn() },
  },
}));

const mockGetServerSession = require("next-auth").getServerSession as jest.Mock;
const mockRateLimit = require("@/lib/redis/ratelimit").rateLimit as jest.Mock;

describe("Endorsements API (BL-11)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "endorser-1" } });
    mockRateLimit.mockResolvedValue({ success: true });
  });

  it("enforces 1st-degree connection — rejects when not connected", async () => {
    (prisma.connection.findFirst as jest.Mock).mockResolvedValue(null);
    const mod = await import("@/app/api/growth/endorsements/route");
    const req = new Request("http://x/api/growth/endorsements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: "recipient-1", skill: "React" }),
    });
    const res = await mod.POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("1st-degree");
  });

  it("respects rate limit — rejects when over limit", async () => {
    (prisma.connection.findFirst as jest.Mock).mockResolvedValue({ id: "c1" });
    mockRateLimit.mockResolvedValue({ success: false });
    const mod = await import("@/app/api/growth/endorsements/route");
    const req = new Request("http://x/api/growth/endorsements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: "recipient-1", skill: "React" }),
    });
    const res = await mod.POST(req);
    expect(res.status).toBe(429);
  });
});
