import type { MetadataRoute } from "next";

import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import {
  CHANGELOG_ITEMS_PER_PAGE,
  changelogEntries,
} from "@/lib/changelog";
import { knowledgeBaseSections } from "@/lib/knowledge-base";
import { nowEntries } from "@/lib/now-entries";
import { getCollectionPageHref, getTotalPages } from "@/lib/pagination";
import { getAllPosts } from "@/lib/posts";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";
import { getTagRecords } from "@/lib/tags";

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

const staticPageDates = {
  about: "2026-07-22",
  glossary: "2026-07-18",
  screepsErrors: "2026-07-18",
  verification: "2026-07-22",
  creepBodyCalculator: "2026-07-22",
};

function createArchivePages(
  basePath: string,
  totalItems: number,
  lastModified: Date,
  changeFrequency: ChangeFrequency,
  priority: number,
  itemsPerPage?: number,
): MetadataRoute.Sitemap {
  const totalPages = getTotalPages(totalItems, itemsPerPage);

  return Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, index) => {
      const page = index + 2;

      return {
        url: `${siteConfig.url}${getCollectionPageHref(basePath, page)}`,
        lastModified,
        changeFrequency,
        priority,
      };
    },
  );
}

function latestDate(values: string[], fallback = "2026-07-17"): Date {
  const latest = values
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return new Date(latest || fallback);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const allPosts = getAllPosts();
  const postsBySlug = new Map(allPosts.map((post) => [post.slug, post]));
  const allPostsUpdatedAt = latestDate(
    allPosts.map((post) => post.updatedAt ?? post.publishedAt),
  );
  const allPostsPublishedAt = latestDate(allPosts.map((post) => post.publishedAt));
  const beginnerUpdatedAt = latestDate(
    beginnerSeriesSlugs.flatMap((slug) => {
      const post = postsBySlug.get(slug);
      return post ? [post.updatedAt ?? post.publishedAt] : [];
    }),
  );
  const changelogUpdatedAt = latestDate(changelogEntries.map((entry) => entry.date));
  const nowUpdatedAt = latestDate([
    ...nowEntries.map((entry) => entry.date),
    ...changelogEntries.map((entry) => entry.date),
  ]);
  const aboutUpdatedAt = latestDate([
    staticPageDates.about,
    allPostsPublishedAt.toISOString(),
    ...projects.map((project) => project.updatedAt),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: allPostsUpdatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/beginner`,
      lastModified: beginnerUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${siteConfig.url}/blog`,
      lastModified: allPostsUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/knowledge`,
      lastModified: allPostsUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.94,
    },
    {
      url: `${siteConfig.url}/tools/creep-body-calculator`,
      lastModified: new Date(staticPageDates.creepBodyCalculator),
      changeFrequency: "monthly",
      priority: 0.86,
    },
    {
      url: `${siteConfig.url}/glossary`,
      lastModified: new Date(staticPageDates.glossary),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/screeps-errors`,
      lastModified: new Date(staticPageDates.screepsErrors),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/verification`,
      lastModified: new Date(staticPageDates.verification),
      changeFrequency: "monthly",
      priority: 0.76,
    },
    {
      url: `${siteConfig.url}/tags`,
      lastModified: allPostsUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.72,
    },
    {
      url: `${siteConfig.url}/now`,
      lastModified: nowUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/changelog`,
      lastModified: changelogUpdatedAt,
      changeFrequency: "daily",
      priority: 0.72,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: aboutUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const knowledgeModulePages: MetadataRoute.Sitemap = knowledgeBaseSections.map(
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

  const archivePages: MetadataRoute.Sitemap = [
    ...createArchivePages(
      "/blog",
      allPosts.length,
      allPostsUpdatedAt,
      "weekly",
      0.65,
    ),
    ...createArchivePages(
      "/now",
      nowEntries.length,
      nowUpdatedAt,
      "monthly",
      0.55,
    ),
    ...createArchivePages(
      "/changelog",
      changelogEntries.length,
      changelogUpdatedAt,
      "weekly",
      0.58,
      CHANGELOG_ITEMS_PER_PAGE,
    ),
  ];

  const posts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const tagPages: MetadataRoute.Sitemap = getTagRecords()
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
    ...archivePages,
    ...posts,
    ...tagPages,
  ];
}
