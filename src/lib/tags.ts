import { getAllPosts } from "@/lib/posts";
import canonicalTagNames from "@/lib/tag-canonical-names.json";
import fixedTagSlugs from "@/lib/tag-slugs.json";

export interface TagRecord {
  name: string;
  slug: string;
  count: number;
}

export function tagToSlug(tag: string): string {
  const normalizedTag = tag.normalize("NFKC").trim();
  const fixedSlug = (fixedTagSlugs as Record<string, string>)[normalizedTag];

  if (fixedSlug) return fixedSlug;

  return normalizedTag
    .toLocaleLowerCase("zh-CN")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCanonicalTagName(slug: string, fallback: string): string {
  return (canonicalTagNames as Record<string, string>)[slug] ?? fallback;
}

export function getTagRecords(): TagRecord[] {
  const tags = new Map<string, TagRecord>();

  for (const post of getAllPosts()) {
    for (const name of post.tags) {
      const slug = tagToSlug(name);
      if (!slug) continue;
      const existing = tags.get(slug);
      tags.set(slug, {
        name: getCanonicalTagName(slug, existing?.name ?? name),
        slug,
        count: (existing?.count ?? 0) + 1,
      });
    }
  }

  return [...tags.values()].sort((left, right) =>
    right.count - left.count || left.name.localeCompare(right.name, "zh-CN"),
  );
}

export function getTagRecord(slug: string): TagRecord | undefined {
  return getTagRecords().find((tag) => tag.slug === slug);
}

export function getPostsForTag(slug: string) {
  return getAllPosts().filter((post) => post.tags.some((tag) => tagToSlug(tag) === slug));
}
