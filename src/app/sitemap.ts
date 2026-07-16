import type { MetadataRoute } from "next";

import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { nowEntries } from "@/lib/now-entries";
import { getCollectionPageHref, getTotalPages } from "@/lib/pagination";
import { getAllPosts } from "@/lib/posts";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

function createArchivePages(
  basePath: string,
  totalItems: number,
  lastModified: Date,
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
        lastModified,
        changeFrequency,
        priority,
      };
    },
  );
}

function latestDate(values: string[], fallback = "2026-07-16"): Date {
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
  const beginnerUpdatedAt = latestDate(
    beginnerSeriesSlugs.flatMap((slug) => {
      const post = postsBySlug.get(slug);
      return post ? [post.updatedAt ?? post.publishedAt] : [];
    }),
  );
  const projectsUpdatedAt = latestDate(projects.map((project) => project.updatedAt));
  const nowUpdatedAt = latestDate(nowEntries.map((entry) => entry.date));

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
      url: `${siteConfig.url}/projects`,
      lastModified: projectsUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/now`,
      lastModified: nowUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: nowUpdatedAt,
      changeFrequency: "yearly",
      priority: 0.65,
    },
  ];

  const archivePages: MetadataRoute.Sitemap = [
    ...createArchivePages(
      "/blog",
      allPosts.length,
      allPostsUpdatedAt,
      "weekly",
      0.65,
    ),
    ...createArchivePages(
      "/beginner",
      beginnerSeriesSlugs.length,
      beginnerUpdatedAt,
      "weekly",
      0.7,
    ),
    ...createArchivePages(
      "/projects",
      projects.length,
      projectsUpdatedAt,
      "monthly",
      0.6,
    ),
    ...createArchivePages(
      "/now",
      nowEntries.length,
      nowUpdatedAt,
      "monthly",
      0.55,
    ),
  ];

  const posts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...archivePages, ...posts];
}
