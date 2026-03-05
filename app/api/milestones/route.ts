/**
 * BL-10: POST create milestone, GET eligible.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import {
  createContractCompletedMilestone,
  createTierAchievedMilestone,
  getEligibleContractMilestones,
  getEligibleTierMilestones,
} from "@/lib/milestones/career";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const type = body.type as string | undefined;
  const contractId = body.contractId as string | undefined;
  const tierHistoryId = body.tierHistoryId as string | undefined;

  let result: { ok: boolean; slug?: string; error?: string };
  if (type === "CONTRACT_COMPLETED" && contractId) {
    result = await createContractCompletedMilestone(contractId, session.user.id);
  } else if (type === "TIER_ACHIEVED" && tierHistoryId) {
    result = await createTierAchievedMilestone(tierHistoryId, session.user.id);
  } else {
    return NextResponse.json(
      { success: false, error: "type and contractId or tierHistoryId required" },
      { status: 400 }
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error ?? "Failed" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  return NextResponse.json({
    success: true,
    slug: result.slug,
    shareUrl: `${baseUrl}/milestones/${result.slug}`,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [contracts, tiers] = await Promise.all([
    getEligibleContractMilestones(session.user.id),
    getEligibleTierMilestones(session.user.id),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      contracts: contracts.filter((c) => !c.hasMilestone),
      tiers: tiers.filter((t) => !t.hasMilestone),
    },
  });
}
