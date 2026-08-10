import { getKnowledgeBaseSectionBySlug } from "@/lib/knowledge-base";
import { projects } from "@/lib/projects";
import { getSearchablePosts } from "@/lib/posts";
import { screepsApiReference } from "@/lib/screeps-api-reference";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { screepsGlossary } from "@/lib/screeps-glossary";
import { getToolHref, toolCatalog, toolCount } from "@/lib/tool-catalog";

export type SearchDocumentType = "文章" | "术语" | "错误码" | "工具" | "项目";

export interface SearchDocument {
  id: string;
  type: SearchDocumentType;
  title: string;
  description: string;
  href: string;
  meta: string;
  keywords: string[];
  text: string;
}

export interface SearchIndexSummary {
  total: number;
  articleCount: number;
  publicToolCount: number;
  toolDocumentCount: number;
  byType: Record<SearchDocumentType, number>;
}

interface SearchDocumentOptions {
  includeArticleText?: boolean;
}

const MAX_ARTICLE_SEARCH_TOKENS = 72;
const MAX_ARTICLE_SEARCH_TEXT_LENGTH = 720;
export const SEARCH_INDEX_WARN_BYTES = 163_840;
export const SEARCH_INDEX_MAX_BYTES = 196_608;

function compactArticleSearchText(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens =
    normalized.match(
      /[A-Za-z_][A-Za-z0-9_.:-]*|[\u3400-\u9fff]{1,8}|\d+(?:\.\d+)?/g,
    ) ?? [];
  const seen = new Set<string>();
  const uniqueTokens: string[] = [];

  for (const token of tokens) {
    const key = token.toLocaleLowerCase("zh-CN");
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTokens.push(token);
    if (uniqueTokens.length >= MAX_ARTICLE_SEARCH_TOKENS) break;
  }

  return uniqueTokens.join(" ").slice(0, MAX_ARTICLE_SEARCH_TEXT_LENGTH);
}

function compactKeywords(values: string[], limit = 14): string[] {
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const value of values) {
    const normalized = value.normalize("NFKC").replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase("zh-CN");
    if (seen.has(key)) continue;
    seen.add(key);
    keywords.push(normalized.slice(0, 80));
    if (keywords.length >= limit) break;
  }

  return keywords;
}

const apiReferenceDocument: SearchDocument = {
  id: "reference:screeps-api",
  type: "工具",
  title: "Screeps API 快速查询",
  description:
    "按对象、方法和关键词查询常用 Game、Creep、Room、Structure 与系统 API。",
  href: "/screeps-api",
  meta: `快速参考 · ${screepsApiReference.length} 项`,
  keywords: ["Screeps API", "Game API", "Creep API", "Room API", "Structure API"],
  text: screepsApiReference.map((entry) => entry.signature).join(" "),
};

const toolDocuments: SearchDocument[] = [
  {
    id: "tool:hub",
    type: "工具",
    title: "免费 Screeps 工具",
    description:
      "集中使用身体、房间、Market、Controller、Lab、Spawn、运输与 Tower 计算和诊断工具。",
    href: "/tools",
    meta: `${toolCount} 个浏览器本地工具`,
    keywords: ["Screeps 工具", "计算器", "诊断", "规划器", "tools"],
    text: "Screeps 免费工具 身体 房间 Market Terminal Controller Lab Boost Spawn 运输 Tower 计算 诊断 规划",
  },
  apiReferenceDocument,
  ...toolCatalog.map(
    (tool): SearchDocument => ({
      id: `tool:${tool.slug}`,
      type: "工具",
      title: `Screeps ${tool.zhTitle}`,
      description: tool.zhDescription,
      href: getToolHref(tool.slug),
      meta: tool.zhSearchMeta,
      keywords: [...tool.zhKeywords],
      text: tool.zhSearchText,
    }),
  ),
];

export function getSearchDocuments(
  options: SearchDocumentOptions = {},
): SearchDocument[] {
  const includeArticleText = options.includeArticleText ?? true;
  const posts: SearchDocument[] = getSearchablePosts().map((post) => {
    const section = getKnowledgeBaseSectionBySlug(post.slug);
    return {
      id: `post:${post.slug}`,
      type: "文章",
      title: post.title,
      description: post.description,
      href: `/blog/${post.slug}`,
      meta: `${section?.title ?? post.category} · ${post.readingMinutes} 分钟`,
      keywords: compactKeywords([
        ...post.tags,
        post.category,
        ...(section ? [section.title] : []),
      ]),
      text: includeArticleText ? compactArticleSearchText(post.text) : "",
    };
  });

  const glossary: SearchDocument[] = screepsGlossary.map((entry) => ({
    id: `glossary:${entry.term}`,
    type: "术语",
    title: `${entry.term}｜${entry.chinese}`,
    description: entry.summary,
    href: `/glossary#${entry.term.toLowerCase().replaceAll(" ", "-")}`,
    meta: entry.category,
    keywords: [entry.term, entry.chinese, entry.category],
    text: entry.detail,
  }));

  const errors: SearchDocument[] = screepsErrorCodes.map((code) => ({
    id: `error:${code.name}`,
    type: "错误码",
    title: `${code.name}（${code.value}）`,
    description: code.meaning,
    href: `/screeps-errors#${code.name.toLowerCase()}`,
    meta: `返回值 ${code.value}`,
    keywords: [code.name, String(code.value), "Screeps 错误码"],
    text: `${code.commonCause} ${code.fix}`,
  }));

  const projectDocuments: SearchDocument[] = projects.map((project) => ({
    id: `project:${project.id}`,
    type: "项目",
    title: project.title,
    description: project.summary,
    href: `/about#project-${project.id}`,
    meta: project.status,
    keywords: project.details.map((detail) => detail.value),
    text: [
      project.purpose,
      project.challenge,
      ...project.approach,
      ...project.highlights,
      ...project.nextSteps,
    ].join(" "),
  }));

  return [...posts, ...glossary, ...errors, ...toolDocuments, ...projectDocuments];
}

export function getSearchIndexPayloadBytes(documents: SearchDocument[]): number {
  return new TextEncoder().encode(JSON.stringify(documents)).byteLength;
}

export function assertSearchIndexBudget(documents: SearchDocument[]): number {
  const bytes = getSearchIndexPayloadBytes(documents);
  if (bytes > SEARCH_INDEX_MAX_BYTES) {
    throw new Error(
      `Chinese search index is ${bytes} bytes, exceeding the ${SEARCH_INDEX_MAX_BYTES}-byte budget.`,
    );
  }
  if (bytes >= SEARCH_INDEX_WARN_BYTES) {
    console.warn(
      `Chinese search index is ${bytes} bytes, above the ${SEARCH_INDEX_WARN_BYTES}-byte warning threshold. Plan Search Index V2 before the ${SEARCH_INDEX_MAX_BYTES}-byte hard limit is reached.`,
    );
  }
  return bytes;
}

export function getSearchIndexSummary(
  documents: SearchDocument[],
): SearchIndexSummary {
  const byType: Record<SearchDocumentType, number> = {
    文章: 0,
    术语: 0,
    错误码: 0,
    工具: 0,
    项目: 0,
  };

  for (const document of documents) {
    byType[document.type] += 1;
  }

  return {
    total: documents.length,
    articleCount: byType.文章,
    publicToolCount: toolCount,
    toolDocumentCount: byType.工具,
    byType,
  };
}
