import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/layout/Container";
import Link from "next/link";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "JD Library — What Companies Really Ask For",
  description:
    "Browse aggregated job description data across 200+ roles. See the most common skills, responsibilities, and keywords companies ask for — by role, industry, and seniority.",
  path: "/insights/jd-library",
});

export default function JDLibraryPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold text-foreground">JD Library</h1>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        What companies really ask for — aggregated from real job descriptions. Browse by role to see
        common skills, keywords, and responsibilities. Use this to tailor your resume and prepare for
        interviews.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Role-specific pages are generated from our JD corpus. Start by searching for a role (e.g.
        &quot;Senior Product Manager&quot;) or browse the list when available.
      </p>
      <Link
        href="/jobs"
        className="mt-6 inline-block text-primary font-medium hover:underline"
      >
        ← Back to Jobs
      </Link>
    </Container>
  );
}
