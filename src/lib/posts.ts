import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

import { isBeginnerSeriesPost } from "@/lib/beginner-series";

const postsDirectory = path.join(process.cwd(), "content", "posts");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export interface PostFrontmatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  cover?: string;
  draft: boolean;
  featured: boolean;
}

export interface PostSummary extends PostFrontmatter {
  slug: string;
  readingMinutes: number;
}

export interface PostSearchDocument extends PostSummary {
  text: string;
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface Post extends PostSummary {
  html: string;
  tableOfContents: TableOfContentsItem[];
}

function assertString(
  value: unknown,
  field: string,
  filePath: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${filePath}: frontmatter.${field} 必须是非空字符串`);
  }
}

function parseFrontmatter(
  data: Record<string, unknown>,
  filePath: string,
): PostFrontmatter {
  assertString(data.title, "title", filePath);
  assertString(data.description, "description", filePath);
  assertString(data.publishedAt, "publishedAt", filePath);
  assertString(data.category, "category", filePath);

  if (!datePattern.test(data.publishedAt)) {
    throw new Error(`${filePath}: publishedAt 必须使用 YYYY-MM-DD`);
  }

  if (
    data.updatedAt !== undefined &&
    (typeof data.updatedAt !== "string" || !datePattern.test(data.updatedAt))
  ) {
    throw new Error(`${filePath}: updatedAt 必须使用 YYYY-MM-DD`);
  }

  if (
    typeof data.updatedAt === "string" &&
    new Date(data.updatedAt).getTime() < new Date(data.publishedAt).getTime()
  ) {
    throw new Error(`${filePath}: updatedAt 不能早于 publishedAt`);
  }

  if (
    data.tags !== undefined &&
    (!Array.isArray(data.tags) ||
      !data.tags.every((tag) => typeof tag === "string" && tag.trim() !== ""))
  ) {
    throw new Error(`${filePath}: tags 必须是非空字符串数组`);
  }

  if (data.cover !== undefined && typeof data.cover !== "string") {
    throw new Error(`${filePath}: cover 必须是字符串`);
  }

  return {
    title: data.title,
    description: data.description,
    publishedAt: data.publishedAt,
    updatedAt: data.updatedAt as string | undefined,
    category: data.category,
    tags: (data.tags as string[] | undefined) ?? [],
    cover: data.cover as string | undefined,
    draft: data.draft === true,
    featured: data.featured === true,
  };
}

function calculateReadingMinutes(markdown: string): number {
  const chineseCharacters = markdown.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const englishWords = markdown
    .replace(/[\u3400-\u9fff]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(
    1,
    Math.ceil(chineseCharacters / 400 + englishWords / 220),
  );
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function createHeadingId(
  text: string,
  headingIndex: number,
  usedIds: Map<string, number>,
): string {
  const normalized = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const baseId = normalized || `section-${headingIndex}`;
  const occurrence = usedIds.get(baseId) ?? 0;

  usedIds.set(baseId, occurrence + 1);
  return occurrence === 0 ? baseId : `${baseId}-${occurrence + 1}`;
}

function addHeadingIds(html: string): {
  html: string;
  tableOfContents: TableOfContentsItem[];
} {
  const tableOfContents: TableOfContentsItem[] = [];
  const usedIds = new Map<string, number>();
  let headingIndex = 0;

  const htmlWithIds = html.replace(
    /<h([23])>([\s\S]*?)<\/h\1>/g,
    (_match, rawLevel: string, content: string) => {
      headingIndex += 1;
      const level = Number(rawLevel) as 2 | 3;
      const text = decodeHtmlText(content);
      const id = createHeadingId(text, headingIndex, usedIds);

      tableOfContents.push({ id, text, level });

      return `<h${level} id="${id}">${content}</h${level}>`;
    },
  );

  return {
    html: htmlWithIds,
    tableOfContents,
  };
}

function getMarkdownFiles(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter((fileName) => fileName.endsWith(".md"));
}

function readRawPost(slug: string) {
  if (!slugPattern.test(slug)) {
    return null;
  }

  const filePath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);
  const frontmatter = parseFrontmatter(data, filePath);

  return {
    slug,
    content,
    readingMinutes: calculateReadingMinutes(content),
    ...frontmatter,
  };
}

function toSummary(
  post: NonNullable<ReturnType<typeof readRawPost>>,
): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    category: post.category,
    tags: post.tags,
    cover: post.cover,
    draft: post.draft,
    featured: post.featured,
    readingMinutes: post.readingMinutes,
  };
}

function normalizeTag(tag: string): string {
  return tag.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

function markdownToSearchText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[>*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAllPosts(): PostSummary[] {
  return getMarkdownFiles()
    .map((fileName) => fileName.replace(/\.md$/, ""))
    .map(readRawPost)
    .filter((post): post is NonNullable<typeof post> => post !== null)
    .filter((post) => !post.draft)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime(),
    )
    .map(toSummary);
}

export function getArticlePosts(): PostSummary[] {
  return getAllPosts().filter((post) => !isBeginnerSeriesPost(post.slug));
}

export function getFeaturedPosts(limit = 3): PostSummary[] {
  const featured = getAllPosts().filter((post) => post.featured);
  return (featured.length > 0 ? featured : getAllPosts()).slice(0, limit);
}

export function getRelatedPosts(
  post: PostSummary,
  limit = 3,
): PostSummary[] {
  const sourceTags = new Set(post.tags.map(normalizeTag));
  const scored = getAllPosts()
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) =>
        sourceTags.has(normalizeTag(tag)),
      ).length;
      const score =
        sharedTags * 4 +
        (candidate.category === post.category ? 3 : 0) +
        (candidate.featured ? 1 : 0);

      return { candidate, score };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        new Date(right.candidate.publishedAt).getTime() -
          new Date(left.candidate.publishedAt).getTime(),
    );

  const relevant = scored.filter((item) => item.score > 0);
  const source = relevant.length >= limit ? relevant : scored;
  return source.slice(0, limit).map((item) => item.candidate);
}

export function getSearchablePosts(): PostSearchDocument[] {
  return getMarkdownFiles()
    .map((fileName) => fileName.replace(/\.md$/, ""))
    .map(readRawPost)
    .filter((post): post is NonNullable<typeof post> => post !== null)
    .filter((post) => !post.draft)
    .map((post) => ({
      ...toSummary(post),
      text: markdownToSearchText(post.content),
    }));
}

export async function getPostBySlug(
  slug: string,
): Promise<Post | null> {
  const rawPost = readRawPost(slug);

  if (!rawPost || rawPost.draft) {
    return null;
  }

  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(rawPost.content);
  const { html, tableOfContents } = addHeadingIds(result.toString());

  return {
    ...toSummary(rawPost),
    html,
    tableOfContents,
  };
}
