import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { changelogEntries } from "@/lib/changelog";
import {
  knowledgeBaseSections,
  knowledgeBaseSlugs,
} from "@/lib/knowledge-base";
import { getAllPosts } from "@/lib/posts";
import { projects } from "@/lib/projects";
import { latestSiteAuditEntry } from "@/lib/site-audit-entry";
import { toolCount } from "@/lib/tool-catalog";

export interface SiteStatus {
  articleCount: number;
  beginnerCount: number;
  topicArticleCount: number;
  knowledgeArticleCount: number;
  knowledgeSectionCount: number;
  toolCount: number;
  projectCount: number;
  latestArticlePublishedDate: string | null;
  latestContentDate: string | null;
  latestChangelogDate: string | null;
  latestActivityDate: string | null;
}

export interface SiteActivityEntry {
  id: string;
  date: string;
  type: "内容" | "网站" | "工具" | "验证" | "SEO";
  title: string;
  href?: string;
}

function newestDate(values: Array<string | null | undefined>): string | null {
  const dates = values.filter((value): value is string => Boolean(value));
  return dates.length > 0
    ? dates.sort((left, right) => right.localeCompare(left))[0]
    : null;
}

export function getSiteStatus(): SiteStatus {
  const posts = getAllPosts();
  const latestArticlePublishedDate = newestDate(
    posts.map((post) => post.publishedAt),
  );
  const latestContentDate = newestDate(
    posts.map((post) => post.updatedAt ?? post.publishedAt),
  );
  const latestChangelogDate = newestDate([
    latestSiteAuditEntry.date,
    ...changelogEntries.map((entry) => entry.date),
  ]);

  return {
    articleCount: posts.length,
    beginnerCount: beginnerSeriesSlugs.length,
    topicArticleCount: Math.max(0, posts.length - beginnerSeriesSlugs.length),
    knowledgeArticleCount: knowledgeBaseSlugs.length,
    knowledgeSectionCount: knowledgeBaseSections.length,
    toolCount,
    projectCount: projects.length,
    latestArticlePublishedDate,
    latestContentDate,
    latestChangelogDate,
    latestActivityDate: newestDate([latestContentDate, latestChangelogDate]),
  };
}

export function getRecentSiteActivity(limit = 3): SiteActivityEntry[] {
  const contentActivity: SiteActivityEntry[] = getAllPosts().map((post) => {
    const date = post.updatedAt ?? post.publishedAt;
    const wasUpdated = Boolean(
      post.updatedAt && post.updatedAt !== post.publishedAt,
    );

    return {
      id: `content-${post.slug}-${date}`,
      date,
      type: "内容",
      title: `${wasUpdated ? "更新" : "发布"}：${post.title}`,
      href: `/blog/${post.slug}`,
    };
  });

  const changelogActivity: SiteActivityEntry[] = [
    latestSiteAuditEntry,
    ...changelogEntries,
  ].map((entry) => ({
    id: `changelog-${entry.id}`,
    date: entry.date,
    type: entry.type,
    title: entry.title,
    href: "/changelog",
  }));

  return [...contentActivity, ...changelogActivity]
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) || left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}
