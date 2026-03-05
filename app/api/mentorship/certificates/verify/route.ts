/**
 * BL-14: Certificate verification API (public).
 */
import { NextResponse } from "next/server";
import { verifyCertificate } from "@/lib/mentorship/certificates";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ success: false, error: "code required" }, { status: 400 });
  const result = await verifyCertificate(code);
  return NextResponse.json({ success: true, data: result });
}
