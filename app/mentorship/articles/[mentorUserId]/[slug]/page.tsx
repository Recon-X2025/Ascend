/**
 * BL-13: Public article page (SEO-indexable).
 */
import { notFound } from "next/navigation";
import { getPublicArticleBySlug } from "@/lib/mentorship/creator";
import Link from "next/link";

export default async function MentorArticlePage({
  params,
}: {
  params: Promise<{ mentorUserId: string; slug: string }>;
}) {
  const { mentorUserId, slug } = await params;
  const article = await getPublicArticleBySlug(mentorUserId, slug);
  if (!article) notFound();
  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <Link href={`/mentors/${mentorUserId}`} className="text-sm text-gray-600 hover:underline">
        ← Back to mentor profile
      </Link>
      <h1 className="mt-4 text-3xl font-bold">{article.title}</h1>
      <p className="mt-2 text-gray-600">
        By {article.mentorName ?? "Mentor"} · {article.publishedAt && new Date(article.publishedAt).toLocaleDateString()}
      </p>
      {article.excerpt && <p className="mt-4 text-lg text-gray-700">{article.excerpt}</p>}
      <div className="prose mt-8 dark:prose-invert" dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br />") }} />
    </article>
  );
}
