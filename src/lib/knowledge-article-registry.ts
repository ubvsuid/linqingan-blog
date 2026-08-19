import generatedKnowledgeArticleRegistry from "@/generated/knowledge-article-registry.json";
import type {
  KnowledgeArticleKnowledgeMetadata,
  KnowledgeArticleSeoMetadata,
} from "@/lib/knowledge-metadata";

export interface KnowledgeArticleRegistryRecord {
  slug: string;
  knowledge: KnowledgeArticleKnowledgeMetadata;
  seo: KnowledgeArticleSeoMetadata;
  source: "frontmatter" | "migration-sidecar";
}

const knowledgeArticleRegistry =
  generatedKnowledgeArticleRegistry as readonly KnowledgeArticleRegistryRecord[];

export function getKnowledgeArticleRegistry(): readonly KnowledgeArticleRegistryRecord[] {
  return knowledgeArticleRegistry;
}

export function getKnowledgeArticleMetadata(
  slug: string,
): KnowledgeArticleRegistryRecord | null {
  return knowledgeArticleRegistry.find((record) => record.slug === slug) ?? null;
}

export function getKnowledgeArticlesForModule(
  moduleId: string,
): readonly KnowledgeArticleRegistryRecord[] {
  return knowledgeArticleRegistry
    .filter((record) => record.knowledge.module === moduleId)
    .sort(
      (left, right) =>
        left.knowledge.order - right.knowledge.order ||
        left.slug.localeCompare(right.slug),
    );
}
