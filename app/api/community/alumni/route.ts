/**
 * BL-15: Alumni count API. Accepts company names, returns aggregate counts.
 */
import { NextResponse } from "next/server";
import { getAlumniCountsForCompanies } from "@/lib/community/alumni";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companies = searchParams.get("companies");
  const list = companies ? companies.split(",").map((c) => c.trim()).filter(Boolean) : [];
  const data = await getAlumniCountsForCompanies(list);
  return NextResponse.json({ success: true, data });
}
