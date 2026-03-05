/**
 * BL-22: Resume multilingual + RTL support.
 * Devanagari (Hindi, Indic) and RTL (Arabic) — deferred from Phase 21 rollback.
 * Structure ready for when pdf-lib + font shaping is wired.
 */

export const SUPPORTED_RESUME_LOCALES = ["en-IN", "hi-IN", "ar"] as const;
export type ResumeLocale = (typeof SUPPORTED_RESUME_LOCALES)[number];

export const RTL_LOCALES: ResumeLocale[] = ["ar"];
export function isRtl(locale: ResumeLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** Devanagari: Noto Sans Devanagari — use when locale is hi-IN. */
export const DEVENAGARI_FONT_FAMILY = "Noto Sans Devanagari";

/** For future: font URL for Devanagari shaping in pdf-lib. */
export function getFontUrlForLocale(locale: ResumeLocale): string | null {
  if (locale === "hi-IN") {
    return "https://fonts.gstatic.com/s/notosansdevanagari/v23/TuGoUUDtXY46GXo4NO-o2iu2uTOT7N21f4N2.woff2";
  }
  return null;
}
