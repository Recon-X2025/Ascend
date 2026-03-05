/**
 * BL-9: GET cohort by slug.
 */
import { NextResponse } from "next/server";
import { getCohortBySlug } from "@/lib/cohorts";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cohort = await getCohortBySlug(slug);
  if (!cohort) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: cohort });
}
