/**
 * Sanitize HTML for safe rendering (e.g. company about, rich text).
 */

import sanitizeHtml from "sanitize-html";

const allowedTags = ["p", "br", "strong", "em", "u", "ul", "ol", "li", "a", "h2", "h3"];
const allowedAttributes: Record<string, string[]> = { a: ["href", "target", "rel"] };

export function sanitizeRichText(html: string | null | undefined): string {
  if (html == null || html === "") return "";
  return sanitizeHtml(html, { allowedTags, allowedAttributes });
}
