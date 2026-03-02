/**
 * Seed script: 5 CareerIntents + 2 ResumeVersions for dev user.
 * Run: npx prisma db seed
 * Expects a user with email containing "dev" or set SEED_DEV_EMAIL, and a JobSeekerProfile.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_LEVELS = ["IC", "TEAM_LEAD", "MANAGER", "DIRECTOR", "VP", "C_SUITE"] as const;

const FEATURE_FLAGS = [
  { key: "fit_score_enabled", enabled: true, description: "Show fit score on job cards and detail pages" },
  { key: "resume_optimiser_enabled", enabled: true, description: "Enable JD Resume Optimiser (Phase 6A)" },
  { key: "job_alerts_enabled", enabled: true, description: "Enable job alert emails" },
  { key: "notifications_enabled", enabled: true, description: "Enable in-app notification centre" },
  { key: "profile_views_enabled", enabled: true, description: "Track and display profile view counts" },
  { key: "easy_apply_enabled", enabled: true, description: "Enable Easy Apply on job listings" },
  { key: "seeker_pilot_open", enabled: false, description: "Open seeker pilot to public registrations" },
  { key: "cover_letter_generator", enabled: true, description: "Phase 11: Cover letter generator" },
  { key: "interview_prep", enabled: true, description: "Phase 11: Interview question generator" },
  { key: "profile_optimiser", enabled: true, description: "Phase 11: Profile strength analyser" },
  { key: "smart_recommendations", enabled: true, description: "Phase 11: Smart job recommendations" },
] as const;

async function main() {
  for (const flag of FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: { key: flag.key, enabled: flag.enabled, description: flag.description },
    });
  }
  console.log(`Upserted ${FEATURE_FLAGS.length} feature flags.`);

  const devEmail =
    process.env.SEED_DEV_EMAIL ?? process.env.SEED_USER_EMAIL ?? "dev@example.com";
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: { contains: "dev", mode: "insensitive" } }, { email: devEmail }],
    },
    include: { jobSeekerProfile: true },
  });
  if (!user) {
    console.warn("No dev user found (email containing 'dev' or SEED_DEV_EMAIL). Create a user with a job seeker profile first.");
    return;
  }
  const profile = user.jobSeekerProfile;
  if (!profile) {
    console.warn("Dev user has no JobSeekerProfile. Complete onboarding as job seeker first.");
    return;
  }

  const existingIntents = await prisma.careerIntent.count({
    where: { userId: user.id },
  });
  if (existingIntents >= 5) {
    console.log("User already has 5+ career intents. Skipping seed.");
    return;
  }

  const roles = [
    { targetRole: "Product Manager", targetIndustry: "Technology", level: "MANAGER" as const, goal: "Lead product strategy for a B2B SaaS company." },
    { targetRole: "Software Engineer", targetIndustry: "Fintech", level: "IC" as const, goal: "Build scalable backend systems." },
    { targetRole: "Engineering Lead", targetIndustry: "Technology", level: "TEAM_LEAD" as const, goal: "Grow and mentor a team of 5–8 engineers." },
    { targetRole: "Director of Product", targetIndustry: "Healthcare", level: "DIRECTOR" as const, goal: "Own product vision for a health-tech portfolio." },
    { targetRole: "VP Engineering", targetIndustry: "Technology", level: "VP" as const, goal: "Scale engineering org to 50+." },
  ];

  const created: string[] = [];
  for (let i = 0; i < Math.min(5 - existingIntents, roles.length); i++) {
    const r = roles[i];
    const intent = await prisma.careerIntent.create({
      data: {
        userId: user.id,
        profileId: profile.id,
        targetRole: r.targetRole,
        targetIndustry: r.targetIndustry,
        targetLevel: r.level,
        careerGoal: r.goal,
        switchingIndustry: false,
      },
    });
    created.push(intent.id);
  }
  console.log(`Created ${created.length} CareerIntents for ${user.email}.`);

  const intentIds = await prisma.careerIntent.findMany({
    where: { userId: user.id },
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const versionCount = await prisma.resumeVersion.count({ where: { userId: user.id } });
  if (versionCount >= 2) {
    console.log("User already has 2+ resume versions. Skipping version seed.");
    return;
  }
  const sampleSnapshot = {
    status: "DRAFT",
    experiences: {
      exp1: {
        company: "Acme Corp",
        designation: "Senior Engineer",
        rewrittenBullets: ["Led migration to microservices.", "Reduced latency by 40%."],
        actionVerbs: ["Led", "Reduced"],
      },
    },
    summaries: ["Results-driven engineer with 8+ years in distributed systems."],
    selectedSummaryIndex: 0,
    skills: { core: ["Leadership"], technical: ["Node.js", "PostgreSQL"], soft: ["Communication"], tools: ["Git"], hidden: [] },
  };
  for (let v = 0; v < Math.min(2 - versionCount, intentIds.length); v++) {
    const intentId = intentIds[v].id;
    const intent = await prisma.careerIntent.findUnique({
      where: { id: intentId },
      select: { targetRole: true },
    });
    await prisma.resumeVersion.create({
      data: {
        userId: user.id,
        careerIntentId: intentId,
        name: `${intent?.targetRole ?? "Resume"} — Seed`,
        templateId: "classic",
        contentSnapshot: sampleSnapshot as object,
        status: v === 0 ? "COMPLETE" : "DRAFT",
        isDefault: v === 0,
      },
    });
  }
  console.log(`Created up to 2 ResumeVersions for ${user.email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
