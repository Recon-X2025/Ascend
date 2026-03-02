import { calculateCompletionScore } from "@/lib/profile/completion";
import type { FullProfile } from "@/lib/profile/completion";

function makeProfile(overrides: Partial<FullProfile> = {}): FullProfile {
  return {
    id: "p1",
    userId: "u1",
    headline: null,
    summary: null,
    avatarUrl: null,
    bannerUrl: null,
    city: null,
    state: null,
    country: null,
    pinCode: null,
    currentCompany: null,
    currentRole: null,
    totalExpYears: null,
    noticePeriod: null,
    currentCTC: null,
    expectedCTC: null,
    ctcCurrency: null,
    workMode: null,
    openToWork: false,
    openToWorkVisibility: "RECRUITERS_ONLY",
    visibility: "PUBLIC",
    hideFromCompanies: [],
    completionScore: 0,
    username: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    defaultResumeVisibility: "RECRUITERS_ONLY",
    experiences: [],
    educations: [],
    certifications: [],
    projects: [],
    awards: [],
    languages: [],
    volunteerWork: [],
    publications: [],
    skills: [],
    resumes: [],
    ...overrides,
  } as FullProfile;
}

const emptyProfile = makeProfile();

describe("calculateCompletionScore", () => {
  test("returns 0 for completely empty profile", () => {
    const result = calculateCompletionScore(emptyProfile);
    expect(result.total).toBe(0);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.nextStep).toBeTruthy();
  });

  test("awards 5pts for headline", () => {
    const result = calculateCompletionScore(makeProfile({ headline: "Engineer" }));
    expect(result.breakdown.personalInfo).toBe(5);
  });

  test("awards 5pts for summary", () => {
    const result = calculateCompletionScore(makeProfile({ summary: "About me" }));
    expect(result.breakdown.personalInfo).toBe(5);
  });

  test("awards 5pts for location (city + country)", () => {
    const result = calculateCompletionScore(makeProfile({ city: "Mumbai", country: "India" }));
    expect(result.breakdown.personalInfo).toBe(5);
  });

  test("awards 5pts for avatarUrl", () => {
    const result = calculateCompletionScore(makeProfile({ avatarUrl: "avatars/u1.jpg" }));
    expect(result.breakdown.personalInfo).toBe(5);
  });

  test("caps personalInfo at 20pts", () => {
    const result = calculateCompletionScore(
      makeProfile({
        headline: "H",
        summary: "S",
        city: "C",
        country: "Co",
        avatarUrl: "a.jpg",
      })
    );
    expect(result.breakdown.personalInfo).toBe(20);
  });

  test("awards 25pts for at least 1 experience", () => {
    const result = calculateCompletionScore(
      makeProfile({
        experiences: [{ id: "e1", profileId: "p1", company: "C", designation: "D", employmentType: "FULL_TIME", startMonth: 1, startYear: 2020, endMonth: null, endYear: null, isCurrent: true, order: 0, createdAt: new Date(), updatedAt: new Date() } as any],
      })
    );
    expect(result.breakdown.experience).toBe(25);
  });

  test("awards 0pts for no experience", () => {
    const result = calculateCompletionScore(makeProfile());
    expect(result.breakdown.experience).toBe(0);
  });

  test("awards 10pts for at least 1 education", () => {
    const result = calculateCompletionScore(
      makeProfile({
        educations: [{ id: "ed1", profileId: "p1", institution: "I", degree: null, fieldOfStudy: null, startYear: 2020, endYear: 2024, isCurrent: false, grade: null, order: 0, createdAt: new Date(), updatedAt: new Date() } as any],
      })
    );
    expect(result.breakdown.education).toBe(10);
  });

  test("awards 5pts for 1 skill", () => {
    const result = calculateCompletionScore(
      makeProfile({ skills: [{ id: "s1", profileId: "p1", skillId: "sk1", proficiency: "INTERMEDIATE", endorseCount: 0, order: 0, createdAt: new Date(), updatedAt: new Date(), skill: { name: "React" } } as any] })
    );
    expect(result.breakdown.skills).toBe(5);
  });

  test("awards 10pts for 2 skills", () => {
    const result = calculateCompletionScore(
      makeProfile({
        skills: [
          { id: "s1", profileId: "p1", skillId: "sk1", proficiency: "INTERMEDIATE", endorseCount: 0, order: 0, createdAt: new Date(), updatedAt: new Date(), skill: { name: "React" } } as any,
          { id: "s2", profileId: "p1", skillId: "sk2", proficiency: "EXPERT", endorseCount: 0, order: 1, createdAt: new Date(), updatedAt: new Date(), skill: { name: "Node" } } as any,
        ],
      })
    );
    expect(result.breakdown.skills).toBe(10);
  });

  test("awards 15pts for 3+ skills", () => {
    const result = calculateCompletionScore(
      makeProfile({
        skills: [
          { id: "s1", profileId: "p1", skillId: "sk1", proficiency: "INTERMEDIATE", endorseCount: 0, order: 0, createdAt: new Date(), updatedAt: new Date(), skill: { name: "A" } } as any,
          { id: "s2", profileId: "p1", skillId: "sk2", proficiency: "INTERMEDIATE", endorseCount: 0, order: 1, createdAt: new Date(), updatedAt: new Date(), skill: { name: "B" } } as any,
          { id: "s3", profileId: "p1", skillId: "sk3", proficiency: "INTERMEDIATE", endorseCount: 0, order: 2, createdAt: new Date(), updatedAt: new Date(), skill: { name: "C" } } as any,
        ],
      })
    );
    expect(result.breakdown.skills).toBe(15);
  });

  test("caps skills at 15pts", () => {
    const result = calculateCompletionScore(
      makeProfile({
        skills: Array.from({ length: 5 }, (_, i) => ({
          id: `s${i}`,
          profileId: "p1",
          skillId: `sk${i}`,
          proficiency: "INTERMEDIATE",
          endorseCount: 0,
          order: i,
          createdAt: new Date(),
          updatedAt: new Date(),
          skill: { name: `Skill${i}` },
        })) as any,
      })
    );
    expect(result.breakdown.skills).toBe(15);
  });

  test("awards 15pts for at least 1 resume", () => {
    const result = calculateCompletionScore(
      makeProfile({
        resumes: [
          {
            id: "r1",
            profileId: "p1",
            label: "Resume",
            storageKey: "k",
            originalName: "r.pdf",
            fileSize: 1000,
            mimeType: "application/pdf",
            visibility: "RECRUITERS_ONLY",
            isDefault: true,
            lastUsedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
        ],
      })
    );
    expect(result.breakdown.resume).toBe(15);
  });

  test("awards 3pts for noticePeriod", () => {
    const result = calculateCompletionScore(makeProfile({ noticePeriod: "THIRTY_DAYS" as any }));
    expect(result.breakdown.preferences).toBe(3);
  });

  test("awards 3pts for workMode", () => {
    const result = calculateCompletionScore(makeProfile({ workMode: "REMOTE" as any }));
    expect(result.breakdown.preferences).toBe(3);
  });

  test("awards 2pts for currentCTC", () => {
    const result = calculateCompletionScore(makeProfile({ currentCTC: 10 }));
    expect(result.breakdown.preferences).toBe(2);
  });

  test("awards 2pts for expectedCTC", () => {
    const result = calculateCompletionScore(makeProfile({ expectedCTC: 15 }));
    expect(result.breakdown.preferences).toBe(2);
  });

  test("awards 1pt each for extra sections up to 5", () => {
    const result = calculateCompletionScore(
      makeProfile({
        certifications: [{} as any],
        projects: [{} as any],
        awards: [{} as any],
        languages: [{} as any],
        volunteerWork: [{} as any],
      })
    );
    expect(result.breakdown.extras).toBe(5);
  });

  test("returns 100 for fully complete profile", () => {
    const fullProfile = makeProfile({
      headline: "H",
      summary: "S",
      city: "C",
      country: "Co",
      avatarUrl: "a.jpg",
      experiences: [{} as any],
      educations: [{} as any],
      skills: [{ skill: { name: "A" } }, { skill: { name: "B" } }, { skill: { name: "C" } }] as any,
      resumes: [{} as any],
      noticePeriod: "THIRTY_DAYS" as any,
      workMode: "REMOTE" as any,
      currentCTC: 10,
      expectedCTC: 15,
      certifications: [{} as any],
      projects: [{} as any],
      awards: [{} as any],
      languages: [{} as any],
      volunteerWork: [{} as any],
    });
    const result = calculateCompletionScore(fullProfile);
    expect(result.total).toBe(100);
    expect(result.missing).toHaveLength(0);
  });

  test("missing includes Add a headline when no headline", () => {
    const result = calculateCompletionScore(makeProfile());
    expect(result.missing).toContain("Add a headline");
  });

  test("nextStep is the highest-value missing item", () => {
    const result = calculateCompletionScore(makeProfile());
    expect(result.nextStep).toBe("Add a headline");
  });

  test("breakdown sums to total", () => {
    const partialProfile = makeProfile({
      headline: "H",
      summary: "S",
      experiences: [{} as any],
      skills: [{ skill: { name: "A" } }, { skill: { name: "B" } }, { skill: { name: "C" } }] as any,
    });
    const result = calculateCompletionScore(partialProfile);
    const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0);
    expect(sum).toBe(result.total);
  });
});
