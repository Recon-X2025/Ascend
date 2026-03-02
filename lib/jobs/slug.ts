/**
 * Job post slug: slugify title + id suffix for uniqueness.
 */

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "job";
}

export function jobSlug(title: string, id: number): string {
  const base = slugifyTitle(title);
  return `${base}-${id}`;
}
