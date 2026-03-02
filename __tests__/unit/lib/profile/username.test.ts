import { slugFromName, validateUsername } from "@/lib/profile/username";

describe("slugFromName", () => {
  test("lowercases and removes spaces", () => {
    expect(slugFromName("John Smith")).toBe("johnsmith");
  });

  test("removes special characters", () => {
    expect(slugFromName("John O'Brien")).toBe("johnobrien");
  });

  test("handles multiple spaces", () => {
    expect(slugFromName("John  Smith")).toBe("johnsmith");
  });

  test("truncates to 30 chars", () => {
    expect(slugFromName("A".repeat(40)).length).toBeLessThanOrEqual(30);
  });

  test("returns empty string for empty input", () => {
    expect(slugFromName("")).toBe("");
  });
});

describe("validateUsername", () => {
  test("accepts valid username", () => {
    expect(validateUsername("johnsmith").valid).toBe(true);
  });

  test("accepts username with hyphens", () => {
    expect(validateUsername("john-smith").valid).toBe(true);
  });

  test("rejects username shorter than 3 chars", () => {
    expect(validateUsername("jo").valid).toBe(false);
  });

  test("rejects username longer than 30 chars", () => {
    expect(validateUsername("a".repeat(31)).valid).toBe(false);
  });

  test("rejects username with spaces", () => {
    expect(validateUsername("john smith").valid).toBe(false);
  });

  test("rejects username starting with hyphen", () => {
    expect(validateUsername("-johnsmith").valid).toBe(false);
  });

  test("rejects username ending with hyphen", () => {
    expect(validateUsername("johnsmith-").valid).toBe(false);
  });

  test("rejects username with consecutive hyphens", () => {
    expect(validateUsername("john--smith").valid).toBe(false);
  });

  test("rejects username with special chars", () => {
    expect(validateUsername("john@smith").valid).toBe(false);
  });
});
