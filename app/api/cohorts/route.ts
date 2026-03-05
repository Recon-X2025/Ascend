/**
 * BL-9: GET list cohorts.
 */
import { NextResponse } from "next/server";
import { listCohorts } from "@/lib/cohorts";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const transitionPath = searchParams.get("transitionPath") ?? undefined;
  const cohorts = await listCohorts(transitionPath);
  return NextResponse.json({ success: true, data: cohorts });
}
