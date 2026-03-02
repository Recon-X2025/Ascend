import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: Request) {
  return withApiAuth(request, "candidates:read", async (req, { apiKey }) => {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { page, limit } = parsed.data;

    // Candidates who applied to this company's jobs
    const applications = await prisma.jobApplication.findMany({
      where: { jobPost: { companyId: apiKey.companyId } },
      select: { applicantId: true },
      distinct: ["applicantId"],
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { submittedAt: "desc" },
    });

    const userIds = applications.map((a) => a.applicantId);
    const total = await prisma.jobApplication.findMany({
      where: { jobPost: { companyId: apiKey.companyId } },
      select: { applicantId: true },
      distinct: ["applicantId"],
    });

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        jobSeekerProfile: {
          select: {
            currentRole: true,
            city: true,
            skills: { select: { skill: { select: { name: true } } } },
          },
        },
      },
    });

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      currentRole: u.jobSeekerProfile?.currentRole ?? null,
      location: u.jobSeekerProfile?.city ?? null,
      skills: (u.jobSeekerProfile?.skills ?? []).map((s) => s.skill.name),
    }));

    return NextResponse.json({
      data,
      total: total.length,
      page,
      limit,
      hasMore: page * limit < total.length,
    });
  });
}
