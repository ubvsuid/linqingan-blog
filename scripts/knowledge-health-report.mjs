import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const knowledgePath = path.join(root, "src", "generated", "knowledge-article-registry.json");
const roadmapPath = path.join(root, "src", "generated", "beginner-roadmap-registry.json");
const outputPath = process.env.KNOWLEDGE_HEALTH_OUTPUT || null;
const errors = [];

function normalizeKeyword(value) {
  return String(value).normalize("NFKC").trim().toLowerCase();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const knowledge = readJson(knowledgePath);
const roadmap = readJson(roadmapPath);
const publishedSlugs = [];
for (const fileName of fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".md")).sort()) {
  const slug = fileName.replace(/\.md$/, "");
  const { data } = matter(fs.readFileSync(path.join(postsDirectory, fileName), "utf8"));
  if (data.draft !== true) publishedSlugs.push(slug);
}

const knowledgeSlugs = new Set(knowledge.map((record) => record.slug));
const roadmapSlugs = new Set(roadmap.map((record) => record.slug));
const publishedSet = new Set(publishedSlugs);
const classified = new Set([...knowledgeSlugs, ...roadmapSlugs]);
const duplicateAssignments = [...knowledgeSlugs].filter((slug) => roadmapSlugs.has(slug));
const unclassified = publishedSlugs.filter((slug) => !classified.has(slug));
const registryWithoutPublishedPost = [...classified].filter((slug) => !publishedSet.has(slug));

for (const slug of duplicateAssignments) errors.push(`${slug}: 同时进入 Knowledge 与 Roadmap`);
for (const slug of unclassified) errors.push(`${slug}: 已发布但未归档`);
for (const slug of registryWithoutPublishedPost) errors.push(`${slug}: Registry 中存在但不是已发布文章`);

const owners = new Map();
const duplicateOwners = [];
for (const record of [...knowledge, ...roadmap]) {
  if (record?.seo?.keywordRole !== "owner") continue;
  const key = normalizeKeyword(record.seo.primaryKeyword);
  const previous = owners.get(key);
  if (previous) duplicateOwners.push({ keyword: record.seo.primaryKeyword, first: previous, second: record.slug });
  else owners.set(key, record.slug);
}
for (const conflict of duplicateOwners) {
  errors.push(`Keyword Owner 冲突：${conflict.keyword} → ${conflict.first}, ${conflict.second}`);
}

const modules = {};
for (const record of knowledge) {
  const moduleId = record.knowledge.module;
  const stageId = record.knowledge.stage;
  modules[moduleId] ??= { total: 0, stages: {} };
  modules[moduleId].total += 1;
  modules[moduleId].stages[stageId] = (modules[moduleId].stages[stageId] ?? 0) + 1;
}
const roadmapStages = {};
for (const record of roadmap) {
  const stageId = record.roadmap.stage;
  roadmapStages[stageId] = (roadmapStages[stageId] ?? 0) + 1;
}

const sourceCounts = {};
for (const record of [...knowledge, ...roadmap]) {
  sourceCounts[record.source] = (sourceCounts[record.source] ?? 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  status: errors.length === 0 ? "PASS" : "FAIL",
  totals: {
    publishedArticles: publishedSlugs.length,
    knowledgeArticles: knowledge.length,
    roadmapArticles: roadmap.length,
    classifiedArticles: classified.size,
    ownerKeywords: owners.size,
    duplicateAssignments: duplicateAssignments.length,
    unclassifiedArticles: unclassified.length,
    duplicateOwners: duplicateOwners.length,
  },
  sources: sourceCounts,
  modules,
  roadmap: { id: "beginner", total: roadmap.length, stages: roadmapStages },
  errors,
};

console.log(`Knowledge Health: ${report.status}`);
console.log(`Published: ${report.totals.publishedArticles}`);
console.log(`Knowledge: ${report.totals.knowledgeArticles}`);
console.log(`Beginner Roadmap: ${report.totals.roadmapArticles}`);
console.log(`Classified: ${report.totals.classifiedArticles}/${report.totals.publishedArticles}`);
console.log(`Owner keywords: ${report.totals.ownerKeywords}; conflicts: ${report.totals.duplicateOwners}`);
console.log(`Sources: ${Object.entries(sourceCounts).map(([source, count]) => `${source}=${count}`).join(", ")}`);
for (const [moduleId, module] of Object.entries(modules)) {
  console.log(`${moduleId}: ${module.total} (${Object.entries(module.stages).map(([stage, count]) => `${stage}=${count}`).join(", ")})`);
}
console.log(`beginner: ${roadmap.length} (${Object.entries(roadmapStages).map(([stage, count]) => `${stage}=${count}`).join(", ")})`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    "## Knowledge Health",
    "",
    `**Status:** ${report.status === "PASS" ? "✅ PASS" : "❌ FAIL"}`,
    "",
    "| Metric | Value |",
    "|---|---:|",
    `| Published Chinese articles | ${report.totals.publishedArticles} |`,
    `| Knowledge articles | ${report.totals.knowledgeArticles} |`,
    `| Beginner Roadmap articles | ${report.totals.roadmapArticles} |`,
    `| Classified | ${report.totals.classifiedArticles}/${report.totals.publishedArticles} |`,
    `| Owner keywords | ${report.totals.ownerKeywords} |`,
    `| Owner conflicts | ${report.totals.duplicateOwners} |`,
    `| Duplicate assignments | ${report.totals.duplicateAssignments} |`,
    `| Unclassified articles | ${report.totals.unclassifiedArticles} |`,
    "",
    "### Knowledge modules",
    "",
    "| Module | Articles | Stage distribution |",
    "|---|---:|---|",
    ...Object.entries(modules).map(([moduleId, module]) => `| ${moduleId} | ${module.total} | ${Object.entries(module.stages).map(([stage, count]) => `${stage}: ${count}`).join(" · ")} |`),
    `| beginner-roadmap | ${roadmap.length} | ${Object.entries(roadmapStages).map(([stage, count]) => `${stage}: ${count}`).join(" · ")} |`,
  ];
  if (errors.length > 0) lines.push("", "### Errors", "", ...errors.map((error) => `- ${error}`));
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`, "utf8");
}

if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

if (errors.length > 0) process.exit(1);
