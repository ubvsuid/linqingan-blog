import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { buildSiteAssetMaster } from "./lib/site-asset-master.mjs";
import { extractErrorCodeRecords, extractGlossaryRecords, loadSiteAssetExtensions } from "./lib/site-asset-extensions.mjs";

const root = process.cwd();
const errors = [];
const master = buildSiteAssetMaster(root);
const assets = master.assets;

function addError(message) { errors.push(message); }
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

  if (!["zh-CN", "en"].includes(asset.language)) addError(`${asset.assetId}: 不支持的 language=${asset.language}`);
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
    if (asset.keywordRole !== "owner") addError(`${asset.assetId}: 文章资产必须是 keyword owner`);
    if (!asset.searchIntent) addError(`${asset.assetId}: 文章缺少 searchIntent`);
    if (!Number.isInteger(asset.order) || asset.order <= 0) addError(`${asset.assetId}: 文章缺少有效 order`);
    if (asset.language === "zh-CN") {
      if (asset.contentSystem === "knowledge" && !asset.module) addError(`${asset.assetId}: Knowledge 文章缺少 module`);
      if (asset.contentSystem === "roadmap" && !asset.roadmap) addError(`${asset.assetId}: Roadmap 文章缺少 roadmap`);
    }
    if (asset.language === "en") {
      if (!asset.path.startsWith("/en/blog/")) addError(`${asset.assetId}: 英文文章路径必须位于 /en/blog/`);
      if (!asset.languagePairPath?.startsWith("/blog/")) addError(`${asset.assetId}: 英文文章缺少中文 languagePairPath`);
      const pair = asset.languagePairAssetId ? master.resolveId(asset.languagePairAssetId) : null;
      if (!pair || pair.language !== "zh-CN" || pair.assetType !== "article") addError(`${asset.assetId}: 英文文章缺少有效中文 languagePairAssetId`);
      else if (pair.path !== asset.languagePairPath) addError(`${asset.assetId}: languagePairPath 与中文 Asset 不一致`);
    }
  }
}

const generatedArticleCount = countGeneratedArticles();
const sourceArticleCount = countSourceMetadataArticles();
const zhArticles = assets.filter((asset) => asset.assetType === "article" && asset.language === "zh-CN");
const enArticles = assets.filter((asset) => asset.assetType === "article" && asset.language === "en");
if (generatedArticleCount !== sourceArticleCount) addError(`generated registries 已过期：generated=${generatedArticleCount}，metadata sources=${sourceArticleCount}。请先运行 knowledgegenerate 与 roadmapgenerate`);
if (zhArticles.length !== generatedArticleCount) addError(`中文文章资产数量不一致：Asset Master=${zhArticles.length}，generated registries=${generatedArticleCount}`);

const extensions = loadSiteAssetExtensions(root, zhArticles);
if (enArticles.length !== extensions.englishArticles.length) addError(`英文文章资产数量不一致：Asset Master=${enArticles.length}，English registry=${extensions.englishArticles.length}`);

const errorSourceCount = extractErrorCodeRecords(fs.readFileSync(path.join(root, "src", "lib", "screeps-errors.ts"), "utf8")).length;
const errorAssetCount = assets.filter((asset) => asset.assetType === "error-code").length;
if (errorAssetCount !== errorSourceCount) addError(`Error fragment 数量不一致：Asset Master=${errorAssetCount}，registry=${errorSourceCount}`);

const glossarySourceCount = extractGlossaryRecords(fs.readFileSync(path.join(root, "src", "lib", "screeps-glossary.ts"), "utf8")).length;
const glossaryAssetCount = assets.filter((asset) => asset.assetType === "glossary-term").length;
if (glossaryAssetCount !== glossarySourceCount) addError(`Glossary fragment 数量不一致：Asset Master=${glossaryAssetCount}，registry=${glossarySourceCount}`);

for (const asset of assets.filter((item) => item.assetType === "error-code")) {
  if (asset.routeKind !== "fragment" || asset.canonicalPath !== "/screeps-errors") addError(`${asset.assetId}: Error Code 必须是 /screeps-errors 下的 fragment`);
}
for (const asset of assets.filter((item) => item.assetType === "glossary-term")) {
  if (asset.routeKind !== "fragment" || asset.canonicalPath !== "/glossary") addError(`${asset.assetId}: Glossary Term 必须是 /glossary 下的 fragment`);
}

const knowledgeModuleCount = assets.filter((asset) => asset.assetType === "knowledge-module").length;
const sourceKnowledgeModuleCount = new Set(zhArticles.filter((asset) => asset.contentSystem === "knowledge").map((asset) => asset.module)).size;
if (knowledgeModuleCount !== sourceKnowledgeModuleCount) addError(`Knowledge Module 资产数量不一致：Asset Master=${knowledgeModuleCount}，中文文章引用=${sourceKnowledgeModuleCount}`);

const requiredPageAssets = [
  ["/", "zh-CN", "site-home"],
  ["/blog", "zh-CN", "article-library-hub"],
  ["/en", "en", "site-home"],
  ["/en/blog", "en", "article-library-hub"],
  ["/en/beginner", "en", "roadmap-hub"],
  ["/en/knowledge", "en", "knowledge-hub"],
  ["/en/tools", "en", "tools-hub"],
  ["/en/diagnostics", "en", "diagnostics-hub"],
  ["/en/screeps-api", "en", "api-hub-index"],
  ["/en/screeps-errors", "en", "errors-hub"],
  ["/en/glossary", "en", "glossary-hub"],
  ["/en/verification", "en", "verification-hub"],
];
for (const [href, language, assetType] of requiredPageAssets) {
  const matches = master.resolvePath(href);
  if (matches.length !== 1) addError(`${href}: expected exactly one Site Asset Master page, got ${matches.length}`);
  else if (matches[0].language !== language || matches[0].assetType !== assetType) {
    addError(`${href}: expected ${language}/${assetType}, got ${matches[0].language}/${matches[0].assetType}`);
  }
}

const zhTools = assets.filter((asset) => asset.assetType === "tool" && asset.language === "zh-CN");
const enTools = assets.filter((asset) => asset.assetType === "tool" && asset.language === "en");
if (zhTools.length === 0) addError("未读取到中文 tool 资产");
if (enTools.length !== zhTools.length) addError(`英文 Tool 资产数量不一致：English=${enTools.length}，Chinese=${zhTools.length}`);
for (const zhTool of zhTools) {
  const englishPath = `/en/tools/${zhTool.slug}`;
  const matches = master.resolvePath(englishPath);
  if (matches.length !== 1 || matches[0].language !== "en" || matches[0].assetType !== "tool") {
    addError(`${englishPath}: 缺少对应英文 Tool asset`);
  }
}

for (const type of ["tool", "diagnostic", "api-hub"]) {
  if (!assets.some((asset) => asset.assetType === type)) addError(`未读取到 ${type} 资产`);
}

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
console.log("Site Asset Master V2 validation passed.");
console.log(`Assets: ${assets.length}`);
console.log(`Chinese articles: ${zhArticles.length}/${sourceArticleCount}`);
console.log(`English articles: ${enArticles.length}`);
console.log(`Chinese tools: ${zhTools.length}`);
console.log(`English tools: ${enTools.length}`);
console.log(`Error fragments: ${errorAssetCount}`);
console.log(`Glossary fragments: ${glossaryAssetCount}`);
console.log(`Knowledge modules: ${knowledgeModuleCount}`);
console.log(`Types: ${JSON.stringify(typeCounts)}`);
