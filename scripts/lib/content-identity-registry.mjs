import fs from "node:fs";
import path from "node:path";

export const CONTENT_ID_PATTERN =
  /^article_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const CONTENT_GROUP_ID_PATTERN =
  /^group_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const CONTENT_IDENTITY_REGISTRY_FILES = [
  "content/knowledge-identities.json",
  "content/roadmap-identities.json",
];

let cache = null;
let cacheRoot = null;

function parseRegistry(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const payload = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  if (payload?.schemaVersion !== 1 || !Array.isArray(payload.records)) {
    throw new Error(`${relativePath} must use Content Identity schemaVersion 1 with records[]`);
  }
  return payload.records;
}

export function loadContentIdentityRegistry(root = process.cwd()) {
  if (cache && cacheRoot === root) return cache;

  const bySlug = new Map();
  const contentIds = new Set();

  for (const relativePath of CONTENT_IDENTITY_REGISTRY_FILES) {
    for (const record of parseRegistry(root, relativePath)) {
      const slug = String(record?.slug ?? "").trim();
      const contentId = String(record?.contentId ?? "").trim();
      const contentGroupId = String(record?.contentGroupId ?? "").trim();

      if (!slug) throw new Error(`${relativePath} contains a record without slug`);
      if (!CONTENT_ID_PATTERN.test(contentId)) {
        throw new Error(`${relativePath}: ${slug} has invalid contentId`);
      }
      if (!CONTENT_GROUP_ID_PATTERN.test(contentGroupId)) {
        throw new Error(`${relativePath}: ${slug} has invalid contentGroupId`);
      }
      if (bySlug.has(slug)) throw new Error(`Duplicate Content Identity slug: ${slug}`);
      if (contentIds.has(contentId)) throw new Error(`Duplicate Content Identity contentId: ${contentId}`);

      const normalized = Object.freeze({ slug, contentId, contentGroupId });
      bySlug.set(slug, normalized);
      contentIds.add(contentId);
    }
  }

  cache = Object.freeze({
    bySlug,
    records: Object.freeze([...bySlug.values()]),
  });
  cacheRoot = root;
  return cache;
}

export function resolveContentIdentity(articleSlug, root = process.cwd()) {
  const slug = String(articleSlug ?? "").trim();
  const identity = loadContentIdentityRegistry(root).bySlug.get(slug);
  if (!identity) {
    throw new Error(
      `Article ${slug || "(empty)"} has no permanent Content Identity; runtime evidence cannot be captured for an unowned slug`,
    );
  }
  return identity;
}
