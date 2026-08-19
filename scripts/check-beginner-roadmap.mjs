import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const roadmapMetadataDirectory = path.join(root, "content", "roadmap-metadata");
const generatedRoadmapPath = path.join(root, "src", "generated", "beginner-roadmap-registry.json");
const generatedKnowledgePath = path.join(root, "src", "generated", "knowledge-article-registry.json");
const beginnerSeriesPath = path.join(root, "src", "lib", "beginner-series.ts");
const errors = [];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sourceValues = new Set(["migration-sidecar", "frontmatter"]);

function addError(message) {
  errors.push(message);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeKeyword(value) {
  return String(value).normalize("NFKC").trim().toLowerCase();
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    addError(`${filePath}: JSON 解析失败：${String(error)}`);
    return null;
  }
}

const beginnerSeriesSource = fs.readFileSync(beginnerSeriesPath, "utf8");
const stageIds = new Set(
  [...beginnerSeriesSource.matchAll(/^    id: "([a-z0-9-]+)",$/gm)].map((match) => match[1]),
);
if (stageIds.size === 0) {
  addError("beginner-series.ts 未解析到任何 Beginner stage");
}
if (/["']screeps-[a-z0-9-]+["']/.test(beginnerSeriesSource)) {
  addError("beginner-series.ts 仍硬编码 Beginner 文章 slug；成员和顺序必须来自生成 Registry");
}

const roadmapRecords = fs.existsSync(generatedRoadmapPath) ? readJson(generatedRoadmapPath) : [];
const knowledgeRecords = fs.existsSync(generatedKnowledgePath) ? readJson(generatedKnowledgePath) : [];
if (!Array.isArray(roadmapRecords)) addError("beginner-roadmap-registry.json 必须是数组");
if (!Array.isArray(knowledgeRecords)) addError("knowledge-article-registry.json 必须是数组");

const publishedSlugs = new Set();
for (const fileName of fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".md"))) {
  const slug = fileName.replace(/\.md$/, "");
  const { data } = matter(fs.readFileSync(path.join(postsDirectory, fileName), "utf8"));
  if (data.draft !== true) publishedSlugs.add(slug);
}

const roadmapSlugs = new Set();
const roadmapOrders = new Map();
const stageCounts = new Map();
for (const record of Array.isArray(roadmapRecords) ? roadmapRecords : []) {
  if (!isRecord(record)) {
    addError("Beginner roadmap record 必须是对象");
    continue;
  }
  const { slug, roadmap, seo, source } = record;
  if (typeof slug !== "string" || !slugPattern.test(slug)) {
    addError(`Beginner roadmap slug 无效：${String(slug)}`);
    continue;
  }
  if (roadmapSlugs.has(slug)) addError(`Beginner Roadmap 重复 slug：${slug}`);
  roadmapSlugs.add(slug);
  if (!publishedSlugs.has(slug)) addError(`${slug}: Beginner Roadmap 没有对应已发布文章`);
  if (!isRecord(roadmap) || !isRecord(seo)) {
    addError(`${slug}: roadmap 与 seo 必须是对象`);
    continue;
  }
  if (!sourceValues.has(source)) addError(`${slug}: source 必须是 migration-sidecar 或 frontmatter`);
  if (roadmap.id !== "beginner") addError(`${slug}: roadmap.id 必须是 beginner`);
  if (typeof roadmap.stage !== "string" || !stageIds.has(roadmap.stage)) {
    addError(`${slug}: Beginner stage 不存在：${String(roadmap.stage)}`);
  }
  if (!Number.isInteger(roadmap.order) || roadmap.order <= 0) {
    addError(`${slug}: roadmap.order 必须是正整数`);
  } else {
    const previous = roadmapOrders.get(roadmap.order);
    if (previous) addError(`Beginner roadmap.order ${roadmap.order} 同时属于 ${previous} 与 ${slug}`);
    else roadmapOrders.set(roadmap.order, slug);
  }
  if (roadmap.difficulty !== "beginner") addError(`${slug}: Beginner difficulty 必须是 beginner`);
  if (typeof seo.primaryKeyword !== "string" || seo.primaryKeyword.trim() === "") {
    addError(`${slug}: seo.primaryKeyword 必须是非空字符串`);
  }
  if (typeof seo.searchIntent !== "string" || seo.searchIntent.trim() === "") {
    addError(`${slug}: seo.searchIntent 必须是非空字符串`);
  }
  if (seo.keywordRole !== "owner") addError(`${slug}: Beginner Roadmap 当前必须声明 keywordRole=owner`);
  if (typeof roadmap.stage === "string") {
    stageCounts.set(roadmap.stage, (stageCounts.get(roadmap.stage) ?? 0) + 1);
  }
}

for (const stageId of stageIds) {
  if ((stageCounts.get(stageId) ?? 0) === 0) addError(`Beginner stage ${stageId} 不能为空`);
}

if (fs.existsSync(roadmapMetadataDirectory)) {
  for (const fileName of fs.readdirSync(roadmapMetadataDirectory).filter((name) => name.endsWith(".json"))) {
    const slug = fileName.replace(/\.json$/, "");
    if (!fs.existsSync(path.join(postsDirectory, `${slug}.md`))) {
      addError(`${fileName}: roadmap sidecar 没有对应文章`);
    }
  }
}

const knowledgeSlugs = new Set((Array.isArray(knowledgeRecords) ? knowledgeRecords : []).map((record) => record.slug));
for (const slug of roadmapSlugs) {
  if (knowledgeSlugs.has(slug)) addError(`${slug}: 同时进入 Beginner Roadmap 与 Knowledge Module`);
}

const ownerByKeyword = new Map();
for (const record of [...(Array.isArray(knowledgeRecords) ? knowledgeRecords : []), ...(Array.isArray(roadmapRecords) ? roadmapRecords : [])]) {
  if (!record?.seo || record.seo.keywordRole !== "owner") continue;
  const key = normalizeKeyword(record.seo.primaryKeyword);
  const previous = ownerByKeyword.get(key);
  if (previous) addError(`全站 Keyword Owner 冲突：${record.seo.primaryKeyword} 同时属于 ${previous} 与 ${record.slug}`);
  else ownerByKeyword.set(key, record.slug);
}

const classifiedSlugs = new Set([...knowledgeSlugs, ...roadmapSlugs]);
for (const slug of publishedSlugs) {
  if (!classifiedSlugs.has(slug)) addError(`${slug}: 已发布文章未进入 Knowledge Module 或 Beginner Roadmap`);
}
for (const slug of classifiedSlugs) {
  if (!publishedSlugs.has(slug)) addError(`${slug}: Registry 中存在但当前不是已发布文章`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\nBeginner roadmap check failed: ${errors.length} issue(s).`);
  process.exit(1);
}

const stageSummary = [...stageIds].map((stageId) => `${stageId}=${stageCounts.get(stageId) ?? 0}`).join(", ");
console.log(
  `Beginner roadmap check passed: ${roadmapRecords.length} roadmap article(s), ${stageSummary}, ${publishedSlugs.size}/${publishedSlugs.size} published articles classified, combined Owner conflicts 0. New valid roadmap metadata is allowed without checker edits.`,
);
