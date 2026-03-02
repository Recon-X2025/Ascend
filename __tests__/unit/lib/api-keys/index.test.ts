import { generateAPIKey } from "@/lib/api-keys";

describe("generateAPIKey", () => {
  test("generates key with correct prefix", () => {
    const { key } = generateAPIKey();
    expect(key.startsWith("asc_live_")).toBe(true);
  });

  test("generates test key with test prefix", () => {
    const { key } = generateAPIKey(true);
    expect(key.startsWith("asc_test_")).toBe(true);
  });

  test("prefix is first 16 chars of key", () => {
    const { key, prefix } = generateAPIKey();
    expect(prefix).toBe(key.substring(0, 16));
  });

  test("generates unique keys", () => {
    const key1 = generateAPIKey().key;
    const key2 = generateAPIKey().key;
    expect(key1).not.toBe(key2);
  });

  test("key is at least 64 chars", () => {
    const { key } = generateAPIKey();
    expect(key.length).toBeGreaterThanOrEqual(64);
  });
});
