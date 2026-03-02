import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, "jobs:write", async (_req, { apiKey }) => {
    const { id } = await params;

    const job = await prisma.bulkImportJob.findFirst({
      where: { id, companyId: apiKey.companyId },
    });

    if (!job) {
      return NextResponse.json({ error: "Import job not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: job.id,
        status: job.status,
        totalRows: job.totalRows,
        processed: job.processed,
        failed: job.failed,
        errorLog: job.errorLog,
        completedAt: job.completedAt,
      },
    });
  });
}
