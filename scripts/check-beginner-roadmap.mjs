import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const roadmapMetadataDirectory = path.join(root, "content", "roadmap-metadata");
const identityRegistryPath = path.join(root, "content", "roadmap-identities.json");
const generatedRoadmapPath = path.join(root, "src", "generated", "beginner-roadmap-registry.json");
const generatedKnowledgePath = path.join(root, "src", "generated", "knowledge-article-registry.json");
const beginnerSeriesPath = path.join(root, "src", "lib", "beginner-series.ts");
const errors = [];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const contentIdPattern = /^article_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const contentGroupIdPattern = /^group_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
const identityDocument = fs.existsSync(identityRegistryPath) ? readJson(identityRegistryPath) : null;
if (!Array.isArray(roadmapRecords)) addError("beginner-roadmap-registry.json 必须是数组");
if (!Array.isArray(knowledgeRecords)) addError("knowledge-article-registry.json 必须是数组");
if (!isRecord(identityDocument) || identityDocument?.schemaVersion !== 1 || !Array.isArray(identityDocument?.records)) {
  addError("roadmap-identities.json 必须是 schemaVersion=1 且包含 records 数组");
}

const publishedSlugs = new Set();
for (const fileName of fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".md"))) {
  const slug = fileName.replace(/\.md$/, "");
  const { data } = matter(fs.readFileSync(path.join(postsDirectory, fileName), "utf8"));
  if (data.draft !== true) publishedSlugs.add(slug);
}

const identityBySlug = new Map();
const identitySlugByContentId = new Map();
const identitySlugByContentGroupId = new Map();
for (const identity of Array.isArray(identityDocument?.records) ? identityDocument.records : []) {
  if (!isRecord(identity)) {
    addError("Beginner Content Identity record 必须是对象");
    continue;
  }
  const { slug, contentId, contentGroupId } = identity;
  if (typeof slug !== "string" || !slugPattern.test(slug)) {
    addError(`Beginner Content Identity slug 无效：${String(slug)}`);
    continue;
  }
  if (identityBySlug.has(slug)) addError(`Beginner Content Identity 重复 slug：${slug}`);
  else identityBySlug.set(slug, identity);

  if (typeof contentId !== "string" || !contentIdPattern.test(contentId)) {
    addError(`${slug}: contentId 必须是 article_ + UUID`);
  } else {
    const previousSlug = identitySlugByContentId.get(contentId);
    if (previousSlug) addError(`Beginner Content Identity 重复 contentId：${contentId} 同时属于 ${previousSlug} 与 ${slug}`);
    else identitySlugByContentId.set(contentId, slug);
  }

  if (typeof contentGroupId !== "string" || !contentGroupIdPattern.test(contentGroupId)) {
    addError(`${slug}: contentGroupId 必须是 group_ + UUID`);
  } else {
    const previousSlug = identitySlugByContentGroupId.get(contentGroupId);
    if (previousSlug) addError(`Beginner Content Identity 重复 contentGroupId：${contentGroupId} 同时属于 ${previousSlug} 与 ${slug}`);
    else identitySlugByContentGroupId.set(contentGroupId, slug);
  }

  if (!publishedSlugs.has(slug)) addError(`${slug}: Beginner Content Identity 没有对应已发布文章`);
}

const roadmapSlugs = new Set();
const roadmapOrders = new Map();
const stageCounts = new Map();
for (const record of Array.isArray(roadmapRecords) ? roadmapRecords : []) {
  if (!isRecord(record)) {
    addError("Beginner roadmap record 必须是对象");
    continue;
  }
  const { contentId, contentGroupId, slug, roadmap, seo, source } = record;
  if (typeof slug !== "string" || !slugPattern.test(slug)) {
    addError(`Beginner roadmap slug 无效：${String(slug)}`);
    continue;
  }
  if (roadmapSlugs.has(slug)) addError(`Beginner Roadmap 重复 slug：${slug}`);
  roadmapSlugs.add(slug);
  if (!publishedSlugs.has(slug)) addError(`${slug}: Beginner Roadmap 没有对应已发布文章`);

  const identity = identityBySlug.get(slug);
  if (!identity) {
    addError(`${slug}: 缺少 Beginner Content Identity`);
  } else {
    if (contentId !== identity.contentId) addError(`${slug}: generated contentId 与 roadmap-identities.json 不一致`);
    if (contentGroupId !== identity.contentGroupId) addError(`${slug}: generated contentGroupId 与 roadmap-identities.json 不一致`);
  }

  if (!isRecord(roadmap) || !isRecord(seo)) {
    addError(`${slug}: roadmap 与 seo 必须是对象`);
    continue;
  }
  if (!sourceValues.has(source)) addError(`${slug}: source 必须是 migration-sidecar 或 frontmatter`);
  if (roadmap.id !== "beginner") addError(`${slug}: roadmap.id 必须是 beginner`);
  if (typeof roadmap.stage !== "string" || !stageIds.has(roadmap.stage)) addError(`${slug}: Beginner stage 不存在：${String(roadmap.stage)}`);
  if (!Number.isInteger(roadmap.order) || roadmap.order <= 0) {
    addError(`${slug}: roadmap.order 必须是正整数`);
  } else {
    const previous = roadmapOrders.get(roadmap.order);
    if (previous) addError(`Beginner roadmap.order ${roadmap.order} 同时属于 ${previous} 与 ${slug}`);
    else roadmapOrders.set(roadmap.order, slug);
  }
  if (roadmap.difficulty !== "beginner") addError(`${slug}: Beginner difficulty 必须是 beginner`);
  if (typeof seo.primaryKeyword !== "string" || seo.primaryKeyword.trim() === "") addError(`${slug}: seo.primaryKeyword 必须是非空字符串`);
  if (typeof seo.searchIntent !== "string" || seo.searchIntent.trim() === "") addError(`${slug}: seo.searchIntent 必须是非空字符串`);
  if (seo.keywordRole !== "owner") addError(`${slug}: Beginner Roadmap 当前必须声明 keywordRole=owner`);
  if (typeof roadmap.stage === "string") stageCounts.set(roadmap.stage, (stageCounts.get(roadmap.stage) ?? 0) + 1);
}

for (const slug of identityBySlug.keys()) {
  if (!roadmapSlugs.has(slug)) addError(`${slug}: Beginner Content Identity 没有进入 Beginner Roadmap registry`);
}
for (const slug of roadmapSlugs) {
  if (!identityBySlug.has(slug)) addError(`${slug}: Beginner Roadmap 缺少永久 Content Identity`);
}

for (const stageId of stageIds) {
  if ((stageCounts.get(stageId) ?? 0) === 0) addError(`Beginner stage ${stageId} 不能为空`);
}

if (fs.existsSync(roadmapMetadataDirectory)) {
  for (const fileName of fs.readdirSync(roadmapMetadataDirectory).filter((name) => name.endsWith(".json"))) {
    const slug = fileName.replace(/\.json$/, "");
    if (!fs.existsSync(path.join(postsDirectory, `${slug}.md`))) addError(`${fileName}: roadmap sidecar 没有对应文章`);
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

const globalContentIds = new Map();
const globalGroupIds = new Map();
for (const record of [...(Array.isArray(knowledgeRecords) ? knowledgeRecords : []), ...(Array.isArray(roadmapRecords) ? roadmapRecords : [])]) {
  if (typeof record?.contentId !== "string" || !contentIdPattern.test(record.contentId)) {
    addError(`${record?.slug ?? "unknown"}: generated article 缺少合法 contentId`);
  } else {
    const previous = globalContentIds.get(record.contentId);
    if (previous) addError(`全站 contentId 冲突：${record.contentId} 同时属于 ${previous} 与 ${record.slug}`);
    else globalContentIds.set(record.contentId, record.slug);
  }

  if (typeof record?.contentGroupId !== "string" || !contentGroupIdPattern.test(record.contentGroupId)) {
    addError(`${record?.slug ?? "unknown"}: generated article 缺少合法 contentGroupId`);
  } else {
    const previous = globalGroupIds.get(record.contentGroupId);
    if (previous) addError(`中文文章 contentGroupId 冲突：${record.contentGroupId} 同时属于 ${previous} 与 ${record.slug}`);
    else globalGroupIds.set(record.contentGroupId, record.slug);
  }
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
console.log(`Beginner roadmap check passed: ${roadmapRecords.length} roadmap article(s), ${identityBySlug.size} Beginner identities, ${stageSummary}, ${publishedSlugs.size}/${publishedSlugs.size} published articles classified, global Content Identity conflicts 0, combined Owner conflicts 0.`);
