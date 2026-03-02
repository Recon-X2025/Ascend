import { rateLimit } from "@/lib/redis/ratelimit";

jest.mock("@/lib/redis/client", () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn().mockResolvedValue(1),
  },
}));

const { redis } = jest.requireMock("@/lib/redis/client");

describe("rateLimit", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns success=true when under limit", async () => {
    (redis.incr as jest.Mock).mockResolvedValue(1);
    const result = await rateLimit("test-key", 5, 60);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  test("returns success=true when at limit (5th request allowed)", async () => {
    (redis.incr as jest.Mock).mockResolvedValue(5);
    const result = await rateLimit("test-key", 5, 60);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  test("returns success=false when over limit", async () => {
    (redis.incr as jest.Mock).mockResolvedValue(6);
    const result = await rateLimit("test-key", 5, 60);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test("sets expiry on first request (incr returns 1)", async () => {
    (redis.incr as jest.Mock).mockResolvedValue(1);
    await rateLimit("test-key", 5, 60);
    expect(redis.expire).toHaveBeenCalledWith(
      expect.stringContaining("ratelimit:test-key"),
      120
    );
  });

  test("does not set expiry on subsequent requests", async () => {
    (redis.incr as jest.Mock).mockResolvedValue(2);
    await rateLimit("test-key", 5, 60);
    expect(redis.expire).not.toHaveBeenCalled();
  });
});
