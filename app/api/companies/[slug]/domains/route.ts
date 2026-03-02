import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;
const bodySchema = z.object({
  domains: z.array(z.string().min(1).max(253).refine((d) => domainRegex.test(d) && !d.startsWith("http") && !d.includes("*"))).max(20),
});

type Params = { params: Promise<{ slug: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }
  const admin = await prisma.companyAdmin.findFirst({
    where: { companyId: company.id, userId: session.user.id },
  });
  if (!admin || (admin.role !== "ADMIN" && role !== "PLATFORM_ADMIN")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const domains = parsed.data.domains.map((d) => d.toLowerCase());
  await prisma.company.update({
    where: { id: company.id },
    data: { verifiedDomains: domains },
  });
  return NextResponse.json({ domains });
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    select: { id: true, verifiedDomains: true },
  });
  if (!company) {
    return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
  }
  const admin = await prisma.companyAdmin.findFirst({
    where: { companyId: company.id, userId: session.user.id },
  });
  const role = (session.user as { role?: string }).role;
  if (!admin && role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ domains: company.verifiedDomains ?? [] });
}
