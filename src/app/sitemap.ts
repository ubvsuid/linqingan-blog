import type { MetadataRoute } from "next";

import { getBlogTotalPages } from "@/lib/blog-pagination";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
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
    {
      url: `${siteConfig.url}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/projects`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/now`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    },
  ];

  const allPosts = getAllPosts();
  const totalPages = getBlogTotalPages(allPosts.length);
  const archivePages: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, index) => {
      const page = index + 2;

      return {
        url: `${siteConfig.url}/blog/page/${page}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.65,
      };
    },
  );

  const posts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...archivePages, ...posts];
}
