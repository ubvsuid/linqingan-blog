import type { MetadataRoute } from "next";

import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { nowEntries } from "@/lib/now-entries";
import { getCollectionPageHref, getTotalPages } from "@/lib/pagination";
import { getAllPosts, getArticlePosts } from "@/lib/posts";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

function createArchivePages(
  basePath: string,
  totalItems: number,
  changeFrequency: ChangeFrequency,
  priority: number,
): MetadataRoute.Sitemap {
  const totalPages = getTotalPages(totalItems);

  return Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, index) => {
      const page = index + 2;

      return {
        url: `${siteConfig.url}${getCollectionPageHref(basePath, page)}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      };
    },
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const allPosts = getAllPosts();
  const articlePosts = getArticlePosts();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/beginner`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...(articlePosts.length > 0
      ? [
          {
            url: `${siteConfig.url}/blog`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.9,
          },
        ]
      : []),
    ...(projects.length > 0
      ? [
          {
            url: `${siteConfig.url}/projects`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.8,
          },
        ]
      : []),
    ...(nowEntries.length > 0
      ? [
          {
            url: `${siteConfig.url}/now`,
            lastModified: new Date(),
            changeFrequency: "monthly" as const,
            priority: 0.7,
          },
        ]
      : []),
  ];

  const archivePages: MetadataRoute.Sitemap = [
    ...createArchivePages(
      "/blog",
      articlePosts.length,
      "weekly",
      0.65,
    ),
    ...createArchivePages(
      "/beginner",
      beginnerSeriesSlugs.length,
      "weekly",
      0.7,
    ),
    ...createArchivePages("/projects", projects.length, "monthly", 0.6),
    ...createArchivePages("/now", nowEntries.length, "monthly", 0.55),
  ];

  const posts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...archivePages, ...posts];
}
