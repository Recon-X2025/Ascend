/**
 * API route tests — mock getSessionUserId and prisma.
 * Tests response shape and status codes only (no live DB).
 */

const mockGetSessionUserId = jest.fn();
const mockPrisma = {
  jobSeekerProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock("@/lib/profile/api-helpers", () => ({
  getSessionUserId: (...args: unknown[]) => mockGetSessionUserId(...args),
  getProfileOrThrow: jest.fn(),
  getProfileOrNull: jest.fn(),
}));

jest.mock("@/lib/prisma/client", () => ({
  prisma: mockPrisma,
}));

jest.mock("@/lib/profile/username", () => ({
  generateUniqueUsername: jest.fn().mockResolvedValue("testuser"),
  slugFromName: jest.fn((n: string) => (n || "").toLowerCase().replace(/\s/g, "")),
}));

describe("GET /api/profile/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when not authenticated", async () => {
    mockGetSessionUserId.mockResolvedValue(null);
    const { GET } = await import("@/app/api/profile/me/route");
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });

  test("returns 200 + profile data when authenticated and profile exists", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");
    const mockProfile = {
      id: "p1",
      userId: "user-1",
      headline: "Engineer",
      summary: null,
      city: null,
      country: null,
      avatarUrl: null,
      noticePeriod: null,
      workMode: null,
      currentCTC: null,
      expectedCTC: null,
      experiences: [],
      educations: [],
      skills: [],
      resumes: [],
      certifications: [],
      projects: [],
      awards: [],
      languages: [],
      volunteerWork: [],
      publications: [],
    };
    mockPrisma.jobSeekerProfile.findUnique.mockResolvedValue(mockProfile);
    const { GET } = await import("@/app/api/profile/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    expect(json.data.profile).toBeDefined();
    expect(json.data.completion).toBeDefined();
  });
});
