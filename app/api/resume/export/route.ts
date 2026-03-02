import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { exportToPDF, exportToDOCX, getVersionForExport } from "@/lib/resume/export";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("versionId");
  const format = searchParams.get("format");
  if (!versionId || !format) {
    return NextResponse.json(
      { success: false, error: "versionId and format (pdf|docx) are required" },
      { status: 400 }
    );
  }
  const data = await getVersionForExport(versionId);
  if (!data) {
    return NextResponse.json({ success: false, error: "Resume version not found" }, { status: 404 });
  }
  if (data.version.userId !== userId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    if (format === "pdf") {
      const { buffer, filename } = await exportToPDF(versionId);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(buffer.length),
        },
      });
    }
    if (format === "docx") {
      const { buffer, filename } = await exportToDOCX(versionId);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(buffer.length),
        },
      });
    }
    return NextResponse.json({ success: false, error: "format must be pdf or docx" }, { status: 400 });
  } catch (err) {
    console.error("[resume/export]", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}
