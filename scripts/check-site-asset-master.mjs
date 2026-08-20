import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { buildSiteAssetMaster } from "./lib/site-asset-master.mjs";

const root = process.cwd();
const errors = [];
const master = buildSiteAssetMaster(root);
const assets = master.assets;

function addError(message) {
  errors.push(message);
}

function countGeneratedArticles() {
  const knowledge = JSON.parse(fs.readFileSync(path.join(root, "src", "generated", "knowledge-article-registry.json"), "utf8"));
  const roadmap = JSON.parse(fs.readFileSync(path.join(root, "src", "generated", "beginner-roadmap-registry.json"), "utf8"));
  return knowledge.length + roadmap.length;
}

function countSourceMetadataArticles() {
  const postsDirectory = path.join(root, "content", "posts");
  const knowledgeMetadataDirectory = path.join(root, "content", "knowledge-metadata");
  const roadmapMetadataDirectory = path.join(root, "content", "roadmap-metadata");
  let count = 0;

  for (const fileName of fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".md"))) {
    const slug = fileName.replace(/\.md$/, "");
    const { data } = matter(fs.readFileSync(path.join(postsDirectory, fileName), "utf8"));
    if (data.draft === true) continue;

    const hasInlineKnowledge = Boolean(data.knowledge && data.seo);
    const hasInlineRoadmap = Boolean(data.roadmap && data.seo);
    const hasKnowledgeSidecar = fs.existsSync(path.join(knowledgeMetadataDirectory, `${slug}.json`));
    const hasRoadmapSidecar = fs.existsSync(path.join(roadmapMetadataDirectory, `${slug}.json`));
    if (hasInlineKnowledge || hasInlineRoadmap || hasKnowledgeSidecar || hasRoadmapSidecar) count += 1;
  }

  return count;
}

const idSet = new Set();
const pathSet = new Set();
for (const asset of assets) {
  if (!asset.assetId) addError("存在缺少 assetId 的资产");
  else if (idSet.has(asset.assetId)) addError(`assetId 重复：${asset.assetId}`);
  else idSet.add(asset.assetId);

  if (!asset.path) addError(`${asset.assetId}: 缺少 path`);
  else if (pathSet.has(asset.path)) addError(`资产 path 重复：${asset.path}`);
  else pathSet.add(asset.path);

  if (asset.language !== "zh-CN") addError(`${asset.assetId}: 第一版 Asset Master 仅接受 zh-CN 资产`);
  if (!asset.assetType) addError(`${asset.assetId}: 缺少 assetType`);
  if (!asset.contentSystem) addError(`${asset.assetId}: 缺少 contentSystem`);
  if (!asset.sourceOfTruth) addError(`${asset.assetId}: 缺少 sourceOfTruth`);
  if (!asset.joinKeys || asset.joinKeys.path !== asset.path) addError(`${asset.assetId}: joinKeys.path 与资产 path 不一致`);
  if (!asset.decision?.health || !asset.decision?.opportunity) addError(`${asset.assetId}: 缺少 decision hooks`);

  if (asset.routeKind === "fragment") {
    if (!asset.path.includes("#")) addError(`${asset.assetId}: fragment 资产必须包含 #`);
    if (asset.canonicalPath === asset.path) addError(`${asset.assetId}: fragment 不应把带 # 的地址作为 canonicalPath`);
  }

  if (asset.assetType === "article") {
    if (!asset.slug) addError(`${asset.assetId}: 文章缺少 slug`);
    if (!asset.title) addError(`${asset.assetId}: 文章缺少 title`);
    if (!asset.primaryKeyword) addError(`${asset.assetId}: 文章缺少 Owner/Primary Keyword`);
    if (asset.keywordRole !== "owner") addError(`${asset.assetId}: 当前文章资产必须是 keyword owner`);
    if (!asset.searchIntent) addError(`${asset.assetId}: 文章缺少 searchIntent`);
    if (!Number.isInteger(asset.order) || asset.order <= 0) addError(`${asset.assetId}: 文章缺少有效 order`);
    if (asset.contentSystem === "knowledge" && !asset.module) addError(`${asset.assetId}: Knowledge 文章缺少 module`);
    if (asset.contentSystem === "roadmap" && !asset.roadmap) addError(`${asset.assetId}: Roadmap 文章缺少 roadmap`);
  }
}

const generatedArticleCount = countGeneratedArticles();
const sourceArticleCount = countSourceMetadataArticles();
const articleCount = assets.filter((asset) => asset.assetType === "article").length;
if (generatedArticleCount !== sourceArticleCount) {
  addError(`generated registries 已过期：generated=${generatedArticleCount}，metadata sources=${sourceArticleCount}。请先运行 knowledgegenerate 与 roadmapgenerate`);
}
if (articleCount !== generatedArticleCount) {
  addError(`文章资产数量不一致：Asset Master=${articleCount}，generated registries=${generatedArticleCount}`);
}

const knowledgeModuleCount = assets.filter((asset) => asset.assetType === "knowledge-module").length;
const sourceKnowledgeModuleCount = new Set(
  assets
    .filter((asset) => asset.assetType === "article" && asset.contentSystem === "knowledge")
    .map((asset) => asset.module),
).size;
if (knowledgeModuleCount !== sourceKnowledgeModuleCount) {
  addError(`Knowledge Module 资产数量不一致：Asset Master=${knowledgeModuleCount}，文章引用=${sourceKnowledgeModuleCount}`);
}

const toolCount = assets.filter((asset) => asset.assetType === "tool").length;
const diagnosticCount = assets.filter((asset) => asset.assetType === "diagnostic").length;
const apiHubCount = assets.filter((asset) => asset.assetType === "api-hub").length;
if (toolCount === 0) addError("未从 tool-catalog 读取到工具资产");
if (diagnosticCount === 0) addError("未从 diagnostic registry 读取到诊断资产");
if (apiHubCount === 0) addError("未从 API Hub registry 读取到 API Hub 资产");

if (errors.length > 0) {
  console.error("Site Asset Master validation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const typeCounts = Object.fromEntries(
  [...new Set(assets.map((asset) => asset.assetType))]
    .sort()
    .map((type) => [type, assets.filter((asset) => asset.assetType === type).length]),
);

console.log("Site Asset Master validation passed.");
console.log(`Assets: ${assets.length}`);
console.log(`Articles: ${articleCount}/${sourceArticleCount}`);
console.log(`Knowledge modules: ${knowledgeModuleCount}`);
console.log(`Types: ${JSON.stringify(typeCounts)}`);
