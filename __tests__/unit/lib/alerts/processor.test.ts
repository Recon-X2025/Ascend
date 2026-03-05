/**
 * Phase 1 (BL-5) — Saved Search Alerts: unit tests for alert processor.
 */
import { inferDatePostedFromLastSent } from "@/lib/alerts/processor";

describe("inferDatePostedFromLastSent", () => {
  const now = Date.now();
  const msPerDay = 86400000;

  it("returns undefined when lastSentAt is null", () => {
    expect(inferDatePostedFromLastSent(null)).toBeUndefined();
  });

  it("returns 24h when last sent within 1 day", () => {
    const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000);
    expect(inferDatePostedFromLastSent(twelveHoursAgo)).toBe("24h");
  });

  it("returns 7d when last sent 3 days ago", () => {
    const threeDaysAgo = new Date(now - 3 * msPerDay);
    expect(inferDatePostedFromLastSent(threeDaysAgo)).toBe("7d");
  });

  it("returns 30d when last sent 15 days ago", () => {
    const fifteenDaysAgo = new Date(now - 15 * msPerDay);
    expect(inferDatePostedFromLastSent(fifteenDaysAgo)).toBe("30d");
  });

  it("returns 7d when last sent 6 days ago", () => {
    const sixDaysAgo = new Date(now - 6 * msPerDay);
    expect(inferDatePostedFromLastSent(sixDaysAgo)).toBe("7d");
  });

  it("returns 24h when last sent 12 hours ago", () => {
    const twelveHoursAgo = new Date(now - 0.5 * msPerDay);
    expect(inferDatePostedFromLastSent(twelveHoursAgo)).toBe("24h");
  });
});
