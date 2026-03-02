import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/jobs/", "/jobs", "/companies/", "/companies", "/salary/", "/salary", "/insights/"],
        disallow: [
          "/dashboard/",
          "/api/",
          "/settings/",
          "/profile/edit",
          "/resume/",
          "/auth/",
          "/notifications",
          "/internal/",
          "/admin/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
