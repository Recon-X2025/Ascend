/**
 * Dev-only: serve local storage files via short-lived Redis token.
 * Returns 404 in production.
 */

import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const BASE_PATH = process.env.LOCAL_STORAGE_PATH ?? "/tmp/ascend-storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { token } = await params;
  const { redis } = await import("@/lib/redis/client");
  const key = await redis.get(`local-storage-token:${token}`);
  if (!key) {
    return new NextResponse("Expired or invalid", { status: 410 });
  }

  if (key.includes("..") || path.isAbsolute(key)) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  const fullPath = path.join(BASE_PATH, key);
  try {
    const buffer = await fs.readFile(fullPath);
    const ext = path.extname(key).toLowerCase();
    const mime: Record<string, string> = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".json": "application/json",
    };
    const contentType = mime[ext] ?? "application/octet-stream";
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
