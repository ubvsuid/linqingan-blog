import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

import { isBeginnerSeriesPost } from "@/lib/beginner-series";
import { getKnowledgeBaseSectionId } from "@/lib/knowledge-base";

const postsDirectory = path.join(process.cwd(), "content", "posts");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnlyUtc(value: string): Date | null {
  if (!datePattern.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

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
  verification: VerificationStatus;
}

export interface VerificationStatus {
  docsChecked: boolean;
  syntaxChecked: boolean;
  consoleTested: boolean;
  liveTested: boolean;
  checkedAt: string;
  testedAt?: string;
  testEnvironment?: string;
  testResult?: string;
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

  const publishedAtDate = parseDateOnlyUtc(data.publishedAt);
  if (!publishedAtDate) {
    throw new Error(`${filePath}: publishedAt 必须使用 YYYY-MM-DD`);
  }

  const updatedAtDate =
    typeof data.updatedAt === "string" ? parseDateOnlyUtc(data.updatedAt) : null;
  if (data.updatedAt !== undefined && !updatedAtDate) {
    throw new Error(`${filePath}: updatedAt 必须使用 YYYY-MM-DD`);
  }

  if (updatedAtDate && updatedAtDate.getTime() < publishedAtDate.getTime()) {
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

  const verification = data.verification;
  if (!verification || typeof verification !== "object" || Array.isArray(verification)) {
    throw new Error(`${filePath}: frontmatter.verification 必须是对象`);
  }
  const verificationRecord = verification as Record<string, unknown>;
  for (const field of ["docsChecked", "syntaxChecked", "consoleTested", "liveTested"]) {
    if (typeof verificationRecord[field] !== "boolean") {
      throw new Error(`${filePath}: verification.${field} 必须是布尔值`);
    }
  }
  if (
    typeof verificationRecord.checkedAt !== "string" ||
    !parseDateOnlyUtc(verificationRecord.checkedAt)
  ) {
    throw new Error(`${filePath}: verification.checkedAt 必须使用 YYYY-MM-DD`);
  }
  const hasRuntimeEvidence =
    verificationRecord.consoleTested === true || verificationRecord.liveTested === true;
  if (hasRuntimeEvidence) {
    if (
      typeof verificationRecord.testedAt !== "string" ||
      !parseDateOnlyUtc(verificationRecord.testedAt)
    ) {
      throw new Error(`${filePath}: 已标记运行验证时必须填写 verification.testedAt`);
    }
    for (const field of ["testEnvironment", "testResult"]) {
      if (
        typeof verificationRecord[field] !== "string" ||
        verificationRecord[field].trim() === ""
      ) {
        throw new Error(`${filePath}: 已标记运行验证时必须填写 verification.${field}`);
      }
    }
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
    verification: {
      docsChecked: verificationRecord.docsChecked as boolean,
      syntaxChecked: verificationRecord.syntaxChecked as boolean,
      consoleTested: verificationRecord.consoleTested as boolean,
      liveTested: verificationRecord.liveTested as boolean,
      checkedAt: verificationRecord.checkedAt,
      testedAt: verificationRecord.testedAt as string | undefined,
      testEnvironment: verificationRecord.testEnvironment as string | undefined,
      testResult: verificationRecord.testResult as string | undefined,
    },
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
    verification: post.verification,
    readingMinutes: post.readingMinutes,
  };
}

function normalizeTag(tag: string): string {
  return tag.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

const genericRecommendationTags = new Set([
  "screeps",
  "新手入门",
  "基础工程",
  "常见问题",
  "错误排查",
  "进阶开发",
]);

const pinnedRelatedPostSlugs: Readonly<Record<string, readonly string[]>> = {
  "screeps-modules-require": ["screeps-room-error-isolation"],
  "screeps-cpu-bucket-degradation": ["screeps-room-error-isolation"],
  "screeps-game-notify": ["screeps-room-error-isolation"],
  "screeps-room-event-log": ["screeps-room-error-isolation"],
};

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
  const allPosts = getAllPosts();
  const pinnedSlugs = pinnedRelatedPostSlugs[post.slug] ?? [];
  const pinnedPosts = pinnedSlugs
    .map((slug) => allPosts.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is PostSummary => candidate !== undefined);
  const pinnedSet = new Set(pinnedPosts.map((candidate) => candidate.slug));
  const sourceTags = new Set(post.tags.map(normalizeTag));
  const sourceSection = getKnowledgeBaseSectionId(post.slug);
  const scored = allPosts
    .filter(
      (candidate) =>
        candidate.slug !== post.slug &&
        !pinnedSet.has(candidate.slug),
    )
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) =>
        sourceTags.has(normalizeTag(tag)) &&
        !genericRecommendationTags.has(normalizeTag(tag)),
      ).length;
      const candidateSection = getKnowledgeBaseSectionId(candidate.slug);
      const score =
        sharedTags * 5 +
        (sourceSection !== null && candidateSection === sourceSection ? 3 : 0) +
        (candidate.category === post.category ? 2 : 0);

      return { candidate, score };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        new Date(right.candidate.publishedAt).getTime() -
          new Date(left.candidate.publishedAt).getTime(),
    );

  const rankedPosts = scored
    .filter((item) => item.score > 0)
    .map((item) => item.candidate);

  return [...pinnedPosts, ...rankedPosts].slice(0, limit);
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
