import { NextResponse } from "next/server";
import { resolveDomainToSlug } from "@/lib/careers/domain-resolver";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const host = searchParams.get("host");
  if (!host) {
    return NextResponse.json({ success: false, error: "Missing host" }, { status: 400 });
  }
  const slug = await resolveDomainToSlug(host);
  return NextResponse.json({ slug });
}
