import { getAllPosts } from "@/lib/posts";

export interface TagRecord {
  name: string;
  slug: string;
  count: number;
}

export function tagToSlug(tag: string): string {
  return tag
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("zh-CN")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTagRecords(): TagRecord[] {
  const tags = new Map<string, TagRecord>();

  for (const post of getAllPosts()) {
    for (const name of post.tags) {
      const slug = tagToSlug(name);
      if (!slug) continue;
      const existing = tags.get(slug);
      tags.set(slug, { name: existing?.name ?? name, slug, count: (existing?.count ?? 0) + 1 });
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
