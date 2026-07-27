import { getKnowledgeBaseSectionBySlug } from "@/lib/knowledge-base";
import { projects } from "@/lib/projects";
import { getSearchablePosts } from "@/lib/posts";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { screepsGlossary } from "@/lib/screeps-glossary";

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

interface SearchDocumentOptions {
  includeArticleText?: boolean;
}

const MAX_ARTICLE_SEARCH_TOKENS = 220;
const MAX_ARTICLE_SEARCH_TEXT_LENGTH = 2400;

function compactArticleSearchText(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = normalized.match(/[A-Za-z_][A-Za-z0-9_.:-]*|[\u3400-\u9fff]{1,8}|\d+(?:\.\d+)?/g) ?? [];
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

const toolDocuments: SearchDocument[] = [
  {
    id: "tool:creep-body-calculator",
    type: "工具",
    title: "Screeps Creep 身体计算器",
    description: "组合身体部件，计算 Energy 成本、生成时间、生命值、携带容量和满载移动速度。",
    href: "/tools/creep-body-calculator",
    meta: "免费工具 · 支持链接分享",
    keywords: [
      "Creep Body",
      "BODYPART_COST",
      "MOVE",
      "WORK",
      "CARRY",
      "身体计算器",
      "生成时间",
      "fatigue",
    ],
    text: "Screeps 身体部件 成本 Spawn 生成时间 50 个部件 MOVE 比例 Road Plain Swamp",
  },
  {
    id: "tool:room-diagnostics",
    type: "工具",
    title: "Screeps 房间运行诊断",
    description: "检查 Spawn、角色数量、Energy、Controller、工地和 CPU 风险。",
    href: "/tools/room-diagnostics",
    meta: "免费工具 · 支持配置分享",
    keywords: ["房间诊断", "Spawn", "角色数量", "Controller", "CPU", "Energy"],
    text: "Screeps 房间运行 检查 断代 Spawn Energy Controller 工地 CPU bucket",
  },
];

export function getSearchDocuments(options: SearchDocumentOptions = {}): SearchDocument[] {
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
      keywords: [
        ...post.tags,
        post.category,
        ...(section ? [section.title, section.description] : []),
      ],
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
