import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api/middleware";
import { prisma } from "@/lib/prisma/client";
import { storeFile, generateStorageKey } from "@/lib/storage";
import { bulkImportQueue } from "@/lib/queues";
import { canCompanyUseFeature } from "@/lib/payments/gate";

const MAX_ROWS = 500;

export async function POST(request: Request) {
  return withApiAuth(request, "jobs:write", async (req, { apiKey }) => {
    const { allowed } = await canCompanyUseFeature(apiKey.companyId, "bulkImport");
    if (!allowed) {
      return NextResponse.json(
        { error: "ENTERPRISE_REQUIRED", upgradeUrl: "/pricing" },
        { status: 402 }
      );
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "csv" && ext !== "json") {
      return NextResponse.json({ error: "File must be CSV or JSON" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let totalRows = 0;

    if (ext === "csv") {
      const text = buffer.toString("utf-8");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      totalRows = Math.max(0, lines.length - 1); // exclude header
    } else {
      try {
        const json = JSON.parse(buffer.toString("utf-8"));
        const arr = Array.isArray(json) ? json : json.jobs ?? json.data ?? [];
        totalRows = arr.length;
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    if (totalRows > MAX_ROWS) {
      return NextResponse.json(
        { error: `Max ${MAX_ROWS} rows per import`, totalRows },
        { status: 422 }
      );
    }

    const admin = await prisma.companyAdmin.findFirst({
      where: { companyId: apiKey.companyId },
      select: { userId: true },
    });
    const createdById = admin?.userId ?? apiKey.createdById;

    const s3Key = generateStorageKey(
      "bulk-import",
      apiKey.companyId,
      `${Date.now()}_${file.name}`
    );
    await storeFile(s3Key, buffer, file.type || "application/octet-stream");

    const importJob = await prisma.bulkImportJob.create({
      data: {
        companyId: apiKey.companyId,
        userId: createdById,
        type: "JOB_POSTS",
        status: "PENDING",
        totalRows,
        s3Key,
      },
    });

    await bulkImportQueue.add("process", { importJobId: importJob.id });

    return NextResponse.json({ importJobId: importJob.id });
  });
}
