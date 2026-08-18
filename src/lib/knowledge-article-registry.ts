import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  parseKnowledgeArticleMetadata,
  type KnowledgeArticleKnowledgeMetadata,
  type KnowledgeArticleSeoMetadata,
} from "@/lib/knowledge-metadata";

const postsDirectory = path.join(process.cwd(), "content", "posts");
const migrationMetadataDirectory = path.join(
  process.cwd(),
  "content",
  "knowledge-metadata",
);

export interface KnowledgeArticleRegistryRecord {
  slug: string;
  knowledge: KnowledgeArticleKnowledgeMetadata;
  seo: KnowledgeArticleSeoMetadata;
  source: "frontmatter" | "migration-sidecar";
}

let cachedRegistry: readonly KnowledgeArticleRegistryRecord[] | null = null;

function readMigrationSidecar(
  slug: string,
): Record<string, unknown> | null {
  const filePath = path.join(migrationMetadataDirectory, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `${filePath}: Knowledge migration metadata 不是合法 JSON：${String(error)}`,
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${filePath}: Knowledge migration metadata 必须是对象`);
  }

  return parsed as Record<string, unknown>;
}

function buildRegistry(): readonly KnowledgeArticleRegistryRecord[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const records: KnowledgeArticleRegistryRecord[] = [];

  for (const fileName of fs
    .readdirSync(postsDirectory)
    .filter((name) => name.endsWith(".md"))
    .sort()) {
    const slug = fileName.replace(/\.md$/, "");
    const filePath = path.join(postsDirectory, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    const { data } = matter(source);

    if (data.draft === true) continue;

    const inline = parseKnowledgeArticleMetadata(data, filePath);
    const sidecarData = readMigrationSidecar(slug);

    if (sidecarData && (inline.knowledge || inline.seo)) {
      throw new Error(
        `${filePath}: 已存在 frontmatter knowledge/seo，请删除对应 migration sidecar，保持单一 Source of Truth`,
      );
    }

    const metadata = sidecarData
      ? parseKnowledgeArticleMetadata(
          sidecarData,
          path.join(migrationMetadataDirectory, `${slug}.json`),
        )
      : inline;

    if (!metadata.knowledge || !metadata.seo) continue;

    records.push({
      slug,
      knowledge: metadata.knowledge,
      seo: metadata.seo,
      source: sidecarData ? "migration-sidecar" : "frontmatter",
    });
  }

  return records.sort(
    (left, right) =>
      left.knowledge.module.localeCompare(right.knowledge.module) ||
      left.knowledge.order - right.knowledge.order ||
      left.slug.localeCompare(right.slug),
  );
}

export function getKnowledgeArticleRegistry(): readonly KnowledgeArticleRegistryRecord[] {
  cachedRegistry ??= buildRegistry();
  return cachedRegistry;
}

export function getKnowledgeArticleMetadata(
  slug: string,
): KnowledgeArticleRegistryRecord | null {
  return getKnowledgeArticleRegistry().find((record) => record.slug === slug) ?? null;
}

export function getKnowledgeArticlesForModule(
  moduleId: string,
): readonly KnowledgeArticleRegistryRecord[] {
  return getKnowledgeArticleRegistry()
    .filter((record) => record.knowledge.module === moduleId)
    .sort(
      (left, right) =>
        left.knowledge.order - right.knowledge.order ||
        left.slug.localeCompare(right.slug),
    );
}
