import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";
import { canCompanyUseFeature } from "@/lib/payments/gate";

const querySchema = z.object({
  jobId: z.coerce.number().int().optional(),
  status: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

function escapeCsv(str: string): string {
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  return withApiAuth(request, "applications:read", async (req, { apiKey }) => {
    const { allowed } = await canCompanyUseFeature(apiKey.companyId, "bulkImport");
    if (!allowed) {
      return NextResponse.json(
        { error: "ENTERPRISE_REQUIRED", upgradeUrl: "/pricing" },
        { status: 402 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      jobId: searchParams.get("jobId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      jobPost: { companyId: apiKey.companyId },
    };
    if (parsed.data.jobId) where.jobPostId = parsed.data.jobId;
    if (parsed.data.status) where.status = parsed.data.status;
    if (parsed.data.from || parsed.data.to) {
      where.submittedAt = {};
      if (parsed.data.from) (where.submittedAt as Record<string, Date>).gte = new Date(parsed.data.from);
      if (parsed.data.to) (where.submittedAt as Record<string, Date>).lte = new Date(parsed.data.to);
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        updatedAt: true,
        applicant: { select: { name: true, email: true } },
        jobPost: { select: { title: true } },
      },
    });

    const headers = [
      "applicationId",
      "candidateName",
      "candidateEmail",
      "jobTitle",
      "status",
      "appliedAt",
      "lastUpdatedAt",
    ];
    const rows = applications.map((a) => [
      a.id,
      a.applicant.name ?? "",
      a.applicant.email ?? "",
      a.jobPost.title ?? "",
      a.status,
      a.submittedAt.toISOString(),
      a.updatedAt.toISOString(),
    ]);

    const csv =
      headers.map(escapeCsv).join(",") +
      "\n" +
      rows.map((r) => r.map(escapeCsv).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="applications-${Date.now()}.csv"`,
      },
    });
  });
}
