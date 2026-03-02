import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url().optional(),
  affiliateCode: z.string().nullable().optional(),
  priceInr: z.number().int().min(0).nullable().optional(),
  durationHours: z.number().int().min(0).nullable().optional(),
  level: z.string().nullable().optional(),
  language: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid body", issues: parsed.error.issues }, { status: 400 });

  const course = await prisma.courseRecommendation.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.url !== undefined && { url: parsed.data.url }),
      ...(parsed.data.affiliateCode !== undefined && { affiliateCode: parsed.data.affiliateCode }),
      ...(parsed.data.priceInr !== undefined && { priceInr: parsed.data.priceInr }),
      ...(parsed.data.durationHours !== undefined && { durationHours: parsed.data.durationHours }),
      ...(parsed.data.level !== undefined && { level: parsed.data.level }),
      ...(parsed.data.language !== undefined && { language: parsed.data.language }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
  });

  return NextResponse.json({ course: { id: course.id, title: course.title, isActive: course.isActive } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.courseRecommendation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
