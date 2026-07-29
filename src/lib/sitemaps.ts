import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { changelogEntries } from "@/lib/changelog";
import {
  englishDiscoveryArticles,
  englishTags,
} from "@/lib/english-discovery";
import { knowledgeBaseSections } from "@/lib/knowledge-base";
import { nowEntries } from "@/lib/now-entries";
import { getAllPosts } from "@/lib/posts";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";
import { getTagRecords } from "@/lib/tags";

export type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
}

export interface SitemapIndexEntry {
  url: string;
  lastModified: Date;
}

const sitemapFallbackDate = "2026-07-17";

function latestDate(values: string[], fallback = sitemapFallbackDate): Date {
  const latest = values
    .filter(Boolean)
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((left, right) => right.time - left.time)[0]?.value;

  return new Date(latest || fallback);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function getChineseSitemapEntries(): SitemapEntry[] {
  const allPosts = getAllPosts();
  const postsBySlug = new Map(allPosts.map((post) => [post.slug, post]));
  const allPostsUpdatedAt = latestDate(
    allPosts.map((post) => post.updatedAt ?? post.publishedAt),
  );
  const allPostsPublishedAt = latestDate(
    allPosts.map((post) => post.publishedAt),
  );
  const beginnerUpdatedAt = latestDate(
    beginnerSeriesSlugs.flatMap((slug) => {
      const post = postsBySlug.get(slug);
      return post ? [post.updatedAt ?? post.publishedAt] : [];
    }),
  );
  const changelogUpdatedAt = latestDate(
    changelogEntries.map((entry) => entry.date),
  );
  const nowUpdatedAt = latestDate([
    ...nowEntries.map((entry) => entry.date),
    ...changelogEntries.map((entry) => entry.date),
  ]);
  const interfaceUpdatedAt = latestDate([
    ...allPosts.map((post) => post.updatedAt ?? post.publishedAt),
    ...changelogEntries.map((entry) => entry.date),
    ...nowEntries.map((entry) => entry.date),
    ...projects.map((project) => project.updatedAt),
  ]);
  const aboutUpdatedAt = latestDate([
    allPostsPublishedAt.toISOString(),
    ...projects.map((project) => project.updatedAt),
    ...changelogEntries.map((entry) => entry.date),
  ]);

  const staticPages: SitemapEntry[] = [
    { url: siteConfig.url, lastModified: allPostsUpdatedAt, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/beginner`, lastModified: beginnerUpdatedAt, changeFrequency: "weekly", priority: 0.95 },
    { url: `${siteConfig.url}/blog`, lastModified: allPostsUpdatedAt, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteConfig.url}/knowledge`, lastModified: allPostsUpdatedAt, changeFrequency: "weekly", priority: 0.94 },
    { url: `${siteConfig.url}/tools/creep-body-calculator`, lastModified: interfaceUpdatedAt, changeFrequency: "monthly", priority: 0.86 },
    { url: `${siteConfig.url}/tools/room-diagnostics`, lastModified: interfaceUpdatedAt, changeFrequency: "monthly", priority: 0.84 },
    { url: `${siteConfig.url}/glossary`, lastModified: interfaceUpdatedAt, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteConfig.url}/screeps-errors`, lastModified: interfaceUpdatedAt, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteConfig.url}/verification`, lastModified: interfaceUpdatedAt, changeFrequency: "monthly", priority: 0.76 },
    { url: `${siteConfig.url}/tags`, lastModified: allPostsUpdatedAt, changeFrequency: "weekly", priority: 0.72 },
    { url: `${siteConfig.url}/now`, lastModified: nowUpdatedAt, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteConfig.url}/changelog`, lastModified: changelogUpdatedAt, changeFrequency: "daily", priority: 0.72 },
    { url: `${siteConfig.url}/about`, lastModified: aboutUpdatedAt, changeFrequency: "monthly", priority: 0.7 },
  ];

  const knowledgeModulePages: SitemapEntry[] = knowledgeBaseSections.map(
    (section) => ({
      url: `${siteConfig.url}/knowledge/${section.id}`,
      lastModified: latestDate(
        section.slugs.flatMap((slug) => {
          const post = postsBySlug.get(slug);
          return post ? [post.updatedAt ?? post.publishedAt] : [];
        }),
      ),
      changeFrequency: "weekly",
      priority: 0.86,
    }),
  );

  const posts: SitemapEntry[] = allPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const tagPages: SitemapEntry[] = getTagRecords()
    .filter((tag) => tag.count >= 3)
    .map((tag) => ({
      url: `${siteConfig.url}/tags/${tag.slug}`,
      lastModified: allPostsUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.55,
    }));

  return [
    ...staticPages,
    ...knowledgeModulePages,
    ...posts,
    ...tagPages,
  ];
}

export function getEnglishSitemapEntries(): SitemapEntry[] {
  const englishArticleUpdatedAt = latestDate(
    englishDiscoveryArticles.map((article) => article.updatedAt),
  );
  const englishInterfaceUpdatedAt = latestDate([
    ...englishDiscoveryArticles.map((article) => article.updatedAt),
    ...changelogEntries.map((entry) => entry.date),
  ]);

  const staticPages: SitemapEntry[] = [
    { url: `${siteConfig.url}/en`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "weekly", priority: 0.92 },
    { url: `${siteConfig.url}/en/beginner`, lastModified: englishArticleUpdatedAt, changeFrequency: "weekly", priority: 0.86 },
    { url: `${siteConfig.url}/en/blog`, lastModified: englishArticleUpdatedAt, changeFrequency: "weekly", priority: 0.88 },
    { url: `${siteConfig.url}/en/knowledge`, lastModified: englishArticleUpdatedAt, changeFrequency: "weekly", priority: 0.84 },
    { url: `${siteConfig.url}/en/tags`, lastModified: englishArticleUpdatedAt, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteConfig.url}/en/tools`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteConfig.url}/en/tools/creep-body-calculator`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "monthly", priority: 0.84 },
    { url: `${siteConfig.url}/en/tools/room-diagnostics`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "monthly", priority: 0.82 },
    { url: `${siteConfig.url}/en/screeps-errors`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "monthly", priority: 0.76 },
    { url: `${siteConfig.url}/en/glossary`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "monthly", priority: 0.74 },
    { url: `${siteConfig.url}/en/verification`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "monthly", priority: 0.68 },
    { url: `${siteConfig.url}/en/about`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.url}/en/changelog`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "weekly", priority: 0.62 },
    { url: `${siteConfig.url}/en/roadmap`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "weekly", priority: 0.58 },
    { url: `${siteConfig.url}/en/license`, lastModified: englishInterfaceUpdatedAt, changeFrequency: "yearly", priority: 0.36 },
  ];

  const articles: SitemapEntry[] = englishDiscoveryArticles.map((article) => ({
    url: `${siteConfig.url}${article.href}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly",
    priority: 0.84,
  }));

  const tagPages: SitemapEntry[] = englishTags
    .filter((tag) => tag.count >= 3)
    .map((tag) => ({
      url: `${siteConfig.url}/en/tags/${tag.slug}`,
      lastModified: englishArticleUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.66,
    }));

  return [
    ...staticPages,
    ...articles,
    ...tagPages,
  ];
}

export function getLatestSitemapDate(entries: SitemapEntry[]): Date {
  const latest = entries.reduce(
    (current, entry) =>
      entry.lastModified.getTime() > current.getTime()
        ? entry.lastModified
        : current,
    new Date(0),
  );

  return latest.getTime() > 0 ? latest : new Date(sitemapFallbackDate);
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (entry) => `  <url>\n    <loc>${escapeXml(entry.url)}</loc>\n    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n    <changefreq>${entry.changeFrequency}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function renderSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const sitemaps = entries
    .map(
      (entry) => `  <sitemap>\n    <loc>${escapeXml(entry.url)}</loc>\n    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`;
}
