import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const pathSegments = (await params).path;
  if (!pathSegments?.length) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  const key = pathSegments.join(path.sep);
  if (key.includes("..") || path.isAbsolute(key)) {
    return NextResponse.json({ success: false, error: "Invalid path" }, { status: 400 });
  }
  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(key).toLowerCase();
    const mime: Record<string, string> = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    const contentType = mime[ext] ?? "application/octet-stream";
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
}
