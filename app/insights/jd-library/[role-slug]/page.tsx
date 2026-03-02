import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma/client";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/layout/Container";
import Link from "next/link";

export const revalidate = 86400;

function toRoleSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function generateStaticParams() {
  const roles = await prisma.parsedJD.groupBy({
    by: ["title"],
    _count: { title: true },
    having: { title: { _count: { gte: 10 } } },
    orderBy: { _count: { title: "desc" } },
    take: 200,
  });

  return roles.map((r) => ({
    "role-slug": toRoleSlug(r.title),
  }));
}

interface Props {
  params: Promise<{ "role-slug": string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { "role-slug": roleSlug } = await params;
  const roleLabel = roleSlug.replace(/-/g, " ");
  return buildMetadata({
    title: `What Companies Ask For in a ${roleLabel} Role`,
    description: `Aggregated skills, responsibilities, and keywords from hundreds of real ${roleLabel} job descriptions. Use this to tailor your resume and prepare for interviews.`,
    path: `/insights/jd-library/${roleSlug}`,
  });
}

export default async function JDRolePage({ params }: Props) {
  const { "role-slug": roleSlug } = await params;

  const allTitles = await prisma.parsedJD.findMany({
    select: { title: true },
    distinct: ["title"],
  });
  const canonicalTitle = allTitles.find((r) => toRoleSlug(r.title) === roleSlug)?.title;
  if (!canonicalTitle) notFound();

  const title = canonicalTitle;
  const jds = await prisma.parsedJD.findMany({
    where: { title: { equals: title, mode: "insensitive" } },
    select: {
      skills: true,
      keywords: true,
      responsibilities: true,
      seniority: true,
      industry: true,
    },
    take: 500,
  });

  if (jds.length === 0) notFound();

  const allSkills = new Map<string, number>();
  const allKeywords = new Map<string, number>();
  jds.forEach((jd) => {
    const skills = (jd.skills as { mustHave?: string[]; niceToHave?: string[] }) ?? {};
    [...(skills.mustHave ?? []), ...(skills.niceToHave ?? [])].forEach((s) =>
      allSkills.set(s, (allSkills.get(s) ?? 0) + 1)
    );
    (jd.keywords ?? []).forEach((k: string) => allKeywords.set(k, (allKeywords.get(k) ?? 0) + 1));
  });

  const topSkills = Array.from(allSkills.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);
  const topKeywords = Array.from(allKeywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  return (
    <Container className="py-12">
      <Link href="/insights/jd-library" className="text-sm text-primary hover:underline">
        ← JD Library
      </Link>
      <h1 className="text-3xl font-bold text-foreground mt-4">
        What companies ask for in a {title} role
      </h1>
      <p className="mt-2 text-muted-foreground">
        Aggregated from {jds.length} job description{jds.length === 1 ? "" : "s"}.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Common skills</h2>
          <ul className="flex flex-wrap gap-2">
            {topSkills.map(([skill, count]) => (
              <li
                key={skill}
                className="rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm"
              >
                {skill} <span className="text-muted-foreground">({count})</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Common keywords</h2>
          <ul className="flex flex-wrap gap-2">
            {topKeywords.map(([kw, count]) => (
              <li
                key={kw}
                className="rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm"
              >
                {kw} <span className="text-muted-foreground">({count})</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Link href="/jobs" className="mt-10 inline-block text-primary font-medium hover:underline">
        Browse jobs →
      </Link>
    </Container>
  );
}
