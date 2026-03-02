/**
 * Company slug generation: lowercase, hyphens, alphanumeric.
 * Ensures uniqueness by appending -2, -3, ... if slug exists.
 */

import { prisma } from "@/lib/prisma/client";
import { slugify } from "@/lib/utils/slugify";

export { slugify };

export async function generateUniqueSlug(baseName: string): Promise<string> {
  const slug = slugify(baseName, "company");
  let candidate = slug;
  let n = 2;
  while (await prisma.company.findUnique({ where: { slug: candidate } })) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
}
