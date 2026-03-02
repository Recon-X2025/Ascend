/**
 * Company slug generation: lowercase, hyphens, alphanumeric.
 * Ensures uniqueness by appending -2, -3, ... if slug exists.
 */

import { prisma } from "@/lib/prisma/client";

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "company";
}

export async function generateUniqueSlug(baseName: string): Promise<string> {
  const slug = slugify(baseName);
  let candidate = slug;
  let n = 2;
  while (await prisma.company.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
}
