export const knowledgeDifficultyValues = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export type KnowledgeDifficulty = (typeof knowledgeDifficultyValues)[number];

export const knowledgeKeywordRoleValues = ["owner", "supporting"] as const;

export type KnowledgeKeywordRole = (typeof knowledgeKeywordRoleValues)[number];

export interface KnowledgeArticleKnowledgeMetadata {
  module: string;
  stage: string;
  order: number;
  difficulty: KnowledgeDifficulty;
}

export interface KnowledgeArticleSeoMetadata {
  primaryKeyword: string;
  searchIntent: string;
  keywordRole: KnowledgeKeywordRole;
}

export interface KnowledgeArticleMetadataBlocks {
  knowledge?: KnowledgeArticleKnowledgeMetadata;
  seo?: KnowledgeArticleSeoMetadata;
}

const slugLikePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertNonEmptyString(
  value: unknown,
  field: string,
  filePath: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${filePath}: ${field} 必须是非空字符串`);
  }
}

function parseKnowledgeBlock(
  value: unknown,
  filePath: string,
): KnowledgeArticleKnowledgeMetadata {
  if (!isRecord(value)) {
    throw new Error(`${filePath}: frontmatter.knowledge 必须是对象`);
  }

  assertNonEmptyString(value.module, "knowledge.module", filePath);
  assertNonEmptyString(value.stage, "knowledge.stage", filePath);

  if (!slugLikePattern.test(value.module)) {
    throw new Error(`${filePath}: knowledge.module 必须使用小写 slug`);
  }
  if (!slugLikePattern.test(value.stage)) {
    throw new Error(`${filePath}: knowledge.stage 必须使用小写 slug`);
  }
  if (!Number.isInteger(value.order) || Number(value.order) <= 0) {
    throw new Error(`${filePath}: knowledge.order 必须是正整数`);
  }
  if (
    typeof value.difficulty !== "string" ||
    !knowledgeDifficultyValues.includes(value.difficulty as KnowledgeDifficulty)
  ) {
    throw new Error(
      `${filePath}: knowledge.difficulty 必须是 ${knowledgeDifficultyValues.join(", ")}`,
    );
  }

  return {
    module: value.module,
    stage: value.stage,
    order: Number(value.order),
    difficulty: value.difficulty as KnowledgeDifficulty,
  };
}

function parseSeoBlock(
  value: unknown,
  filePath: string,
): KnowledgeArticleSeoMetadata {
  if (!isRecord(value)) {
    throw new Error(`${filePath}: frontmatter.seo 必须是对象`);
  }

  assertNonEmptyString(value.primaryKeyword, "seo.primaryKeyword", filePath);
  assertNonEmptyString(value.searchIntent, "seo.searchIntent", filePath);

  if (
    typeof value.keywordRole !== "string" ||
    !knowledgeKeywordRoleValues.includes(value.keywordRole as KnowledgeKeywordRole)
  ) {
    throw new Error(
      `${filePath}: seo.keywordRole 必须是 ${knowledgeKeywordRoleValues.join(", ")}`,
    );
  }

  return {
    primaryKeyword: value.primaryKeyword.trim(),
    searchIntent: value.searchIntent.trim(),
    keywordRole: value.keywordRole as KnowledgeKeywordRole,
  };
}

export function parseKnowledgeArticleMetadata(
  data: Record<string, unknown>,
  filePath: string,
): KnowledgeArticleMetadataBlocks {
  const hasKnowledge = data.knowledge !== undefined;
  const hasSeo = data.seo !== undefined;

  if (!hasKnowledge && !hasSeo) return {};

  if (hasKnowledge !== hasSeo) {
    throw new Error(
      `${filePath}: knowledge 与 seo 必须同时声明，避免只迁移一半的文章身份`,
    );
  }

  return {
    knowledge: parseKnowledgeBlock(data.knowledge, filePath),
    seo: parseSeoBlock(data.seo, filePath),
  };
}
