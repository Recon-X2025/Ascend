import type { Metadata } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXTAUTH_URL ??
  "https://ascend-karthikiyer25gmailcoms-projects.vercel.app";
const SITE_NAME = "Ascend";
const DEFAULT_DESCRIPTION =
  "Find your next role, discover what companies are really like, and build a career you are proud of. Ascend is India's job platform built for where you are going.";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;

export function buildMetadata({
  title,
  description,
  path,
  ogImage,
  noIndex = false,
  type = "website",
}: {
  title: string;
  description?: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = `${BASE_URL}${path}`;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  return {
    title: `${title} | ${SITE_NAME}`,
    description: desc,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description: desc,
      images: [image],
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

export { BASE_URL, SITE_NAME };
