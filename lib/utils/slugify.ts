/**
 * Generic slug generator: lowercase, hyphens, alphanumeric only.
 */
export function slugify(text: string, fallback = ""): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || fallback
  );
}
