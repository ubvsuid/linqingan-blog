import { getKnowledgeArticlesForModule } from "@/lib/knowledge-article-registry";
import {
  knowledgeModuleRegistry,
  type KnowledgeModuleConfig,
  type KnowledgeModuleStageConfig,
} from "@/lib/knowledge-module-registry";

export interface KnowledgeBaseStage {
  id: string;
  title: string;
  description: string;
  from: number;
  to: number;
}

export interface KnowledgeBaseSection {
  id: string;
  number: number;
  title: string;
  description: string;
  audience: string;
  learningGoal: string;
  stages: readonly KnowledgeBaseStage[];
  slugs: readonly string[];
}

function stageIdentity(stage: KnowledgeModuleStageConfig) {
  return {
    id: stage.id,
    title: stage.title,
    description: stage.description,
  };
}

function buildLegacySection(config: KnowledgeModuleConfig): KnowledgeBaseSection {
  const slugs = [...(config.legacySlugs ?? [])];
  if (slugs.length === 0) {
    throw new Error(`${config.id}: legacy Knowledge module 缺少 legacySlugs`);
  }

  const stages = config.stages.map((stage): KnowledgeBaseStage => {
    if (
      !Number.isInteger(stage.legacyFrom) ||
      !Number.isInteger(stage.legacyTo) ||
      Number(stage.legacyFrom) < 0 ||
      Number(stage.legacyTo) <= Number(stage.legacyFrom) ||
      Number(stage.legacyTo) > slugs.length
    ) {
      throw new Error(`${config.id}/${stage.id}: legacy stage range 无效`);
    }

    return {
      ...stageIdentity(stage),
      from: Number(stage.legacyFrom),
      to: Number(stage.legacyTo),
    };
  });

  for (let index = 0; index < stages.length; index += 1) {
    const previousTo = index === 0 ? 0 : stages[index - 1].to;
    if (stages[index].from !== previousTo) {
      throw new Error(`${config.id}/${stages[index].id}: legacy stage range 必须连续`);
    }
  }

  if (stages.at(-1)?.to !== slugs.length) {
    throw new Error(`${config.id}: legacy stage range 没有覆盖全部文章`);
  }

  return {
    id: config.id,
    number: config.number,
    title: config.title,
    description: config.description,
    audience: config.audience,
    learningGoal: config.learningGoal,
    stages,
    slugs,
  };
}

function buildMetadataSection(config: KnowledgeModuleConfig): KnowledgeBaseSection {
  const records = getKnowledgeArticlesForModule(config.id);
  if (records.length === 0) {
    throw new Error(`${config.id}: metadata Knowledge module 没有已发布文章`);
  }

  const knownStageIds = new Set(config.stages.map((stage) => stage.id));
  const unknownStages = records
    .filter((record) => !knownStageIds.has(record.knowledge.stage))
    .map((record) => `${record.slug}:${record.knowledge.stage}`);

  if (unknownStages.length > 0) {
    throw new Error(
      `${config.id}: 文章使用了未定义的 Knowledge stage：${unknownStages.join(", ")}`,
    );
  }

  const orderOwners = new Map<number, string>();
  for (const record of records) {
    const previous = orderOwners.get(record.knowledge.order);
    if (previous) {
      throw new Error(
        `${config.id}: knowledge.order ${record.knowledge.order} 同时被 ${previous} 与 ${record.slug} 使用`,
      );
    }
    orderOwners.set(record.knowledge.order, record.slug);
  }

  const slugs: string[] = [];
  let cursor = 0;
  const stages = config.stages.map((stage): KnowledgeBaseStage => {
    const stageRecords = records
      .filter((record) => record.knowledge.stage === stage.id)
      .sort(
        (left, right) =>
          left.knowledge.order - right.knowledge.order ||
          left.slug.localeCompare(right.slug),
      );
    const from = cursor;

    slugs.push(...stageRecords.map((record) => record.slug));
    cursor = slugs.length;

    return {
      ...stageIdentity(stage),
      from,
      to: cursor,
    };
  });

  if (slugs.length !== records.length) {
    throw new Error(`${config.id}: Knowledge metadata 归档后文章数量不一致`);
  }

  return {
    id: config.id,
    number: config.number,
    title: config.title,
    description: config.description,
    audience: config.audience,
    learningGoal: config.learningGoal,
    stages,
    slugs,
  };
}

function buildKnowledgeBaseSection(config: KnowledgeModuleConfig): KnowledgeBaseSection {
  return config.articleSource === "metadata"
    ? buildMetadataSection(config)
    : buildLegacySection(config);
}

export const knowledgeBaseSections: readonly KnowledgeBaseSection[] =
  knowledgeModuleRegistry.map(buildKnowledgeBaseSection);

export const knowledgeBaseSlugs = knowledgeBaseSections.flatMap((section) => [
  ...section.slugs,
]);

export function getKnowledgeBaseSection(id: string): KnowledgeBaseSection | null {
  return knowledgeBaseSections.find((section) => section.id === id) ?? null;
}

export function getKnowledgeBaseSectionBySlug(slug: string): KnowledgeBaseSection | null {
  return knowledgeBaseSections.find((section) => section.slugs.includes(slug)) ?? null;
}

export function getKnowledgeBaseSectionId(slug: string): string | null {
  return getKnowledgeBaseSectionBySlug(slug)?.id ?? null;
}

export function getKnowledgeBasePostPosition(slug: string): {
  section: KnowledgeBaseSection;
  index: number;
  previousSlug: string | null;
  nextSlug: string | null;
} | null {
  const section = getKnowledgeBaseSectionBySlug(slug);
  if (!section) return null;

  const index = section.slugs.indexOf(slug);
  return {
    section,
    index,
    previousSlug: index > 0 ? section.slugs[index - 1] : null,
    nextSlug: index < section.slugs.length - 1 ? section.slugs[index + 1] : null,
  };
}
