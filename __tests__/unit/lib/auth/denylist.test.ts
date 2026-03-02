import {
  denyToken,
  denyAllUserTokens,
  isTokenDenied,
  isTokenIssuedBeforeDenyAll,
  clearUserDenyAll,
} from "@/lib/auth/denylist";

jest.mock("@/lib/redis/client", () => ({
  redis: {
    set: jest.fn().mockResolvedValue("OK"),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
  },
}));

const { redis } = jest.requireMock("@/lib/redis/client");

describe("denyToken", () => {
  beforeEach(() => jest.clearAllMocks());

  test("sets key with correct TTL when token not yet expired", async () => {
    const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
    await denyToken("test-jti", futureExpiry);
    expect(redis.set).toHaveBeenCalledWith(
      "jwt:denied:test-jti",
      "1",
      "EX",
      expect.any(Number)
    );
  });

  test("does nothing if token already expired", async () => {
    const pastExpiry = Math.floor(Date.now() / 1000) - 100;
    await denyToken("test-jti", pastExpiry);
    expect(redis.set).not.toHaveBeenCalled();
  });
});

describe("denyAllUserTokens", () => {
  beforeEach(() => jest.clearAllMocks());

  test("sets user deny key with 31-day TTL", async () => {
    await denyAllUserTokens("user-123");
    expect(redis.set).toHaveBeenCalledWith(
      "jwt:denied:user:user-123",
      expect.any(String),
      "EX",
      60 * 60 * 24 * 31
    );
  });
});

describe("isTokenDenied", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns true when token key exists", async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce("1");
    expect(await isTokenDenied("test-jti")).toBe(true);
  });

  test("returns false when token key does not exist", async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce(null);
    expect(await isTokenDenied("test-jti")).toBe(false);
  });
});

describe("isTokenIssuedBeforeDenyAll", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns true when token issued before deny timestamp", async () => {
    const denyTime = Math.floor(Date.now() / 1000);
    (redis.get as jest.Mock).mockResolvedValueOnce(String(denyTime));
    const issuedAt = denyTime - 100;
    expect(await isTokenIssuedBeforeDenyAll("user-123", issuedAt)).toBe(true);
  });

  test("returns false when token issued after deny timestamp", async () => {
    const denyTime = Math.floor(Date.now() / 1000) - 100;
    (redis.get as jest.Mock).mockResolvedValueOnce(String(denyTime));
    const issuedAt = Math.floor(Date.now() / 1000);
    expect(await isTokenIssuedBeforeDenyAll("user-123", issuedAt)).toBe(false);
  });

  test("returns false when no deny-all entry exists", async () => {
    (redis.get as jest.Mock).mockResolvedValueOnce(null);
    expect(await isTokenIssuedBeforeDenyAll("user-123", 0)).toBe(false);
  });
});

describe("clearUserDenyAll", () => {
  beforeEach(() => jest.clearAllMocks());

  test("deletes user deny key", async () => {
    await clearUserDenyAll("user-123");
    expect(redis.del).toHaveBeenCalledWith("jwt:denied:user:user-123");
  });
});
