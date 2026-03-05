/**
 * BL-13: Creator Mode — long-form articles and newsletters.
 * Extends BL-8 short posts into a creator publishing layer.
 */

import { prisma } from "@/lib/prisma/client";

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;
const MAX_EXCERPT_LENGTH = 500;
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "article";
}

export interface MentorArticleItem {
  id: string;
  mentorUserId: string;
  mentorName: string | null;
  mentorImage: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

async function ensureMentorCanPublish(mentorUserId: string): Promise<boolean> {
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUserId },
    select: { isPublic: true, verificationStatus: true },
  });
  return !!(profile?.isPublic && profile?.verificationStatus === "VERIFIED");
}

export async function createArticle(
  mentorUserId: string,
  input: { title: string; content: string; excerpt?: string | null }
): Promise<{ ok: boolean; article?: MentorArticleItem; error?: string }> {
  const canPublish = await ensureMentorCanPublish(mentorUserId);
  if (!canPublish) return { ok: false, error: "Only verified, public mentors can publish" };

  const title = (input.title ?? "").trim();
  const content = (input.content ?? "").trim();
  const excerpt = input.excerpt?.trim() ?? null;

  if (!title) return { ok: false, error: "Title is required" };
  if (title.length > MAX_TITLE_LENGTH) return { ok: false, error: `Title must be ${MAX_TITLE_LENGTH} chars or less` };
  if (!content) return { ok: false, error: "Content is required" };
  if (content.length > MAX_CONTENT_LENGTH) return { ok: false, error: `Content must be ${MAX_CONTENT_LENGTH} chars or less` };
  if (excerpt && excerpt.length > MAX_EXCERPT_LENGTH) return { ok: false, error: `Excerpt must be ${MAX_EXCERPT_LENGTH} chars or less` };

  let slug = slugify(title);
  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.mentorArticle.findUnique({
      where: { mentorUserId_slug: { mentorUserId, slug: candidate } },
    });
    if (!existing) {
      slug = candidate;
      break;
    }
    suffix++;
  }

  const article = await prisma.mentorArticle.create({
    data: {
      mentorUserId,
      title,
      slug,
      content,
      excerpt,
    },
    include: { mentorUser: { select: { id: true, name: true, image: true } } },
  });
  return {
    ok: true,
    article: toArticleItem(article),
  };
}

function toArticleItem(a: { id: string; mentorUserId: string; title: string; slug: string; content: string; excerpt: string | null; publishedAt: Date | null; createdAt: Date; mentorUser: { name: string | null; image: string | null } }): MentorArticleItem {
  return {
    id: a.id,
    mentorUserId: a.mentorUserId,
    mentorName: a.mentorUser.name,
    mentorImage: a.mentorUser.image,
    title: a.title,
    slug: a.slug,
    content: a.content,
    excerpt: a.excerpt,
    publishedAt: a.publishedAt,
    createdAt: a.createdAt,
  };
}

export async function getArticleBySlug(mentorUserId: string, slug: string): Promise<MentorArticleItem | null> {
  const article = await prisma.mentorArticle.findUnique({
    where: { mentorUserId_slug: { mentorUserId, slug } },
    include: { mentorUser: { select: { name: true, image: true } } },
  });
  return article ? toArticleItem(article) : null;
}

export async function getPublicArticleBySlug(mentorUserId: string, slug: string): Promise<MentorArticleItem | null> {
  const article = await prisma.mentorArticle.findUnique({
    where: { mentorUserId_slug: { mentorUserId, slug }, publishedAt: { not: null } },
    include: { mentorUser: { select: { name: true, image: true } } },
  });
  return article ? toArticleItem(article) : null;
}

export async function listArticlesByMentor(mentorUserId: string, publishedOnly = false): Promise<MentorArticleItem[]> {
  const articles = await prisma.mentorArticle.findMany({
    where: { mentorUserId, ...(publishedOnly ? { publishedAt: { not: null } } : {}) },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: { mentorUser: { select: { name: true, image: true } } },
  });
  return articles.map(toArticleItem);
}

export async function publishArticle(mentorUserId: string, articleId: string): Promise<{ ok: boolean; error?: string }> {
  const article = await prisma.mentorArticle.findFirst({
    where: { id: articleId, mentorUserId },
  });
  if (!article) return { ok: false, error: "Article not found" };
  await prisma.mentorArticle.update({
    where: { id: articleId },
    data: { publishedAt: new Date() },
  });
  return { ok: true };
}

export async function subscribeToNewsletter(mentorUserId: string, email: string, userId?: string): Promise<{ ok: boolean; error?: string }> {
  const emailTrim = email.trim().toLowerCase();
  if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) return { ok: false, error: "Valid email required" };
  const canPublish = await ensureMentorCanPublish(mentorUserId);
  if (!canPublish) return { ok: false, error: "Mentor cannot accept subscribers" };
  try {
    await prisma.mentorNewsletterSubscriber.upsert({
      where: { mentorUserId_email: { mentorUserId, email: emailTrim } },
      create: { mentorUserId, email: emailTrim, userId: userId || null },
      update: { userId: userId || undefined },
    });
    return { ok: true };
  } catch (e) {
    console.error("[mentorship/creator] subscribe error:", e);
    return { ok: false, error: "Failed to subscribe" };
  }
}

export async function getSubscriberCount(mentorUserId: string): Promise<number> {
  return prisma.mentorNewsletterSubscriber.count({ where: { mentorUserId } });
}
