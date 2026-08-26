import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const migrationMetadataDirectory = path.join(root, "content", "knowledge-metadata");
const identityRegistryPath = path.join(root, "content", "knowledge-identities.json");
const outputPath = path.join(root, "src", "generated", "knowledge-article-registry.json");

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readSidecar(slug) {
  const filePath = path.join(migrationMetadataDirectory, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!isRecord(parsed)) throw new Error(`${filePath}: Knowledge migration metadata 必须是对象`);
  return parsed;
}

function loadIdentityRegistry() {
  if (!fs.existsSync(identityRegistryPath)) {
    throw new Error(`${identityRegistryPath}: 缺少 Knowledge Content Identity V1 registry`);
  }

  const parsed = JSON.parse(fs.readFileSync(identityRegistryPath, "utf8"));
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.records)) {
    throw new Error(`${identityRegistryPath}: 必须是 schemaVersion=1 且包含 records 数组`);
  }

  const bySlug = new Map();
  for (const record of parsed.records) {
    if (!isRecord(record) || typeof record.slug !== "string") {
      throw new Error(`${identityRegistryPath}: identity record 必须包含 slug`);
    }
    if (bySlug.has(record.slug)) {
      throw new Error(`${identityRegistryPath}: 重复 identity slug：${record.slug}`);
    }
    bySlug.set(record.slug, record);
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
  const inlineHasKnowledge = data.knowledge !== undefined;
  const inlineHasSeo = data.seo !== undefined;

  if (sidecar && (inlineHasKnowledge || inlineHasSeo)) {
    throw new Error(`${filePath}: 已存在 frontmatter knowledge/seo，请删除对应 migration sidecar，保持单一 Source of Truth`);
  }

  // `seo` is shared by multiple metadata namespaces. An inline Roadmap article
  // may legitimately have `roadmap + seo` without belonging to Knowledge.
  if (!sidecar && !inlineHasKnowledge) continue;

  const source = sidecar ?? data;
  const hasKnowledge = source.knowledge !== undefined;
  const hasSeo = source.seo !== undefined;
  if (!hasKnowledge || !hasSeo) throw new Error(`${filePath}: knowledge 与 seo 必须同时声明`);
  if (!isRecord(source.knowledge) || !isRecord(source.seo)) {
    throw new Error(`${filePath}: knowledge 与 seo 必须是对象`);
  }

  const identity = identitiesBySlug.get(slug);
  if (!identity) {
    throw new Error(`${filePath}: 缺少 Content Identity。请先在 content/knowledge-identities.json 中分配永久 ID`);
  }
  consumedIdentitySlugs.add(slug);

  records.push({
    contentId: identity.contentId,
    contentGroupId: identity.contentGroupId,
    slug,
    knowledge: source.knowledge,
    seo: source.seo,
    source: sidecar ? "migration-sidecar" : "frontmatter",
  });
}

if (fs.existsSync(migrationMetadataDirectory)) {
  for (const fileName of fs.readdirSync(migrationMetadataDirectory).filter((name) => name.endsWith(".json"))) {
    const slug = fileName.replace(/\.json$/, "");
    if (!fs.existsSync(path.join(postsDirectory, `${slug}.md`))) {
      throw new Error(`${fileName}: Knowledge sidecar 没有对应文章`);
    }
  }
}

for (const slug of identitiesBySlug.keys()) {
  if (!consumedIdentitySlugs.has(slug)) {
    throw new Error(`${identityRegistryPath}: ${slug} 没有对应的已发布 Knowledge article`);
  }
}

records.sort(
  (left, right) =>
    String(left.knowledge.module).localeCompare(String(right.knowledge.module)) ||
    Number(left.knowledge.order) - Number(right.knowledge.order) ||
    left.slug.localeCompare(right.slug),
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const nextOutput = `${JSON.stringify(records, null, 2)}\n`;
const previousOutput = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
if (previousOutput !== nextOutput) {
  fs.writeFileSync(outputPath, nextOutput, "utf8");
  console.log(`Knowledge article registry generated: ${records.length} record(s), Content Identity V1 attached, file updated.`);
} else {
  console.log(`Knowledge article registry generated: ${records.length} record(s), Content Identity V1 attached, already current.`);
}
