/**
 * Sanitize review text before storing. Strips HTML to prevent XSS.
 */

import sanitizeHtml from "sanitize-html";

const allowedTags: string[] = [];
const allowedAttributes: Record<string, string[]> = {};

export function sanitizeReviewText(input: string | null | undefined): string {
  if (input == null || typeof input !== "string") return "";
  return sanitizeHtml(input.trim(), { allowedTags, allowedAttributes });
}
