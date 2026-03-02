import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { getFileUrl } from "@/lib/storage";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  let where: Prisma.MentorVerificationWhereInput = { status: "PENDING" };
  if (statusParam === "REVERIFICATION_REQUIRED") {
    where = { status: "REVERIFICATION_REQUIRED" };
  } else if (statusParam === "VERIFIED") {
    where = { status: "VERIFIED" };
  } else if (statusParam === "REJECTED") {
    where = { status: "UNVERIFIED", auditLog: { some: { decision: "REJECTED" } } };
  } else if (statusParam === "NEEDS_INFO") {
    where = { status: "PENDING", auditLog: { some: { decision: "MORE_INFO_REQUESTED" } } };
  } else {
    where = { status: "PENDING" };
  }

  const [items, total] = await Promise.all([
    prisma.mentorVerification.findMany({
      where,
      include: {
        mentorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        documents: true,
        auditLog: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { submittedAt: "asc" },
      skip: page * limit,
      take: limit,
    }),
    prisma.mentorVerification.count({ where }),
  ]);

  const list = await Promise.all(
    items.map(async (v) => {
      const submittedAt = v.submittedAt ?? new Date(0);
      const hoursSince = (Date.now() - submittedAt.getTime()) / (1000 * 60 * 60);
      let slaIndicator: "green" | "amber" | "red" = "green";
      if (hoursSince > 36) slaIndicator = "red";
      else if (hoursSince > 24) slaIndicator = "amber";

      const documentsWithUrls = await Promise.all(
        v.documents.map(async (d) => ({
          id: d.id,
          type: d.type,
          fileName: d.fileName,
          fileUrl: await getFileUrl(d.fileUrl),
          uploadedAt: d.uploadedAt,
          accepted: d.accepted,
        }))
      );

      return {
        id: v.id,
        mentorProfileId: v.mentorProfileId,
        mentorUserId: v.mentorProfile.user.id,
        status: v.status,
        submittedAt: v.submittedAt,
        mentorName: v.mentorProfile.user.name,
        mentorEmail: v.mentorProfile.user.email,
        headline: v.mentorProfile.currentRole,
        linkedInUrl: v.linkedInUrl,
        documents: documentsWithUrls,
        auditLog: v.auditLog,
        slaIndicator,
        hoursSinceSubmission: Math.round(hoursSince * 10) / 10,
      };
    })
  );

  return NextResponse.json({
    items: list,
    total,
    page,
    limit,
  });
}
