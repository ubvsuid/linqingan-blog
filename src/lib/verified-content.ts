import { englishDiscoveryArticles } from "@/lib/english-discovery";
import { getAllPosts } from "@/lib/posts";
import {
  getPublicVerificationEvidence,
  summarizeVerificationEvidence,
  type ArticleEvidenceSummary,
  type PublicVerificationEvidenceRecord,
  type RuntimeVerificationType,
} from "@/lib/verification-evidence";

export type VerifiedLocale = "zh" | "en";
export type VerifiedLevel = "console" | "live";

export interface VerifiedEvidencePreview {
  evidenceKey: string;
  type: RuntimeVerificationType;
  gameTime: number | null;
  shard: string | null;
  roomName: string | null;
  apiName: string;
  returnCode: string | null;
  tickStart: number | null;
  tickEnd: number | null;
  note: string;
}

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
  evidenceCount: number;
  latestEvidence?: VerifiedEvidencePreview;
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

function evidenceDate(summary?: ArticleEvidenceSummary): string | undefined {
  return summary?.latestVerifiedAt.slice(0, 10);
}

function effectiveVerificationDate(post: Post, summary?: ArticleEvidenceSummary): string {
  const candidates = [post.verification.testedAt, evidenceDate(summary)].filter(
    (value): value is string => Boolean(value),
  );
  if (candidates.length === 0) return verificationDate(post);
  return candidates.sort().at(-1) ?? verificationDate(post);
}

function getVerifiedSourcePosts(): Post[] {
  return getAllPosts().filter(
    (post) => post.verification.consoleTested || post.verification.liveTested,
  );
}

function keepAcceptedEvidence(
  records: PublicVerificationEvidenceRecord[],
  posts: Post[],
): PublicVerificationEvidenceRecord[] {
  const acceptedBySlug = new Map(
    posts.map((post) => [post.slug, post.verification] as const),
  );

  return records.filter((record) => {
    const verification = acceptedBySlug.get(record.articleSlug);
    if (!verification) return false;
    return record.verificationType === "live"
      ? verification.liveTested
      : verification.consoleTested;
  });
}

function sortVerifiedPosts(
  posts: Post[],
  evidenceByArticle: Map<string, ArticleEvidenceSummary>,
): Post[] {
  return [...posts].sort((left, right) =>
    effectiveVerificationDate(right, evidenceByArticle.get(right.slug)).localeCompare(
      effectiveVerificationDate(left, evidenceByArticle.get(left.slug)),
    ),
  );
}

function recordVerification(post: Post, summary?: ArticleEvidenceSummary) {
  const latest = summary?.latest;

  return {
    date: effectiveVerificationDate(post, summary),
    level: post.verification.liveTested ? ("live" as const) : ("console" as const),
    consoleTested: post.verification.consoleTested,
    liveTested: post.verification.liveTested,
    testEnvironment: summary?.environment ?? post.verification.testEnvironment,
    evidenceCount: summary?.count ?? 0,
    latestEvidence: latest
      ? ({
          evidenceKey: latest.evidenceKey,
          type: latest.verificationType,
          gameTime: latest.gameTime,
          shard: latest.shard,
          roomName: latest.roomName,
          apiName: latest.apiName,
          returnCode: latest.returnCode,
          tickStart: latest.tickStart,
          tickEnd: latest.tickEnd,
          note: latest.evidenceNote,
        } satisfies VerifiedEvidencePreview)
      : undefined,
  };
}

function mapVerifiedContent(
  locale: VerifiedLocale,
  posts: Post[],
  evidenceByArticle: Map<string, ArticleEvidenceSummary>,
): VerifiedContentRecord[] {
  if (locale === "zh") {
    return posts.map((post) => ({
      id: post.slug,
      href: `/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      ...recordVerification(post, evidenceByArticle.get(post.slug)),
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
        ...recordVerification(post, evidenceByArticle.get(post.slug)),
      } satisfies VerifiedContentRecord,
    ];
  });
}

export function getVerifiedContent(locale: VerifiedLocale): VerifiedContentRecord[] {
  const evidenceByArticle = new Map<string, ArticleEvidenceSummary>();
  return mapVerifiedContent(
    locale,
    sortVerifiedPosts(getVerifiedSourcePosts(), evidenceByArticle),
    evidenceByArticle,
  );
}

export async function getVerifiedContentWithEvidence(
  locale: VerifiedLocale,
): Promise<VerifiedContentRecord[]> {
  const posts = getVerifiedSourcePosts();
  const acceptedEvidence = keepAcceptedEvidence(
    await getPublicVerificationEvidence(),
    posts,
  );
  const evidenceByArticle = summarizeVerificationEvidence(acceptedEvidence);

  return mapVerifiedContent(
    locale,
    sortVerifiedPosts(posts, evidenceByArticle),
    evidenceByArticle,
  );
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
