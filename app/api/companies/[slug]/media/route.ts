import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/profile/api-helpers";
import { prisma } from "@/lib/prisma/client";
import { isCompanyOwnerOrAdmin } from "@/lib/companies/permissions";
import { storeFile, generateStorageKey } from "@/lib/storage";
import { z } from "zod";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX = 5 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const company = await prisma.company.findUnique({ where: { slug }, select: { id: true } });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
  if (!(await isCompanyOwnerOrAdmin(userId, company.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const type = form.get("type") as string | null;
    const file = form.get("file") as File | null;
    const caption = (form.get("caption") as string) || null;
    if (type !== "PHOTO" || !file || !(file instanceof File))
      return NextResponse.json({ error: "type PHOTO and file required" }, { status: 400 });
    const photoCount = await prisma.companyMedia.count({ where: { companyId: company.id, type: "PHOTO" } });
    if (photoCount >= 10) return NextResponse.json({ error: "Max 10 photos" }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: "File max 5MB" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Only JPG, PNG, WebP" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = generateStorageKey("company-media", company.id, file.name || "photo.jpg");
    await storeFile(key, buffer, file.type);
    const maxOrder = await prisma.companyMedia.findFirst({ where: { companyId: company.id }, orderBy: { order: "desc" }, select: { order: true } }).then((r) => (r ? r.order : -1));
    const media = await prisma.companyMedia.create({ data: { companyId: company.id, type: "PHOTO", url: key, caption, order: maxOrder + 1 } });
    return NextResponse.json({ id: media.id, type: media.type, url: media.url, caption: media.caption, order: media.order });
  }
  const body = await req.json().catch(() => ({}));
  const schema = z.object({ type: z.enum(["VIDEO_EMBED", "VIRTUAL_TOUR"]), url: z.string().url(), caption: z.string().max(500).optional().nullable() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "type and url required" }, { status: 400 });
  const existing = await prisma.companyMedia.count({ where: { companyId: company.id, type: parsed.data.type } });
  if (existing >= 1) return NextResponse.json({ error: "Max 1 " + parsed.data.type.toLowerCase() }, { status: 400 });
  const maxOrder = await prisma.companyMedia.findFirst({ where: { companyId: company.id }, orderBy: { order: "desc" }, select: { order: true } }).then((r) => (r ? r.order : -1));
  const media = await prisma.companyMedia.create({ data: { companyId: company.id, type: parsed.data.type, url: parsed.data.url, caption: parsed.data.caption ?? null, order: maxOrder + 1 } });
  return NextResponse.json({ id: media.id, type: media.type, url: media.url, caption: media.caption, order: media.order });
}
