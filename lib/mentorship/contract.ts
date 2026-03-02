/**
 * M-5: Contract generation, OTP signing, PDF, integrity, expiry.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import type { MentorshipContract } from "@prisma/client";
import { redis } from "@/lib/redis/client";
import {
  type ContractContent,
  CONTRACT_TC_VERSION,
  CONTRACT_CLAUSES,
  maskEmail,
} from "./contract-types";
import { DEFAULT_ESCROW_FEE_PAISE } from "@/lib/escrow/config";
import { track } from "@/lib/analytics/track";
import { storeFile, getFileBuffer, getSignedDownloadUrlWithExpiry } from "@/lib/storage";
import { contractPdfQueue } from "@/lib/queues";

const OTP_TTL_SECONDS = 600; // 10 min
const OTP_RATE_LIMIT_KEY = (contractId: string, userId: string) =>
  `contract-otp-limit:${contractId}:${userId}`;
const OTP_RATE_LIMIT_MAX = 3;
const OTP_RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour
const CONTRACT_OTP_KEY = (contractId: string, userId: string) =>
  `contract-otp:${contractId}:${userId}`;
const SIGNING_DEADLINE_HOURS = 48;
const CONTRACTS_S3_PREFIX = "contracts";
const GOVERNING_ACTS = [
  "Indian Contract Act 1872",
  "IT Act 2000",
  "Consumer Protection Act 2019",
];
const JURISDICTION = "Bangalore, India";

const ENGAGEMENT_SESSION_COUNT: Record<string, number> = {
  SPRINT_30: 4,
  STANDARD_60: 6,
  DEEP_90: 9,
};
const ENGAGEMENT_DURATION_MINS: Record<string, number> = {
  SPRINT_30: 45,
  STANDARD_60: 60,
  DEEP_90: 90,
};

export type { ContractContent };

/**
 * Assembles contract content from application + mentor + mentee data. Does NOT persist.
 */
export async function generateContractContent(
  applicationId: string
): Promise<ContractContent> {
  const application = await prisma.mentorApplication.findUnique({
    where: { id: applicationId },
    include: {
      mentorProfile: {
        include: {
          user: { select: { name: true, email: true } },
          verification: { select: { verifiedAt: true } },
        },
      },
      mentee: {
        select: {
          id: true,
          name: true,
          email: true,
          jobSeekerProfile: {
            select: { currentRole: true },
          },
          careerContext: { select: { targetRole: true } },
          careerIntents: {
            take: 1,
            orderBy: { updatedAt: "desc" },
            select: { targetRole: true },
          },
        },
      },
    },
  });

  if (!application) throw new Error("Application not found");
  const mentorUser = application.mentorProfile.user;
  const menteeUser = application.mentee as {
    id: string;
    name: string | null;
    email: string;
    jobSeekerProfile: { currentRole: string | null } | null;
    careerContext: { targetRole: string | null } | null;
    careerIntents: { targetRole: string }[];
  };
  const mentorProfile = application.mentorProfile;
  const verifiedAt = application.mentorProfile.verification?.verifiedAt ?? mentorProfile.verifiedAt;
  const engagementType =
    mentorProfile.engagementPreference?.[0] ?? "STANDARD_60";
  const sessionFrequency = mentorProfile.sessionFrequency ?? "WEEKLY";
  const sessionCount = ENGAGEMENT_SESSION_COUNT[engagementType] ?? 6;
  const sessionDurationMins = ENGAGEMENT_DURATION_MINS[engagementType] ?? 60;

  const menteeTargetRole =
    menteeUser.careerIntents[0]?.targetRole ??
    menteeUser.careerContext?.targetRole ??
    "Not specified";
  const menteeCurrentRole =
    menteeUser.jobSeekerProfile?.currentRole ?? "Not specified";

  return {
    mentor: {
      fullName: mentorUser.name ?? "Mentor",
      verifiedRole: mentorProfile.toRole ?? mentorProfile.currentRole,
      verifiedCompany: mentorProfile.currentCompany ?? mentorProfile.fromCompanyType ?? "—",
      verifiedIndustry: mentorProfile.toIndustry ?? mentorProfile.fromIndustry ?? "—",
      verificationDate: verifiedAt
        ? new Date(verifiedAt).toISOString().slice(0, 10)
        : "—",
      email: maskEmail(mentorUser.email ?? ""),
    },
    mentee: {
      fullName: menteeUser.name ?? "Mentee",
      targetRole: menteeTargetRole,
      currentRole: menteeCurrentRole,
      email: maskEmail(menteeUser.email),
    },
    engagementScope: {
      goal: application.goalStatement,
      commitment: application.commitment,
      timeline: application.timeline,
      engagementType,
      sessionCount,
      sessionFrequency: sessionFrequency === "WEEKLY" ? "Weekly" : "Fortnightly",
      sessionDurationMins,
    },
    financial: {
      totalFeeINR: null,
      trancheStructure: null,
      platformFeePct: null,
      pilotFeeWaived: true,
    },
    clauses: {
      ...CONTRACT_CLAUSES,
      disputeResolutionProcess: CONTRACT_CLAUSES.disputeResolutionProcess,
    },
    governingLaw: {
      acts: GOVERNING_ACTS,
      jurisdiction: JURISDICTION,
    },
    tcVersion: CONTRACT_TC_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * M-12: Assembles contract content for circle cohort. No MentorApplication.
 */
async function generateCircleContractContent(params: {
  mentorId: string;
  menteeId: string;
  circleId: string;
  agreedFeePaise: number;
}): Promise<ContractContent> {
  const [mentor, mentee, circle] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.mentorId },
      include: {
        mentorProfile: {
          include: {
            verification: { select: { verifiedAt: true } },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: params.menteeId },
      select: {
        name: true,
        email: true,
        jobSeekerProfile: { select: { currentRole: true } },
        careerContext: { select: { targetRole: true } },
        careerIntents: {
          take: 1,
          orderBy: { updatedAt: "desc" as const },
          select: { targetRole: true },
        },
      },
    }),
    prisma.mentorshipCircle.findUnique({
      where: { id: params.circleId },
      select: { title: true },
    }),
  ]);

  if (!mentor?.mentorProfile) throw new Error("Mentor not found");
  if (!mentee) throw new Error("Mentee not found");
  if (!circle) throw new Error("Circle not found");

  const mentorProfile = mentor.mentorProfile;
  const verifiedAt = mentorProfile.verification?.verifiedAt ?? mentorProfile.verifiedAt;
  const menteeTargetRole =
    (mentee as { careerIntents?: { targetRole: string }[] }).careerIntents?.[0]?.targetRole ??
    (mentee as { careerContext?: { targetRole: string | null } }).careerContext?.targetRole ??
    "Not specified";
  const menteeCurrentRole =
    (mentee as { jobSeekerProfile?: { currentRole: string | null } }).jobSeekerProfile?.currentRole ?? "Not specified";

  const sessionCount = 8;
  const sessionDurationMins = 90;

  return {
    mentor: {
      fullName: mentor.name ?? "Mentor",
      verifiedRole: mentorProfile.toRole ?? mentorProfile.currentRole,
      verifiedCompany: mentorProfile.currentCompany ?? mentorProfile.fromCompanyType ?? "—",
      verifiedIndustry: mentorProfile.toIndustry ?? mentorProfile.fromIndustry ?? "—",
      verificationDate: verifiedAt
        ? new Date(verifiedAt).toISOString().slice(0, 10)
        : "—",
      email: maskEmail(mentor.email ?? ""),
    },
    mentee: {
      fullName: mentee.name ?? "Mentee",
      targetRole: menteeTargetRole,
      currentRole: menteeCurrentRole,
      email: maskEmail(mentee.email),
    },
    engagementScope: {
      goal: `Mentorship Circle: ${circle.title}`,
      commitment: "Participate in group sessions and milestones per cohort schedule.",
      timeline: "90 days",
      engagementType: "DEEP_90",
      sessionCount,
      sessionFrequency: "Weekly",
      sessionDurationMins,
    },
    financial: {
      totalFeeINR: params.agreedFeePaise / 100,
      trancheStructure: null,
      platformFeePct: null,
      pilotFeeWaived: true,
    },
    clauses: {
      ...CONTRACT_CLAUSES,
      disputeResolutionProcess: CONTRACT_CLAUSES.disputeResolutionProcess,
    },
    governingLaw: {
      acts: GOVERNING_ACTS,
      jurisdiction: JURISDICTION,
    },
    tcVersion: CONTRACT_TC_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

/** M-12: Create contract for circle member. No MentorApplication; contractType CIRCLE. */
export async function createContractForCircle(params: {
  mentorId: string;
  menteeId: string;
  circleId: string;
  circleMemberId: string;
  agreedFeePaise: number;
}): Promise<MentorshipContract> {
  const existing = await prisma.mentorshipContract.findFirst({
    where: { circleMemberId: params.circleMemberId },
  });
  if (existing) return existing;

  const contractContent = await generateCircleContractContent({
    mentorId: params.mentorId,
    menteeId: params.menteeId,
    circleId: params.circleId,
    agreedFeePaise: params.agreedFeePaise,
  });

  const now = new Date();
  const mentorSignDeadline = new Date(now.getTime() + SIGNING_DEADLINE_HOURS * 60 * 60 * 1000);

  const contract = await prisma.mentorshipContract.create({
    data: {
      contractType: "CIRCLE",
      circleMemberId: params.circleMemberId,
      mentorUserId: params.mentorId,
      menteeUserId: params.menteeId,
      status: "PENDING_MENTOR_SIGNATURE",
      engagementType: "DEEP",
      agreedFeePaise: params.agreedFeePaise,
      contractContent: contractContent as object,
      tcVersion: CONTRACT_TC_VERSION,
      mentorSignDeadline,
    },
  });

  const { logMentorshipAction } = await import("@/lib/mentorship/audit");
  await logMentorshipAction({
    actorId: params.mentorId,
    action: "CONTRACT_CREATED",
    category: "CONTRACT",
    entityType: "MentorshipContract",
    entityId: contract.id,
    newState: { status: contract.status, contractType: "CIRCLE", engagementType: "DEEP" },
  });

  const mentor = await prisma.user.findUnique({
    where: { id: params.mentorId },
    select: { email: true, name: true },
  });
  await track("contract_generated", { contractId: contract.id, circleId: params.circleId });
  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendContractReadyToSignToMentor } = await import(
    "@/lib/email/templates/mentorship/contract-ready-to-sign-mentor"
  );
  if (mentor?.email) {
    await sendContractReadyToSignToMentor({
      to: mentor.email,
      mentorName: mentor.name ?? "Mentor",
      contractUrl: `${baseUrl}/mentorship/contracts/${contract.id}`,
      signDeadline: mentorSignDeadline,
    });
  }
  return contract;
}

/**
 * Creates contract, sets mentor sign deadline, emails mentor. Called when mentor accepts application.
 */
export async function createContract(
  applicationId: string
): Promise<MentorshipContract> {
  const application = await prisma.mentorApplication.findUnique({
    where: { id: applicationId },
    include: {
      mentorProfile: { include: { user: { select: { id: true, email: true, name: true } } } },
      mentee: { select: { id: true } },
    },
  });
  if (!application) throw new Error("Application not found");
  if (application.status !== "ACCEPTED") {
    throw new Error("Application must be ACCEPTED to create contract");
  }
  const existing = await prisma.mentorshipContract.findUnique({
    where: { mentorApplicationId: applicationId },
  });
  if (existing) return existing;

  const contractContent = await generateContractContent(applicationId);
  const now = new Date();
  const mentorSignDeadline = new Date(now.getTime() + SIGNING_DEADLINE_HOURS * 60 * 60 * 1000);
  // M-8: map mentor profile engagement length to EngagementType (default STANDARD)
  const rawType = contractContent.engagementScope.engagementType;
  const engagementType =
    rawType === "SPRINT_30"
      ? "SPRINT"
      : rawType === "DEEP_90"
        ? "DEEP"
        : "STANDARD";

  const contract = await prisma.mentorshipContract.create({
    data: {
      mentorApplicationId: applicationId,
      mentorUserId: application.mentorProfile.userId,
      menteeUserId: application.menteeId,
      status: "PENDING_MENTOR_SIGNATURE",
      engagementType,
      agreedFeePaise: DEFAULT_ESCROW_FEE_PAISE[engagementType],
      contractContent: contractContent as object,
      tcVersion: CONTRACT_TC_VERSION,
      mentorSignDeadline,
    },
  });

  const { logMentorshipAction } = await import("@/lib/mentorship/audit");
  await logMentorshipAction({
    actorId: application.mentorProfile.userId,
    action: "CONTRACT_CREATED",
    category: "CONTRACT",
    entityType: "MentorshipContract",
    entityId: contract.id,
    newState: { status: contract.status, engagementType },
  });

  await prisma.mentorProfile.update({
    where: { id: application.mentorProfileId },
    data: { currentMenteeCount: { increment: 1 } },
  });

  await track("contract_generated", { contractId: contract.id, applicationId });
  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendContractReadyToSignToMentor } = await import(
    "@/lib/email/templates/mentorship/contract-ready-to-sign-mentor"
  );
  await sendContractReadyToSignToMentor({
    to: application.mentorProfile.user.email!,
    mentorName: application.mentorProfile.user.name ?? "Mentor",
    contractUrl: `${baseUrl}/mentorship/contracts/${contract.id}`,
    signDeadline: mentorSignDeadline,
  });
  return contract;
}

/**
 * Request OTP for signing: rate-limited (3/hr per contract per user), stored in Redis 10min, email sent.
 */
export async function requestOTP(userId: string, contractId: string): Promise<void> {
  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: { mentor: { select: { email: true, name: true } }, mentee: { select: { email: true, name: true } } },
  });
  if (!contract) throw new Error("Contract not found");
  if (contract.mentorUserId !== userId && contract.menteeUserId !== userId) {
    throw new Error("Not a party to this contract");
  }
  const role = contract.mentorUserId === userId ? "MENTOR" : "MENTEE";
  const isMentorTurn = contract.status === "PENDING_MENTOR_SIGNATURE";
  const isMenteeTurn = contract.status === "PENDING_MENTEE_SIGNATURE";
  if ((isMentorTurn && role !== "MENTOR") || (isMenteeTurn && role !== "MENTEE")) {
    throw new Error("Not your turn to sign");
  }
  const deadline = role === "MENTOR" ? contract.mentorSignDeadline : contract.menteeSignDeadline;
  if (deadline && new Date() > deadline) {
    throw new Error("Signing deadline has passed");
  }

  const limitKey = OTP_RATE_LIMIT_KEY(contractId, userId);
  const count = await redis.incr(limitKey);
  if (count === 1) await redis.expire(limitKey, OTP_RATE_LIMIT_WINDOW_SECONDS);
  if (count > OTP_RATE_LIMIT_MAX) {
    throw new Error("Too many OTP requests. Try again later.");
  }

  const otp = String(Math.floor(100_000 + Math.random() * 900_000));
  const hash = crypto.createHash("sha256").update(otp).digest("hex");
  const key = CONTRACT_OTP_KEY(contractId, userId);
  await redis.setex(key, OTP_TTL_SECONDS, hash);

  const email = role === "MENTOR" ? contract.mentor.email : contract.mentee.email;
  const { sendContractOTP } = await import("@/lib/email/templates/mentorship/contract-otp");
  await sendContractOTP({ to: email, otp });

  await track("contract_otp_requested", { contractId, userId });
}

/**
 * Verify OTP and create signature. Updates status (MENTEE sign → ACTIVE, queue PDF). Returns updated contract.
 */
export async function verifyOTPAndSign(
  userId: string,
  contractId: string,
  otp: string,
  ipAddress: string,
  userAgent: string
): Promise<MentorshipContract> {
  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: {
      mentor: { select: { email: true, name: true } },
      mentee: { select: { email: true, name: true } },
      circleMember: { select: { id: true } },
    },
  });
  if (!contract) throw new Error("Contract not found");
  if (contract.mentorUserId !== userId && contract.menteeUserId !== userId) {
    throw new Error("Not a party to this contract");
  }
  const role = contract.mentorUserId === userId ? "MENTOR" : "MENTEE";
  const isMentorTurn = contract.status === "PENDING_MENTOR_SIGNATURE";
  const isMenteeTurn = contract.status === "PENDING_MENTEE_SIGNATURE";
  if ((isMentorTurn && role !== "MENTOR") || (isMenteeTurn && role !== "MENTEE")) {
    throw new Error("Not your turn to sign");
  }

  const key = CONTRACT_OTP_KEY(contractId, userId);
  const storedHash = await redis.get(key);
  if (!storedHash) {
    throw new Error("OTP_EXPIRED");
  }
  const hash = crypto.createHash("sha256").update(otp).digest("hex");
  if (hash !== storedHash) {
    throw new Error("INVALID_OTP");
  }
  await redis.del(key);

  const fullName = role === "MENTOR" ? contract.mentor.name ?? "Mentor" : contract.mentee.name ?? "Mentee";
  const declaration = `I, ${fullName}, agree to the terms of this Engagement Contract.`;
  const now = new Date();

  await prisma.contractSignature.create({
    data: {
      contractId,
      signerUserId: userId,
      signerRole: role,
      otpRequestedAt: now, // approximate; real requested-at could be stored in Redis if needed
      otpVerifiedAt: now,
      ipAddress,
      userAgent,
      declaration,
    },
  });

  const { logMentorshipAction } = await import("@/lib/mentorship/audit");
  await logMentorshipAction({
    actorId: userId,
    action: "CONTRACT_SIGNED",
    category: "CONTRACT",
    entityType: "MentorshipContract",
    entityId: contractId,
    newState: { signerRole: role, status: role === "MENTOR" ? "PENDING_MENTEE_SIGNATURE" : "ACTIVE" },
  });

  if (role === "MENTOR") {
    await track("contract_signed_mentor", { contractId, userId });
    const menteeSignDeadline = new Date(now.getTime() + SIGNING_DEADLINE_HOURS * 60 * 60 * 1000);
    await prisma.mentorshipContract.update({
      where: { id: contractId },
      data: { status: "PENDING_MENTEE_SIGNATURE", menteeSignDeadline },
    });
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const { sendContractMenteeTurn } = await import(
      "@/lib/email/templates/mentorship/contract-mentee-turn"
    );
    await sendContractMenteeTurn({
      to: contract.mentee.email,
      menteeName: contract.mentee.name ?? "Mentee",
      contractUrl: `${baseUrl}/mentorship/contracts/${contractId}`,
      signDeadline: menteeSignDeadline,
    });
  } else {
    await track("contract_signed_mentee", { contractId, userId });
    await prisma.mentorshipContract.update({
      where: { id: contractId },
      data: { status: "ACTIVE", activatedAt: now },
    });
    const isCircle = contract.contractType === "CIRCLE";
    if (contract.circleMemberId && contract.circleMember) {
      await prisma.circleMember.update({
        where: { id: contract.circleMember.id },
        data: { status: "CONFIRMED", confirmedAt: now },
      });
    }
    if (!isCircle) {
      const { incrementActiveMenteeCount } = await import("@/lib/mentorship/tiers");
      await incrementActiveMenteeCount(contract.mentorUserId);
      const { initialiseEngagement } = await import("@/lib/mentorship/engagement");
      await initialiseEngagement(contractId);
    }
    await contractPdfQueue.add("generate", { contractId });
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const { sendContractActive } = await import("@/lib/email/templates/mentorship/contract-active");
    await sendContractActive({
      mentorEmail: contract.mentor.email,
      menteeEmail: contract.mentee.email,
      mentorName: contract.mentor.name ?? "Mentor",
      menteeName: contract.mentee.name ?? "Mentee",
      contractUrl: `${baseUrl}/mentorship/contracts/${contractId}`,
    });
  }

  const updated = await prisma.mentorshipContract.findUniqueOrThrow({
    where: { id: contractId },
  });
  return updated;
}

/**
 * BullMQ job: render contract HTML, generate PDF, upload to S3, set pdfUrl/pdfHash/pdfGeneratedAt, email both.
 */
export async function generateContractPDF(contractId: string): Promise<void> {
  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
  });
  if (!contract || contract.status !== "ACTIVE") {
    throw new Error("Contract not found or not active");
  }
  const content = contract.contractContent as unknown as ContractContent;
  const { renderContractHtml } = await import("./contract-pdf-template");
  const html = renderContractHtml(content, contract.id);
  const pdfBuffer = await renderHtmlToPdf(html);
  const pdfHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");
  const key = `${CONTRACTS_S3_PREFIX}/${contractId}.pdf`;
  await storeFile(key, pdfBuffer, "application/pdf");

  await prisma.mentorshipContract.update({
    where: { id: contractId },
    data: {
      pdfUrl: key,
      pdfHash,
      pdfGeneratedAt: new Date(),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const { sendContractPdfReady } = await import(
    "@/lib/email/templates/mentorship/contract-pdf-ready"
  );
  const contractWithParties = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: { mentor: { select: { email: true, name: true } }, mentee: { select: { email: true, name: true } } },
  });
  if (contractWithParties?.mentor.email && contractWithParties?.mentee.email) {
    await sendContractPdfReady({
      mentorEmail: contractWithParties.mentor.email,
      menteeEmail: contractWithParties.mentee.email,
      contractUrl: `${baseUrl}/mentorship/contracts/${contractId}`,
    });
  }
}

async function renderHtmlToPdf(html: string): Promise<Buffer> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    });
    await browser.close();
    return Buffer.from(pdf);
  } catch {
    const { createPdfFromHtml } = await import("./contract-pdf-fallback");
    return createPdfFromHtml(html);
  }
}

/**
 * Fetches PDF from S3, recomputes SHA-256, compares. On mismatch: set DISPUTED, notify both, return flagged.
 */
export async function verifyContractIntegrity(
  contractId: string
): Promise<{ valid: boolean; flagged: boolean }> {
  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
    include: { mentor: { select: { email: true } }, mentee: { select: { email: true } } },
  });
  if (!contract?.pdfUrl || !contract.pdfHash) {
    return { valid: true, flagged: false };
  }
  const buffer = await getFileBuffer(contract.pdfUrl);
  if (!buffer) {
    return { valid: false, flagged: false };
  }
  const computed = crypto.createHash("sha256").update(buffer).digest("hex");
  if (computed !== contract.pdfHash) {
    await prisma.mentorshipContract.update({
      where: { id: contractId },
      data: { status: "DISPUTED" },
    });
    const { decrementActiveMenteeCount } = await import("@/lib/mentorship/tiers");
    await decrementActiveMenteeCount(contract.mentorUserId);
    await track("contract_flagged", { contractId });
    const { sendContractFlagged } = await import(
      "@/lib/email/templates/mentorship/contract-flagged"
    );
    if (contract.mentor.email) await sendContractFlagged({ to: contract.mentor.email, contractId });
    if (contract.mentee.email) await sendContractFlagged({ to: contract.mentee.email, contractId });
    return { valid: false, flagged: true };
  }
  return { valid: true, flagged: false };
}

/**
 * Cron: void contracts past sign deadline, restore mentor capacity, notify both.
 */
export async function expireUnsignedContracts(): Promise<void> {
  const now = new Date();
  const pendingMentor = await prisma.mentorshipContract.findMany({
    where: {
      status: "PENDING_MENTOR_SIGNATURE",
      mentorSignDeadline: { lt: now },
    },
    include: {
      mentor: { select: { email: true, mentorProfile: { select: { id: true } } } },
      mentee: { select: { email: true } },
      mentorApplication: { include: { mentorProfile: { select: { id: true } } } },
    },
  });
  const pendingMentee = await prisma.mentorshipContract.findMany({
    where: {
      status: "PENDING_MENTEE_SIGNATURE",
      menteeSignDeadline: { lt: now },
    },
    include: {
      mentor: { select: { email: true, mentorProfile: { select: { id: true } } } },
      mentee: { select: { email: true } },
      mentorApplication: { include: { mentorProfile: { select: { id: true } } } },
    },
  });
  const toVoid = [...pendingMentor, ...pendingMentee];
  const systemActorId = process.env.M16_SYSTEM_ACTOR_ID;
  for (const c of toVoid) {
    await prisma.mentorshipContract.update({
      where: { id: c.id },
      data: { status: "VOID", voidedAt: now },
    });
    try {
      const { voidEscrow } = await import("@/lib/escrow");
      await voidEscrow(c.id);
    } catch (e) {
      console.error("[expireUnsignedContracts] voidEscrow failed:", e);
    }
    const mentorProfileId =
      c.mentorApplication?.mentorProfile?.id ?? c.mentor.mentorProfile?.id;
    const isCircle = (c as { contractType?: string }).contractType === "CIRCLE";
    if (mentorProfileId && !isCircle) {
      await prisma.mentorProfile.update({
        where: { id: mentorProfileId },
        data: { currentMenteeCount: { decrement: 1 } },
      });
    }
    if (systemActorId) {
      const { logMentorshipAction } = await import("@/lib/mentorship/audit");
      await logMentorshipAction({
        actorId: systemActorId,
        action: "CONTRACT_EXPIRED",
        category: "CONTRACT",
        entityType: "MentorshipContract",
        entityId: c.id,
        newState: { status: "VOID", voidedAt: now.toISOString() },
        reason: "Signing deadline expired",
      });
    }
    await track("contract_voided", { contractId: c.id, reason: "sign_deadline_expired" });
    const { sendContractVoided } = await import(
      "@/lib/email/templates/mentorship/contract-voided"
    );
    if (c.mentor.email) await sendContractVoided({ to: c.mentor.email, contractId: c.id, reason: "signing_deadline" });
    if (c.mentee.email) await sendContractVoided({ to: c.mentee.email, contractId: c.id, reason: "signing_deadline" });
  }
}

export function getContractDownloadKey(contract: MentorshipContract): string | null {
  return contract.pdfUrl ?? null;
}

export async function getContractSignedDownloadUrl(
  key: string,
  expiresInSeconds: number
): Promise<string> {
  return getSignedDownloadUrlWithExpiry(key, expiresInSeconds);
}
