import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const roadmapMetadataDirectory = path.join(root, "content", "roadmap-metadata");
const identityRegistryPath = path.join(root, "content", "roadmap-identities.json");
const outputPath = path.join(root, "src", "generated", "beginner-roadmap-registry.json");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const contentIdPattern = /^article_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const contentGroupIdPattern = /^group_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readSidecar(slug) {
  const filePath = path.join(roadmapMetadataDirectory, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!isRecord(parsed)) throw new Error(`${filePath}: Roadmap migration metadata 必须是对象`);
  return parsed;
}

function loadIdentityRegistry() {
  if (!fs.existsSync(identityRegistryPath)) {
    throw new Error(`${identityRegistryPath}: 缺少 Beginner Content Identity V1 registry`);
  }

  const parsed = JSON.parse(fs.readFileSync(identityRegistryPath, "utf8"));
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.records)) {
    throw new Error(`${identityRegistryPath}: 必须是 schemaVersion=1 且包含 records 数组`);
  }

  const bySlug = new Map();
  const seenContentIds = new Set();
  const seenContentGroupIds = new Set();
  for (const record of parsed.records) {
    if (!isRecord(record) || typeof record.slug !== "string" || !slugPattern.test(record.slug)) {
      throw new Error(`${identityRegistryPath}: identity record 必须包含合法 slug`);
    }
    if (!contentIdPattern.test(record.contentId ?? "")) {
      throw new Error(`${identityRegistryPath}: ${record.slug} 的 contentId 必须是 article_ + UUID`);
    }
    if (!contentGroupIdPattern.test(record.contentGroupId ?? "")) {
      throw new Error(`${identityRegistryPath}: ${record.slug} 的 contentGroupId 必须是 group_ + UUID`);
    }
    if (bySlug.has(record.slug)) {
      throw new Error(`${identityRegistryPath}: 重复 identity slug：${record.slug}`);
    }
    if (seenContentIds.has(record.contentId)) {
      throw new Error(`${identityRegistryPath}: 重复 contentId：${record.contentId}`);
    }
    if (seenContentGroupIds.has(record.contentGroupId)) {
      throw new Error(`${identityRegistryPath}: 中文 Beginner V1 中重复 contentGroupId：${record.contentGroupId}`);
    }
    bySlug.set(record.slug, record);
    seenContentIds.add(record.contentId);
    seenContentGroupIds.add(record.contentGroupId);
  }
  return bySlug;
}

const identitiesBySlug = loadIdentityRegistry();
const consumedIdentitySlugs = new Set();
const records = [];

for (const fileName of fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".md")).sort()) {
  const slug = fileName.replace(/\.md$/, "");
  const filePath = path.join(postsDirectory, fileName);
  const { data } = matter(fs.readFileSync(filePath, "utf8"));
  if (data.draft === true) continue;

  const sidecar = readSidecar(slug);
  const inlineHasRoadmap = data.roadmap !== undefined;
  const inlineHasSeo = data.seo !== undefined;

  if (sidecar && (inlineHasRoadmap || inlineHasSeo)) {
    throw new Error(`${filePath}: 已存在 frontmatter roadmap/seo，请删除对应 migration sidecar，保持单一 Source of Truth`);
  }

  // `seo` is shared by multiple metadata namespaces. An inline Knowledge article
  // may legitimately have `knowledge + seo` without belonging to a Roadmap.
  if (!sidecar && !inlineHasRoadmap) continue;

  const source = sidecar ?? data;
  const hasRoadmap = source.roadmap !== undefined;
  const hasSeo = source.seo !== undefined;
  if (!hasRoadmap || !hasSeo) throw new Error(`${filePath}: roadmap 与 seo 必须同时声明`);
  if (!isRecord(source.roadmap) || !isRecord(source.seo)) {
    throw new Error(`${filePath}: roadmap 与 seo 必须是对象`);
  }
  if (source.roadmap.id !== "beginner") continue;

  const identity = identitiesBySlug.get(slug);
  if (!identity) {
    throw new Error(`${filePath}: 缺少 Content Identity。请先在 content/roadmap-identities.json 中分配永久 ID`);
  }
  consumedIdentitySlugs.add(slug);

  records.push({
    contentId: identity.contentId,
    contentGroupId: identity.contentGroupId,
    slug,
    roadmap: source.roadmap,
    seo: source.seo,
    source: sidecar ? "migration-sidecar" : "frontmatter",
  });
}

if (fs.existsSync(roadmapMetadataDirectory)) {
  for (const fileName of fs.readdirSync(roadmapMetadataDirectory).filter((name) => name.endsWith(".json"))) {
    const slug = fileName.replace(/\.json$/, "");
    if (!fs.existsSync(path.join(postsDirectory, `${slug}.md`))) {
      throw new Error(`${fileName}: roadmap sidecar 没有对应文章`);
    }
  }
}

for (const slug of identitiesBySlug.keys()) {
  if (!consumedIdentitySlugs.has(slug)) {
    throw new Error(`${identityRegistryPath}: ${slug} 没有对应的已发布 Beginner article`);
  }
}

records.sort(
  (left, right) =>
    String(left.roadmap.id).localeCompare(String(right.roadmap.id)) ||
    Number(left.roadmap.order) - Number(right.roadmap.order) ||
    left.slug.localeCompare(right.slug),
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const nextOutput = `${JSON.stringify(records, null, 2)}\n`;
const previousOutput = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
if (previousOutput !== nextOutput) {
  fs.writeFileSync(outputPath, nextOutput, "utf8");
  console.log(`Beginner roadmap registry generated: ${records.length} record(s), Content Identity V1 attached, file updated.`);
} else {
  console.log(`Beginner roadmap registry generated: ${records.length} record(s), Content Identity V1 attached, already current.`);
}
