import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { changelogEntries } from "@/lib/changelog";
import {
  englishDiscoveryArticles,
  englishTags,
} from "@/lib/english-discovery";
import { englishKnowledgeSections } from "@/lib/english-knowledge";
import { knowledgeBaseSections } from "@/lib/knowledge-base";
import { nowEntries } from "@/lib/now-entries";
import { getAllPosts } from "@/lib/posts";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";
import {
  getStaticPageLastModified,
  type StaticPagePath,
} from "@/lib/static-page-revisions";
import { getPostsForTag, getTagRecords } from "@/lib/tags";

export interface SitemapEntry {
  url: string;
  lastModified: Date;
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

function staticPageEntry(
  pathname: StaticPagePath,
  dependentContentDates: string[] = [],
): SitemapEntry {
  return {
    url: pathname === "/" ? siteConfig.url : `${siteConfig.url}${pathname}`,
    lastModified: getStaticPageLastModified(pathname, dependentContentDates),
  };
}

export function getChineseSitemapEntries(): SitemapEntry[] {
  const allPosts = getAllPosts();
  const postsBySlug = new Map(allPosts.map((post) => [post.slug, post]));
  const allPostDates = allPosts.map(
    (post) => post.updatedAt ?? post.publishedAt,
  );
  const beginnerDates = beginnerSeriesSlugs.flatMap((slug) => {
    const post = postsBySlug.get(slug);
    return post ? [post.updatedAt ?? post.publishedAt] : [];
  });
  const verifiedDates = allPosts
    .filter(
      (post) =>
        post.verification.consoleTested || post.verification.liveTested,
    )
    .map(
      (post) =>
        post.verification.testedAt ??
        post.verification.checkedAt ??
        post.updatedAt ??
        post.publishedAt,
    );
  const changelogDates = changelogEntries.map((entry) => entry.date);
  const nowDates = nowEntries.map((entry) => entry.date);
  const projectDates = projects.map((project) => project.updatedAt);
  const chineseToolPaths: StaticPagePath[] = [
    "/tools/creep-body-calculator",
    "/tools/room-diagnostics",
    "/tools/market-terminal-cost-calculator",
    "/tools/controller-downgrade-planner",
    "/tools/lab-reaction-boost-planner",
    "/tools/spawn-queue-replacement-planner",
    "/tools/hauling-throughput-planner",
    "/tools/tower-damage-heal-repair-calculator",
  ];

  const staticPages: SitemapEntry[] = [
    staticPageEntry("/", allPostDates),
    staticPageEntry("/beginner", beginnerDates),
    staticPageEntry("/blog", allPostDates),
    staticPageEntry("/knowledge", allPostDates),
    staticPageEntry("/screeps-api"),
    staticPageEntry(
      "/tools",
      chineseToolPaths.map((path) =>
        getStaticPageLastModified(path).toISOString(),
      ),
    ),
    ...chineseToolPaths.map((path) => staticPageEntry(path)),
    staticPageEntry("/glossary"),
    staticPageEntry("/screeps-errors"),
    staticPageEntry("/verification"),
    staticPageEntry("/verified", verifiedDates),
    staticPageEntry("/tags", allPostDates),
    staticPageEntry("/now", nowDates),
    staticPageEntry("/changelog", changelogDates),
    staticPageEntry("/about", projectDates),
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
    }),
  );

  const posts: SitemapEntry[] = allPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
  }));

  const tagPages: SitemapEntry[] = getTagRecords()
    .filter((tag) => tag.count >= 3)
    .map((tag) => ({
      url: `${siteConfig.url}/tags/${tag.slug}`,
      lastModified: latestDate(
        getPostsForTag(tag.slug).map(
          (post) => post.updatedAt ?? post.publishedAt,
        ),
      ),
    }));

  return [...staticPages, ...knowledgeModulePages, ...posts, ...tagPages];
}

export function getEnglishSitemapEntries(): SitemapEntry[] {
  const englishArticleDates = englishDiscoveryArticles.map(
    (article) => article.updatedAt,
  );
  const englishChangelogDates = changelogEntries.map((entry) => entry.date);
  const englishBeginnerHrefs = new Set([
    "/en/blog/screeps-introduction",
    "/en/blog/screeps-first-room",
    "/en/blog/screeps-tick-game-loop",
    "/en/blog/screeps-creep-harvest-energy",
    "/en/blog/screeps-transfer-energy-to-spawn",
    "/en/blog/screeps-creep-body-parts",
    "/en/blog/screeps-spawn-creep",
    "/en/blog/screeps-creep-roles",
    "/en/blog/screeps-upgrade-controller",
    "/en/blog/screeps-first-extension",
    "/en/blog/screeps-build-repair",
    "/en/blog/screeps-first-room-code",
  ]);
  const englishBeginnerDates = englishDiscoveryArticles
    .filter((article) => englishBeginnerHrefs.has(article.href))
    .map((article) => article.updatedAt);
  const englishToolPaths: StaticPagePath[] = [
    "/en/tools/creep-body-calculator",
    "/en/tools/room-diagnostics",
    "/en/tools/market-terminal-cost-calculator",
    "/en/tools/controller-downgrade-planner",
    "/en/tools/lab-reaction-boost-planner",
    "/en/tools/spawn-queue-replacement-planner",
    "/en/tools/hauling-throughput-planner",
    "/en/tools/tower-damage-heal-repair-calculator",
  ];

  const staticPages: SitemapEntry[] = [
    staticPageEntry("/en", [
      ...englishArticleDates,
      ...englishChangelogDates,
    ]),
    staticPageEntry("/en/beginner", englishBeginnerDates),
    staticPageEntry("/en/blog", englishArticleDates),
    staticPageEntry("/en/knowledge", englishArticleDates),
    staticPageEntry("/en/tags", englishArticleDates),
    staticPageEntry(
      "/en/tools",
      englishToolPaths.map((path) =>
        getStaticPageLastModified(path).toISOString(),
      ),
    ),
    ...englishToolPaths.map((path) => staticPageEntry(path)),
    staticPageEntry("/en/screeps-errors"),
    staticPageEntry("/en/glossary"),
    staticPageEntry("/en/verification"),
    staticPageEntry("/en/evidence"),
    staticPageEntry("/en/about"),
    staticPageEntry("/en/changelog", englishChangelogDates),
    staticPageEntry("/en/roadmap"),
    staticPageEntry("/en/license"),
  ];

  const knowledgePillars: SitemapEntry[] = englishKnowledgeSections.map(
    (section) => ({
      url: `${siteConfig.url}/en/knowledge/${section.slug}`,
      lastModified: latestDate(
        section.articles.map((article) => {
          const discovery = englishDiscoveryArticles.find(
            (item) => item.href === article.href,
          );
          return discovery?.updatedAt ?? article.publishedAt;
        }),
      ),
    }),
  );

  const articles: SitemapEntry[] = englishDiscoveryArticles.map((article) => ({
    url: `${siteConfig.url}${article.href}`,
    lastModified: new Date(article.updatedAt),
  }));

  const tagPages: SitemapEntry[] = englishTags
    .filter((tag) => tag.count >= 3)
    .map((tag) => ({
      url: `${siteConfig.url}/en/tags/${tag.slug}`,
      lastModified: latestDate(
        englishDiscoveryArticles
          .filter((article) => article.tagSlugs.includes(tag.slug))
          .map((article) => article.updatedAt),
      ),
    }));

  return [...staticPages, ...knowledgePillars, ...articles, ...tagPages];
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

export function renderSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const sitemaps = entries
    .map(
      (entry) =>
        `  <sitemap>\n    <loc>${escapeXml(entry.url)}</loc>\n    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`;
}
