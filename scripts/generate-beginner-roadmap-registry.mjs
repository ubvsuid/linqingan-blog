import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const roadmapMetadataDirectory = path.join(root, "content", "roadmap-metadata");
const outputPath = path.join(
  root,
  "src",
  "generated",
  "beginner-roadmap-registry.json",
);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const records = [];
for (const fileName of fs
  .readdirSync(roadmapMetadataDirectory)
  .filter((name) => name.endsWith(".json"))
  .sort()) {
  const slug = fileName.replace(/\.json$/, "");
  const filePath = path.join(roadmapMetadataDirectory, fileName);
  const postPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(postPath)) {
    throw new Error(`${filePath}: roadmap sidecar 没有对应文章`);
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!isRecord(parsed) || !isRecord(parsed.roadmap) || !isRecord(parsed.seo)) {
    throw new Error(`${filePath}: roadmap 与 seo 必须同时为对象`);
  }

  records.push({
    slug,
    roadmap: parsed.roadmap,
    seo: parsed.seo,
    source: "migration-sidecar",
  });
}

records.sort(
  (left, right) =>
    String(left.roadmap.id).localeCompare(String(right.roadmap.id)) ||
    Number(left.roadmap.order) - Number(right.roadmap.order) ||
    left.slug.localeCompare(right.slug),
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const nextOutput = `${JSON.stringify(records, null, 2)}\n`;
const previousOutput = fs.existsSync(outputPath)
  ? fs.readFileSync(outputPath, "utf8")
  : null;

if (previousOutput !== nextOutput) {
  fs.writeFileSync(outputPath, nextOutput, "utf8");
  console.log(`Beginner roadmap registry generated: ${records.length} record(s), file updated.`);
} else {
  console.log(`Beginner roadmap registry generated: ${records.length} record(s), already current.`);
}
