import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

/** GET /api/health - Diagnostic: tests DB connectivity. Remove in production. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: "connected",
      env: process.env.DATABASE_URL ? "DATABASE_URL set" : "DATABASE_URL missing",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, db: "failed", error: msg },
      { status: 500 }
    );
  }
}
