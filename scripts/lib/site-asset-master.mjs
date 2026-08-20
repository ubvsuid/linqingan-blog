import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import { loadContentAssetIndex } from "./content-asset-index.mjs";
import { loadSiteAssetExtensions } from "./site-asset-extensions.mjs";

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function readText(filePath) { return fs.readFileSync(filePath, "utf8"); }
function articleTitle(root, slug) {
  const postPath = path.join(root, "content", "posts", `${slug}.md`);
  if (!fs.existsSync(postPath)) return slug;
  const { data } = matter(readText(postPath));
  return typeof data.title === "string" && data.title.trim() ? data.title.trim() : slug;
}
function titleFromSlug(value) { return String(value).split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function extractToolCatalog(root) {
  const source = readText(path.join(root, "src", "lib", "tool-catalog.ts"));
  const records = [];
  const pattern = /\n\s*slug:\s*"([^"]+)"[\s\S]*?\n\s*zhTitle:\s*"([^"]+)"[\s\S]*?\n\s*zhDescription:\s*"([^"]+)"/g;
  for (const match of source.matchAll(pattern)) records.push({ slug: match[1], title: match[2], description: match[3] });
  return records;
}
function extractDiagnosticSymptoms(root) {
  const source = readText(path.join(root, "src", "lib", "screeps-diagnostic-symptoms.ts"));
  const records = [];
  const pattern = /\n\s*id:\s*"([^"]+)"[\s\S]*?\n\s*zhTitle:\s*"([^"]+)"[\s\S]*?\n\s*enTitle:\s*"([^"]+)"/g;
  for (const match of source.matchAll(pattern)) records.push({ id: match[1], title: match[2], enTitle: match[3] });
  return records;
}
function extractApiHubs(root) {
  const source = readText(path.join(root, "src", "lib", "screeps-api-hubs.ts"));
  const records = [];
  const pattern = /\n\s*slug:\s*"([^"]+)"[\s\S]*?\n\s*objectName:\s*"([^"]+)"[\s\S]*?\n\s*zhTitle:\s*"([^"]+)"/g;
  for (const match of source.matchAll(pattern)) records.push({ slug: match[1], objectName: match[2], title: match[3] });
  return records;
}
function emptyDecisionState() { return { health: { content: "not-scored", evidence: "not-scored", indexation: "not-scored" }, opportunity: { priority: null, reasons: [] } }; }
function withDecisionHooks(asset) { return { ...asset, joinKeys: { path: asset.path, ownerKeyword: asset.primaryKeyword ?? null }, decision: emptyDecisionState() }; }
function pageAsset({ id, type, path: href, title, system, parentPath = "/", sourceOfTruth, module = null, order = null }) {
  return withDecisionHooks({ assetId: `zh-CN:${type}:${id}`, assetType: type, language: "zh-CN", path: href, canonicalPath: href, routeKind: "page", title, contentSystem: system, module, roadmap: null, stage: null, order, difficulty: null, primaryKeyword: null, keywordRole: null, searchIntent: null, metadataSource: sourceOfTruth, sourceOfTruth, parentPath });
}

export function buildSiteAssetMaster(root = process.cwd()) {
  const contentIndex = loadContentAssetIndex(root);
  const knowledgeRegistry = readJson(path.join(root, "src", "generated", "knowledge-article-registry.json"));
  const roadmapRegistry = readJson(path.join(root, "src", "generated", "beginner-roadmap-registry.json"));
  const knowledgeBySlug = new Map(knowledgeRegistry.map((record) => [record.slug, record]));
  const roadmapBySlug = new Map(roadmapRegistry.map((record) => [record.slug, record]));

  const articleAssets = contentIndex.assets.map((asset) => {
    const knowledgeRecord = knowledgeBySlug.get(asset.slug), roadmapRecord = roadmapBySlug.get(asset.slug), isKnowledge = asset.system === "knowledge";
    const order = isKnowledge ? knowledgeRecord?.knowledge?.order ?? null : roadmapRecord?.roadmap?.order ?? null;
    return withDecisionHooks({
      assetId: `zh-CN:article:${asset.slug}`, assetType: "article", language: "zh-CN", path: asset.href, canonicalPath: asset.href,
      routeKind: "page", slug: asset.slug, title: articleTitle(root, asset.slug), contentSystem: asset.system,
      module: isKnowledge ? asset.module : null, roadmap: isKnowledge ? null : asset.module, stage: asset.stage || null, order,
      difficulty: asset.difficulty || null, primaryKeyword: asset.ownerKeyword || null, keywordRole: asset.keywordRole || null,
      searchIntent: asset.searchIntent || null, metadataSource: asset.metadataSource || null,
      sourceOfTruth: asset.metadataSource || "generated-registry", parentPath: isKnowledge ? `/knowledge/${asset.module}` : "/beginner",
    });
  });

  const knowledgeModules = [...new Set(articleAssets.filter((asset) => asset.contentSystem === "knowledge" && asset.module).map((asset) => asset.module))];
  const knowledgeModuleAssets = knowledgeModules.map((module, index) => pageAsset({ id: module, type: "knowledge-module", path: `/knowledge/${module}`, title: titleFromSlug(module), system: "knowledge", parentPath: "/knowledge", sourceOfTruth: "generated-knowledge-registry", module, order: (index + 1) * 10 }));
  const hubAssets = [
    pageAsset({ id: "beginner", type: "roadmap-hub", path: "/beginner", title: "Screeps Beginner Roadmap", system: "roadmap", sourceOfTruth: "route" }),
    pageAsset({ id: "knowledge", type: "knowledge-hub", path: "/knowledge", title: "Screeps Knowledge", system: "knowledge", sourceOfTruth: "route" }),
    pageAsset({ id: "tools", type: "tools-hub", path: "/tools", title: "Screeps Tools", system: "utility", sourceOfTruth: "route" }),
    pageAsset({ id: "diagnostics", type: "diagnostics-hub", path: "/diagnostics", title: "Screeps 故障诊断中心", system: "diagnostics", sourceOfTruth: "route" }),
    pageAsset({ id: "screeps-api", type: "api-hub-index", path: "/screeps-api", title: "Screeps API", system: "reference", sourceOfTruth: "route" }),
    pageAsset({ id: "screeps-errors", type: "errors-hub", path: "/screeps-errors", title: "Screeps Errors", system: "reference", sourceOfTruth: "route" }),
    pageAsset({ id: "glossary", type: "glossary-hub", path: "/glossary", title: "Screeps Glossary", system: "reference", sourceOfTruth: "route" }),
    pageAsset({ id: "verification", type: "verification-hub", path: "/verification", title: "Runtime Verification", system: "evidence", sourceOfTruth: "route" }),
  ];
  const toolAssets = extractToolCatalog(root).map((tool, index) => withDecisionHooks({ assetId: `zh-CN:tool:${tool.slug}`, assetType: "tool", language: "zh-CN", path: `/tools/${tool.slug}`, canonicalPath: `/tools/${tool.slug}`, routeKind: "page", slug: tool.slug, title: tool.title, description: tool.description, contentSystem: "utility", module: null, roadmap: null, stage: null, order: (index + 1) * 10, difficulty: null, primaryKeyword: null, keywordRole: null, searchIntent: null, metadataSource: "tool-catalog", sourceOfTruth: "src/lib/tool-catalog.ts", parentPath: "/tools" }));
  const diagnosticAssets = extractDiagnosticSymptoms(root).map((symptom, index) => withDecisionHooks({ assetId: `zh-CN:diagnostic:${symptom.id}`, assetType: "diagnostic", language: "zh-CN", path: `/diagnostics#${symptom.id}`, canonicalPath: "/diagnostics", routeKind: "fragment", slug: symptom.id, title: symptom.title, contentSystem: "diagnostics", module: null, roadmap: null, stage: null, order: (index + 1) * 10, difficulty: null, primaryKeyword: null, keywordRole: null, searchIntent: null, metadataSource: "diagnostic-registry", sourceOfTruth: "src/lib/screeps-diagnostic-symptoms.ts", parentPath: "/diagnostics" }));
  const apiHubAssets = extractApiHubs(root).map((hub, index) => withDecisionHooks({ assetId: `zh-CN:api-hub:${hub.slug}`, assetType: "api-hub", language: "zh-CN", path: `/screeps-api/${hub.slug}`, canonicalPath: `/screeps-api/${hub.slug}`, routeKind: "page", slug: hub.slug, title: hub.title, contentSystem: "reference", module: hub.objectName, roadmap: null, stage: null, order: (index + 1) * 10, difficulty: null, primaryKeyword: null, keywordRole: null, searchIntent: null, metadataSource: "api-hub-registry", sourceOfTruth: "src/lib/screeps-api-hubs.ts", parentPath: "/screeps-api" }));

  const extensions = loadSiteAssetExtensions(root, articleAssets);
  const assets = [...articleAssets, ...extensions.englishArticles.map(withDecisionHooks), ...knowledgeModuleAssets, ...hubAssets, ...toolAssets, ...diagnosticAssets, ...apiHubAssets, ...extensions.errorCodes.map(withDecisionHooks), ...extensions.glossary.map(withDecisionHooks)];
  const byId = new Map(assets.map((asset) => [asset.assetId, asset]));
  const byPath = new Map();
  for (const asset of assets) { const records = byPath.get(asset.path) ?? []; records.push(asset); byPath.set(asset.path, records); }

  return {
    schemaVersion: 2,
    generatedFrom: ["src/generated/knowledge-article-registry.json", "src/generated/beginner-roadmap-registry.json", "content/posts/*.md", "src/lib/english-articles-complete.ts", "src/lib/english-*-registry-*.ts", "src/lib/screeps-errors.ts", "src/lib/screeps-glossary.ts", "src/lib/tool-catalog.ts", "src/lib/screeps-diagnostic-symptoms.ts", "src/lib/screeps-api-hubs.ts", "canonical application routes"],
    coverage: { englishArticles: extensions.englishArticles.length, errorCodes: extensions.errorCodes.length, glossaryTerms: extensions.glossary.length },
    assets,
    resolveId(assetId) { return byId.get(assetId) ?? null; },
    resolvePath(value) { return byPath.get(value) ?? []; },
  };
}
