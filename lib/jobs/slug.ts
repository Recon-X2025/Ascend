/**
 * Job post slug: slugify title + id suffix for uniqueness.
 */

import { slugify } from "@/lib/utils/slugify";

export function slugifyTitle(title: string): string {
  return slugify(title, "job");
}

export function jobSlug(title: string, id: number): string {
  const base = slugifyTitle(title);
  return `${base}-${id}`;
}
