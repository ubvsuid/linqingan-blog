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
  consoleTested: boolean;
  liveTested: boolean;
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

function recordVerification(post: Post) {
  return {
    date: verificationDate(post),
    level: post.verification.liveTested ? ("live" as const) : ("console" as const),
    consoleTested: post.verification.consoleTested,
    liveTested: post.verification.liveTested,
    testEnvironment: post.verification.testEnvironment,
  };
}

export function getVerifiedContent(locale: VerifiedLocale): VerifiedContentRecord[] {
  const posts = getVerifiedSourcePosts();

  if (locale === "zh") {
    return posts.map((post) => ({
      id: post.slug,
      href: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      ...recordVerification(post),
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
        ...recordVerification(post),
      } satisfies VerifiedContentRecord,
    ];
  });
}

export function getVerifiedContentSummary(
  records: VerifiedContentRecord[],
): VerifiedContentSummary {
  return {
    total: records.length,
    consoleCount: records.filter((record) => record.consoleTested).length,
    liveCount: records.filter((record) => record.liveTested).length,
  };
}
