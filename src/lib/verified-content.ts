import { englishDiscoveryArticles } from "@/lib/english-discovery";
import { getAllPosts } from "@/lib/posts";

export type VerifiedLocale = "zh" | "en";
export type VerifiedLevel = "console" | "live";

export interface VerifiedContentRecord {
  id: string;
  href: string;
  title: string;
  description: string;
  date: string;
  level: VerifiedLevel;
  testEnvironment?: string;
}

export interface VerifiedContentSummary {
  total: number;
  consoleCount: number;
  liveCount: number;
}

type Post = ReturnType<typeof getAllPosts>[number];

function verificationDate(post: Post): string {
  return (
    post.verification.testedAt ??
    post.verification.checkedAt ??
    post.updatedAt ??
    post.publishedAt
  );
}

function getVerifiedSourcePosts(): Post[] {
  return getAllPosts()
    .filter(
      (post) =>
        post.verification.consoleTested || post.verification.liveTested,
    )
    .sort((left, right) =>
      verificationDate(right).localeCompare(verificationDate(left)),
    );
}

export function getVerifiedContent(locale: VerifiedLocale): VerifiedContentRecord[] {
  const posts = getVerifiedSourcePosts();

  if (locale === "zh") {
    return posts.map((post) => ({
      id: post.slug,
      href: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      date: verificationDate(post),
      level: post.verification.liveTested ? "live" : "console",
      testEnvironment: post.verification.testEnvironment,
    }));
  }

  const englishByChinesePath = new Map(
    englishDiscoveryArticles.map((article) => [article.chinesePath, article]),
  );

  return posts.flatMap((post) => {
    const englishArticle = englishByChinesePath.get(`/blog/${post.slug}`);
    if (!englishArticle) return [];

    return [
      {
        id: post.slug,
        href: englishArticle.href,
        title: englishArticle.title,
        description: englishArticle.description,
        date: verificationDate(post),
        level: post.verification.liveTested ? "live" : "console",
        testEnvironment: post.verification.testEnvironment,
      } satisfies VerifiedContentRecord,
    ];
  });
}

export function getVerifiedContentSummary(
  records: VerifiedContentRecord[],
): VerifiedContentSummary {
  const liveCount = records.filter((record) => record.level === "live").length;
  const consoleCount = records.filter(
    (record) => record.level === "console" || record.level === "live",
  ).length;

  return {
    total: records.length,
    consoleCount,
    liveCount,
  };
}
