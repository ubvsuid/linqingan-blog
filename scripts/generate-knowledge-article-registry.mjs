import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const migrationMetadataDirectory = path.join(root, "content", "knowledge-metadata");
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

  records.push({
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
  console.log(`Knowledge article registry generated: ${records.length} record(s), file updated.`);
} else {
  console.log(`Knowledge article registry generated: ${records.length} record(s), already current.`);
}
