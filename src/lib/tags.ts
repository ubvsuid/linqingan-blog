import { getAllPosts } from "@/lib/posts";
import fixedTagSlugs from "@/lib/tag-slugs.json";

export interface TagRecord {
  name: string;
  slug: string;
  count: number;
}

export const TAG_ARCHIVE_MIN_COUNT = 2;
export const TAG_INDEX_MIN_COUNT = 3;

export function tagToSlug(tag: string): string {
  const normalizedTag = tag.normalize("NFKC").trim();
  const fixedSlug = (fixedTagSlugs as Record<string, string>)[normalizedTag];

  if (fixedSlug) return fixedSlug;

  return normalizedTag
    .toLocaleLowerCase("zh-CN")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTagRecords(): TagRecord[] {
  const tags = new Map<string, TagRecord>();

  for (const post of getAllPosts()) {
    for (const name of post.tags) {
      const slug = tagToSlug(name);
      if (!slug) continue;
      const existing = tags.get(slug);
      tags.set(slug, {
        name: existing?.name ?? name,
        slug,
        count: (existing?.count ?? 0) + 1,
      });
    }
  }

  return [...tags.values()].sort(
    (left, right) =>
      right.count - left.count || left.name.localeCompare(right.name, "zh-CN"),
  );
}

export function getPublicTagRecords(): TagRecord[] {
  return getTagRecords().filter((tag) => tag.count >= TAG_ARCHIVE_MIN_COUNT);
}

export function getIndexableTagRecords(): TagRecord[] {
  return getTagRecords().filter((tag) => tag.count >= TAG_INDEX_MIN_COUNT);
}

export function getTagRecord(slug: string): TagRecord | undefined {
  return getTagRecords().find((tag) => tag.slug === slug);
}

export function getTagArchiveHref(
  tag: string,
  records: readonly TagRecord[] = getTagRecords(),
): string | null {
  const slug = tagToSlug(tag);
  const record = records.find((candidate) => candidate.slug === slug);
  return record && record.count >= TAG_ARCHIVE_MIN_COUNT
    ? `/tags/${record.slug}`
    : null;
}

export function getPostsForTag(slug: string) {
  return getAllPosts().filter((post) =>
    post.tags.some((tag) => tagToSlug(tag) === slug),
  );
}
