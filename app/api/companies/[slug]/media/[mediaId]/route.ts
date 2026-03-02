import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";
import { removeFile } from "@/lib/storage";

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string; mediaId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug, mediaId } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  if (!(await isCompanyOwnerOrAdmin(userId, company.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const media = await prisma.companyMedia.findFirst({ where: { id: mediaId, companyId: company.id } });
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (media.type === "PHOTO" && media.url) await removeFile(media.url).catch(() => {});
  await prisma.companyMedia.delete({ where: { id: mediaId } });
  return NextResponse.json({ message: "Deleted." });
}
