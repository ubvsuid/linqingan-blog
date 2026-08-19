import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const roadmapMetadataDirectory = path.join(root, "content", "roadmap-metadata");
const generatedRoadmapPath = path.join(root, "src", "generated", "beginner-roadmap-registry.json");
const generatedKnowledgePath = path.join(root, "src", "generated", "knowledge-article-registry.json");
const beginnerSeriesPath = path.join(root, "src", "lib", "beginner-series.ts");
const errors = [];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const expected = [
  ["screeps-introduction", "understand-screeps", 10],
  ["screeps-first-room", "understand-screeps", 20],
  ["screeps-tick-and-game-loop", "understand-screeps", 30],
  ["screeps-first-creep-harvest", "control-first-creep", 40],
  ["screeps-creep-deliver-energy", "control-first-creep", 50],
  ["screeps-creep-body-parts", "control-first-creep", 60],
  ["screeps-spawn-create-creep", "build-room-team", 70],
  ["screeps-creep-roles", "build-room-team", 80],
  ["screeps-upgrade-controller", "build-room-team", 90],
  ["screeps-first-extension", "complete-room-loop", 100],
  ["screeps-build-and-repair", "complete-room-loop", 110],
  ["screeps-first-room-code", "complete-room-loop", 120],
];
const stageCounts = new Map([
  ["understand-screeps", 3],
  ["control-first-creep", 3],
  ["build-room-team", 3],
  ["complete-room-loop", 3],
]);

function addError(message) {
  errors.push(message);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeKeyword(value) {
  return String(value).normalize("NFKC").trim().toLowerCase();
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
    addError(`${fileName}: roadmap sidecar 没有对应文章`);
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    addError(`${fileName}: JSON 解析失败：${String(error)}`);
    continue;
  }

  if (!isRecord(parsed) || !isRecord(parsed.roadmap) || !isRecord(parsed.seo)) {
    addError(`${fileName}: roadmap 与 seo 必须同时为对象`);
    continue;
  }

  const { roadmap, seo } = parsed;
  if (roadmap.id !== "beginner") addError(`${fileName}: roadmap.id 必须是 beginner`);
  if (typeof roadmap.stage !== "string" || !slugPattern.test(roadmap.stage)) {
    addError(`${fileName}: roadmap.stage 必须是小写 slug`);
  }
  if (!Number.isInteger(roadmap.order) || roadmap.order <= 0) {
    addError(`${fileName}: roadmap.order 必须是正整数`);
  }
  if (roadmap.difficulty !== "beginner") {
    addError(`${fileName}: Beginner Roadmap difficulty 必须是 beginner`);
  }
  if (typeof seo.primaryKeyword !== "string" || seo.primaryKeyword.trim() === "") {
    addError(`${fileName}: seo.primaryKeyword 必须是非空字符串`);
  }
  if (typeof seo.searchIntent !== "string" || seo.searchIntent.trim() === "") {
    addError(`${fileName}: seo.searchIntent 必须是非空字符串`);
  }
  if (seo.keywordRole !== "owner") {
    addError(`${fileName}: Beginner Roadmap 当前每篇必须声明 keywordRole=owner`);
  }

  records.push({ slug, roadmap, seo, source: "migration-sidecar" });
}

records.sort(
  (left, right) => left.roadmap.order - right.roadmap.order || left.slug.localeCompare(right.slug),
);

if (records.length !== expected.length) {
  addError(`Beginner Roadmap 数量错误：预期 ${expected.length}，实际 ${records.length}`);
}
for (let index = 0; index < expected.length; index += 1) {
  const actual = records[index];
  const row = expected[index];
  if (!actual) continue;
  if (actual.slug !== row[0] || actual.roadmap.stage !== row[1] || actual.roadmap.order !== row[2]) {
    addError(
      `Beginner parity #${index + 1} 失败：预期 ${row.join(" / ")}，实际 ${actual.slug} / ${actual.roadmap.stage} / ${actual.roadmap.order}`,
    );
  }
}
for (const [stage, expectedCount] of stageCounts) {
  const actualCount = records.filter((record) => record.roadmap.stage === stage).length;
  if (actualCount !== expectedCount) {
    addError(`Beginner stage ${stage} 数量错误：预期 ${expectedCount}，实际 ${actualCount}`);
  }
}
const orders = records.map((record) => record.roadmap.order);
if (new Set(orders).size !== orders.length) addError("Beginner Roadmap 存在重复 roadmap.order");

if (!fs.existsSync(generatedRoadmapPath)) {
  addError("缺少生成后的 beginner-roadmap-registry.json");
} else {
  const generated = JSON.parse(fs.readFileSync(generatedRoadmapPath, "utf8"));
  if (JSON.stringify(generated) !== JSON.stringify(records)) {
    addError("beginner-roadmap-registry.json 与 roadmap sidecar 不一致，请先运行 roadmapgenerate");
  }
}

const beginnerSeriesSource = fs.readFileSync(beginnerSeriesPath, "utf8");
if (/["']screeps-[a-z0-9-]+["']/.test(beginnerSeriesSource)) {
  addError("beginner-series.ts 仍硬编码 Beginner 文章 slug；路线成员/顺序必须来自生成 Registry");
}

const ownerByKeyword = new Map();
const knowledgeRecords = fs.existsSync(generatedKnowledgePath)
  ? JSON.parse(fs.readFileSync(generatedKnowledgePath, "utf8"))
  : [];
for (const record of [...knowledgeRecords, ...records]) {
  if (!record?.seo || record.seo.keywordRole !== "owner") continue;
  const key = normalizeKeyword(record.seo.primaryKeyword);
  const previous = ownerByKeyword.get(key);
  if (previous) {
    addError(`全站 Keyword Owner 冲突：${record.seo.primaryKeyword} 同时属于 ${previous} 与 ${record.slug}`);
  } else {
    ownerByKeyword.set(key, record.slug);
  }
}

const knowledgeSlugs = new Set(knowledgeRecords.map((record) => record.slug));
for (const record of records) {
  if (knowledgeSlugs.has(record.slug)) {
    addError(`${record.slug}: 同时进入 Beginner Roadmap 与 Knowledge Module`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\nBeginner roadmap check failed: ${errors.length} issue(s).`);
  process.exit(1);
}

console.log(
  `Beginner roadmap check passed: ${records.length}/${expected.length} articles, stages 3/3/3/3, combined Owner conflicts 0.`,
);
