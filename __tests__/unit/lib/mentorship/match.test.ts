import { scoreMentors, scoreOneMentor, type MatchInput } from "@/lib/mentorship/match";

function makeMentee(overrides: Partial<MatchInput["mentee"]> = {}): MatchInput["mentee"] {
  return {
    careerContext: null,
    targetFromRole: null,
    targetToRole: null,
    targetFromIndustry: null,
    targetToIndustry: null,
    targetCity: null,
    primaryNeed: null,
    ...overrides,
  };
}

function makeMentor(overrides: Partial<MatchInput["mentor"]> = {}): MatchInput["mentor"] {
  return {
    id: "mp1",
    userId: "u1",
    fromRole: "Software Engineer",
    toRole: "Product Manager",
    fromCompanyType: null,
    toCompanyType: null,
    fromIndustry: null,
    toIndustry: null,
    fromCity: null,
    toCity: "Bangalore",
    transitionDurationMonths: 14,
    transitionYear: null,
    geographyScope: "INDIA_ONLY",
    geographyCountries: [],
    focusAreas: ["INTERVIEW_PREP"],
    m2FocusAreas: ["CAREER_PIVOT"],
    maxActiveMentees: 2,
    currentMenteeCount: 0,
    availabilityWindows: [{ dayOfWeek: "MON" }, { dayOfWeek: "TUE" }],
    verificationStatus: "VERIFIED",
    user: { name: "Rohan" },
    ...overrides,
  } as MatchInput["mentor"];
}

describe("scoreMentors", () => {
  it("scores exact transition match at 40pts for transitionSimilarity", () => {
    const mentee = makeMentee({
      targetFromRole: "Software Engineer",
      targetToRole: "Product Manager",
    });
    const mentor = makeMentor({ fromRole: "Software Engineer", toRole: "Product Manager" });
    const result = scoreOneMentor({ mentee, mentor });
    expect(result).not.toBeNull();
    expect(result!.dimensions.transitionSimilarity).toBe(40);
  });

  it("scores adjacent domain at 25pts", () => {
    const mentee = makeMentee({
      targetFromRole: "Developer",
      targetToRole: "Product Manager",
    });
    const mentor = makeMentor({ fromRole: "SDE", toRole: "Product Manager" });
    const result = scoreOneMentor({ mentee, mentor });
    expect(result).not.toBeNull();
    expect(result!.dimensions.transitionSimilarity).toBe(25);
  });

  it("scores partial match at 15pts", () => {
    const mentee = makeMentee({
      targetFromRole: "Data Analyst",
      targetToRole: "Product Manager",
    });
    const mentor = makeMentor({ fromRole: "Consulting", toRole: "Product Manager" });
    const result = scoreOneMentor({ mentee, mentor });
    expect(result).not.toBeNull();
    expect(result!.dimensions.transitionSimilarity).toBe(15);
  });

  it("excludes mentors with zero capacity", () => {
    const mentee = makeMentee({ targetToRole: "PM" });
    const mentor = makeMentor({
      maxActiveMentees: 2,
      currentMenteeCount: 2,
    });
    const result = scoreOneMentor({ mentee, mentor });
    expect(result).toBeNull();
  });

  it("returns max 3 results", () => {
    const mentee = makeMentee({ targetToRole: "PM" });
    const mentors = [
      makeMentor({ id: "1", userId: "u1" }),
      makeMentor({ id: "2", userId: "u2" }),
      makeMentor({ id: "3", userId: "u3" }),
      makeMentor({ id: "4", userId: "u4" }),
    ];
    const scored = scoreMentors(mentee, mentors);
    expect(scored.length).toBeLessThanOrEqual(3);
  });

  it("generates reason string without exposing score", () => {
    const mentee = makeMentee({
      targetFromRole: "Software Engineer",
      targetToRole: "Product Manager",
    });
    const mentor = makeMentor({ fromRole: "Software Engineer", toRole: "Product Manager" });
    const result = scoreOneMentor({ mentee, mentor });
    expect(result).not.toBeNull();
    expect(result!.reason).toBeDefined();
    expect(typeof result!.reason).toBe("string");
    expect(result!.reason.length).toBeGreaterThan(0);
    expect(result!.reason).not.toMatch(/\b(40|25|15|20|10|7|100)\b/); // no dimension scores in reason
  });

  it("reason string is ≤ 2 sentences", () => {
    const mentee = makeMentee({ targetToRole: "PM", primaryNeed: "PREPARE_INTERVIEWS" });
    const mentor = makeMentor({ focusAreas: ["INTERVIEW_PREP"], m2FocusAreas: [] });
    const result = scoreOneMentor({ mentee, mentor });
    expect(result).not.toBeNull();
    const sentences = result!.reason.split(/[.!?]+/).filter(Boolean);
    expect(sentences.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array when no eligible mentors", () => {
    const mentee = makeMentee({ targetToRole: "PM" });
    const scored = scoreMentors(mentee, []);
    expect(scored).toEqual([]);
  });

  it("returns empty when all mentors have zero capacity", () => {
    const mentee = makeMentee({ targetToRole: "PM" });
    const mentors = [
      makeMentor({ id: "1", currentMenteeCount: 2, maxActiveMentees: 2 }),
    ];
    const scored = scoreMentors(mentee, mentors);
    expect(scored).toEqual([]);
  });
});
