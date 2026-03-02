import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { requestOTP } from "@/lib/mentorship/contract";
import { reportRateLimitHit } from "@/lib/rate-limit";

const OTP_TTL_SECONDS = 600;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await params;

  const contract = await prisma.mentorshipContract.findUnique({
    where: { id: contractId },
  });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  if (contract.mentorUserId !== session.user.id && contract.menteeUserId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const role = contract.mentorUserId === session.user.id ? "MENTOR" : "MENTEE";
  const isMentorTurn = contract.status === "PENDING_MENTOR_SIGNATURE";
  const isMenteeTurn = contract.status === "PENDING_MENTEE_SIGNATURE";
  if ((isMentorTurn && role !== "MENTOR") || (isMenteeTurn && role !== "MENTEE")) {
    return NextResponse.json(
      { error: "Not your turn to sign" },
      { status: 400 }
    );
  }
  const deadline = role === "MENTOR" ? contract.mentorSignDeadline : contract.menteeSignDeadline;
  if (deadline && new Date() > deadline) {
    return NextResponse.json(
      { error: "Signing deadline has passed" },
      { status: 400 }
    );
  }

  try {
    await requestOTP(session.user.id, contractId);
    return NextResponse.json({ sent: true, expiresInSeconds: OTP_TTL_SECONDS });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    if (message.includes("Too many")) {
      reportRateLimitHit(
        req,
        `contract-otp:${session.user.id}:${contractId}`,
        3,
        600,
        session.user.id
      ).catch(() => {});
      return NextResponse.json(
        { error: message, code: "OTP_RATE_LIMIT" },
        { status: 429 }
      );
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
