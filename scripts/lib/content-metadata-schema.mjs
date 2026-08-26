import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

export const CONTENT_METADATA_SCHEMA_VERSION = 1;
export const DEFAULT_CONTENT_LOCALE = "zh-CN";
export const DIFFICULTY_VALUES = new Set(["beginner", "intermediate", "advanced"]);
export const KEYWORD_ROLE_VALUES = new Set(["owner", "supporting"]);

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const knowledgeKeys = new Set(["module", "stage", "order", "difficulty"]);
const roadmapKeys = new Set(["id", "stage", "order", "difficulty"]);
const seoKeys = new Set(["primaryKeyword", "searchIntent", "keywordRole"]);
const verificationKeys = new Set([
  "docsChecked",
  "syntaxChecked",
  "consoleTested",
  "liveTested",
  "checkedAt",
  "testedAt",
  "testEnvironment",
  "testResult",
]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function addUnknownKeyErrors(value, allowedKeys, context, errors) {
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) errors.push(`${context}: Metadata Schema V1 不允许字段 ${key}`);
  }
}

function requireNonEmptyString(value, field, context, errors) {
  if (typeof value !== "string" || value.trim() === "") errors.push(`${context}: ${field} 必须是非空字符串`);
}

function validateDateString(value, field, context, errors, { optional = false } = {}) {
  if ((value === undefined || value === null || value === "") && optional) return;
  if (typeof value !== "string" || !datePattern.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    errors.push(`${context}: ${field} 必须使用有效 YYYY-MM-DD 日期`);
  }
}

export function validateSeoMetadataV1(seo, context, errors) {
  if (!isRecord(seo)) {
    errors.push(`${context}: seo 必须是对象`);
    return;
  }
  addUnknownKeyErrors(seo, seoKeys, `${context}.seo`, errors);
  requireNonEmptyString(seo.primaryKeyword, "seo.primaryKeyword", context, errors);
  requireNonEmptyString(seo.searchIntent, "seo.searchIntent", context, errors);
  if (!KEYWORD_ROLE_VALUES.has(seo.keywordRole)) errors.push(`${context}: seo.keywordRole 必须是 owner 或 supporting`);
}

export function validateKnowledgeMetadataV1(knowledge, context, errors) {
  if (!isRecord(knowledge)) {
    errors.push(`${context}: knowledge 必须是对象`);
    return;
  }
  addUnknownKeyErrors(knowledge, knowledgeKeys, `${context}.knowledge`, errors);
  if (typeof knowledge.module !== "string" || !slugPattern.test(knowledge.module)) errors.push(`${context}: knowledge.module 必须是稳定 slug`);
  if (typeof knowledge.stage !== "string" || !slugPattern.test(knowledge.stage)) errors.push(`${context}: knowledge.stage 必须是稳定 slug`);
  if (!Number.isInteger(knowledge.order) || knowledge.order <= 0) errors.push(`${context}: knowledge.order 必须是正整数`);
  if (!DIFFICULTY_VALUES.has(knowledge.difficulty)) errors.push(`${context}: knowledge.difficulty 无效`);
}

export function validateRoadmapMetadataV1(roadmap, context, errors) {
  if (!isRecord(roadmap)) {
    errors.push(`${context}: roadmap 必须是对象`);
    return;
  }
  addUnknownKeyErrors(roadmap, roadmapKeys, `${context}.roadmap`, errors);
  if (typeof roadmap.id !== "string" || !slugPattern.test(roadmap.id)) errors.push(`${context}: roadmap.id 必须是稳定 slug`);
  if (typeof roadmap.stage !== "string" || !slugPattern.test(roadmap.stage)) errors.push(`${context}: roadmap.stage 必须是稳定 slug`);
  if (!Number.isInteger(roadmap.order) || roadmap.order <= 0) errors.push(`${context}: roadmap.order 必须是正整数`);
  if (!DIFFICULTY_VALUES.has(roadmap.difficulty)) errors.push(`${context}: roadmap.difficulty 无效`);
}

export function validateVerificationMetadataV1(verification, context, errors) {
  if (!isRecord(verification)) {
    errors.push(`${context}: verification 必须是对象`);
    return;
  }
  addUnknownKeyErrors(verification, verificationKeys, `${context}.verification`, errors);
  for (const field of ["docsChecked", "syntaxChecked", "consoleTested", "liveTested"]) {
    if (typeof verification[field] !== "boolean") errors.push(`${context}: verification.${field} 必须是布尔值`);
  }
  validateDateString(verification.checkedAt, "verification.checkedAt", context, errors);

  const hasRuntimeEvidence = verification.consoleTested === true || verification.liveTested === true;
  const hasAnyTestEvidence = Boolean(verification.testedAt || verification.testEnvironment || verification.testResult);
  if (hasRuntimeEvidence || hasAnyTestEvidence) {
    validateDateString(verification.testedAt, "verification.testedAt", context, errors);
    requireNonEmptyString(verification.testEnvironment, "verification.testEnvironment", context, errors);
    requireNonEmptyString(verification.testResult, "verification.testResult", context, errors);
  }

  const environment = String(verification.testEnvironment ?? "");
  if (hasRuntimeEvidence && /离线模拟|不是\s*Screeps\s*官方服务器/i.test(environment)) {
    errors.push(`${context}: 已标记 Console/Live 验证时 testEnvironment 不能仍声明离线模拟`);
  }
  if (!hasRuntimeEvidence && hasAnyTestEvidence) {
    if (!environment.includes("离线模拟") || !/不是\s*Screeps\s*官方服务器/i.test(environment)) {
      errors.push(`${context}: 未标记运行验证时 testEnvironment 必须明确“离线模拟”且“不是 Screeps 官方服务器”`);
    }
  }
}

function validateArticleFrontmatterV1(data, context, errors) {
  for (const field of ["title", "description", "publishedAt", "category"]) requireNonEmptyString(data[field], field, context, errors);
  validateDateString(data.publishedAt, "publishedAt", context, errors);
  validateDateString(data.updatedAt, "updatedAt", context, errors, { optional: true });
  if (typeof data.updatedAt === "string" && typeof data.publishedAt === "string" && datePattern.test(data.updatedAt) && datePattern.test(data.publishedAt)) {
    if (Date.parse(`${data.updatedAt}T00:00:00Z`) < Date.parse(`${data.publishedAt}T00:00:00Z`)) errors.push(`${context}: updatedAt 不能早于 publishedAt`);
  }

  if (!Array.isArray(data.tags) || data.tags.length < 3 || data.tags.length > 5) {
    errors.push(`${context}: tags 必须包含 3 至 5 个标签`);
  } else if (data.tags.some((tag) => typeof tag !== "string" || tag.trim() === "")) {
    errors.push(`${context}: tags 必须全部是非空字符串`);
  }

  if (data.draft !== undefined && typeof data.draft !== "boolean") errors.push(`${context}: draft 若声明必须是布尔值`);
  if (data.featured !== undefined && typeof data.featured !== "boolean") errors.push(`${context}: featured 若声明必须是布尔值`);
  if (data.locale !== undefined && data.locale !== DEFAULT_CONTENT_LOCALE) errors.push(`${context}: content/posts V1 的 locale 若声明必须是 ${DEFAULT_CONTENT_LOCALE}`);
  validateVerificationMetadataV1(data.verification, context, errors);
}

function readJson(filePath, errors) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!isRecord(parsed)) errors.push(`${filePath}: metadata sidecar 必须是对象`);
    return parsed;
  } catch (error) {
    errors.push(`${filePath}: JSON 解析失败：${String(error)}`);
    return null;
  }
}

export function validateContentMetadataSchemaV1(root = process.cwd()) {
  const errors = [];
  const warnings = [];
  const postsDirectory = path.join(root, "content", "posts");
  const knowledgeMetadataDirectory = path.join(root, "content", "knowledge-metadata");
  const roadmapMetadataDirectory = path.join(root, "content", "roadmap-metadata");

  if (!fs.existsSync(postsDirectory)) return { errors: [`${postsDirectory}: posts directory 不存在`], warnings, publishedCount: 0, knowledgeCount: 0, roadmapCount: 0 };

  let publishedCount = 0;
  let knowledgeCount = 0;
  let roadmapCount = 0;

  for (const fileName of fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".md")).sort()) {
    const slug = fileName.replace(/\.md$/, "");
    const filePath = path.join(postsDirectory, fileName);
    const { data } = matter(fs.readFileSync(filePath, "utf8"));
    const context = `content/posts/${fileName}`;
    const published = data.draft !== true;
    if (published) publishedCount += 1;

    validateArticleFrontmatterV1(data, context, errors);

    const knowledgeSidecarPath = path.join(knowledgeMetadataDirectory, `${slug}.json`);
    const roadmapSidecarPath = path.join(roadmapMetadataDirectory, `${slug}.json`);
    const hasKnowledgeSidecar = fs.existsSync(knowledgeSidecarPath);
    const hasRoadmapSidecar = fs.existsSync(roadmapSidecarPath);
    const inlineKnowledge = data.knowledge !== undefined;
    const inlineRoadmap = data.roadmap !== undefined;
    const inlineSeo = data.seo !== undefined;

    if (hasKnowledgeSidecar && hasRoadmapSidecar) errors.push(`${context}: 同一文章不能同时拥有 Knowledge 与 Roadmap sidecar`);
    if (inlineKnowledge && inlineRoadmap) errors.push(`${context}: frontmatter 不能同时声明 knowledge 与 roadmap`);
    if (hasKnowledgeSidecar && (inlineKnowledge || inlineSeo)) errors.push(`${context}: Knowledge sidecar 存在时不得同时声明 frontmatter knowledge/seo`);
    if (hasRoadmapSidecar && (inlineRoadmap || inlineSeo)) errors.push(`${context}: Roadmap sidecar 存在时不得同时声明 frontmatter roadmap/seo`);

    let classificationCount = 0;
    if (hasKnowledgeSidecar) {
      classificationCount += 1;
      knowledgeCount += 1;
      const source = readJson(knowledgeSidecarPath, errors);
      if (source) {
        validateKnowledgeMetadataV1(source.knowledge, `content/knowledge-metadata/${slug}.json`, errors);
        validateSeoMetadataV1(source.seo, `content/knowledge-metadata/${slug}.json`, errors);
        for (const key of Object.keys(source)) if (!["knowledge", "seo"].includes(key)) errors.push(`content/knowledge-metadata/${slug}.json: V1 sidecar 不允许顶层字段 ${key}`);
      }
    } else if (inlineKnowledge) {
      classificationCount += 1;
      knowledgeCount += 1;
      validateKnowledgeMetadataV1(data.knowledge, context, errors);
      validateSeoMetadataV1(data.seo, context, errors);
    }

    if (hasRoadmapSidecar) {
      classificationCount += 1;
      roadmapCount += 1;
      const source = readJson(roadmapSidecarPath, errors);
      if (source) {
        validateRoadmapMetadataV1(source.roadmap, `content/roadmap-metadata/${slug}.json`, errors);
        validateSeoMetadataV1(source.seo, `content/roadmap-metadata/${slug}.json`, errors);
        for (const key of Object.keys(source)) if (!["roadmap", "seo"].includes(key)) errors.push(`content/roadmap-metadata/${slug}.json: V1 sidecar 不允许顶层字段 ${key}`);
      }
    } else if (inlineRoadmap) {
      classificationCount += 1;
      roadmapCount += 1;
      validateRoadmapMetadataV1(data.roadmap, context, errors);
      validateSeoMetadataV1(data.seo, context, errors);
    }

    if (inlineSeo && !inlineKnowledge && !inlineRoadmap && !hasKnowledgeSidecar && !hasRoadmapSidecar) errors.push(`${context}: seo 不能脱离 knowledge/roadmap 单独声明`);
    if (published && classificationCount !== 1) errors.push(`${context}: 已发布文章必须且只能属于一个 Knowledge Module 或 Beginner Roadmap`);
  }

  for (const [directory, label] of [[knowledgeMetadataDirectory, "Knowledge"], [roadmapMetadataDirectory, "Roadmap"]]) {
    if (!fs.existsSync(directory)) continue;
    for (const fileName of fs.readdirSync(directory).filter((name) => name.endsWith(".json"))) {
      const slug = fileName.replace(/\.json$/, "");
      if (!fs.existsSync(path.join(postsDirectory, `${slug}.md`))) errors.push(`${path.join("content", path.basename(directory), fileName)}: ${label} sidecar 没有对应文章`);
    }
  }

  return { errors, warnings, publishedCount, knowledgeCount, roadmapCount };
}

export function assertContentMetadataSchemaV1(root = process.cwd()) {
  const result = validateContentMetadataSchemaV1(root);
  if (result.errors.length > 0) {
    const detail = result.errors.map((error) => `- ${error}`).join("\n");
    throw new Error(`Content Metadata Schema V1 validation failed (${result.errors.length} issue(s)):\n${detail}`);
  }
  return result;
}
