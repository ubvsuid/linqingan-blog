import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const roadmapMetadataDirectory = path.join(root, "content", "roadmap-metadata");
const outputPath = path.join(root, "src", "generated", "beginner-roadmap-registry.json");

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

  records.push({
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
  console.log(`Beginner roadmap registry generated: ${records.length} record(s), file updated.`);
} else {
  console.log(`Beginner roadmap registry generated: ${records.length} record(s), already current.`);
}
