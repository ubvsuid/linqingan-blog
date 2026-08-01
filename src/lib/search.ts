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
    id: "tool:hub",
    type: "工具",
    title: "免费 Screeps 工具",
    description: "集中使用身体、房间、Market、Controller 与 Lab 计算和诊断工具。",
    href: "/tools",
    meta: "5 个浏览器本地工具",
    keywords: ["Screeps 工具", "计算器", "诊断", "规划器", "tools"],
    text: "Screeps 免费工具 身体 房间 Market Terminal Controller Lab Boost 计算 诊断 规划",
  },
  {
    id: "tool:creep-body-calculator",
    type: "工具",
    title: "Screeps Creep 身体计算器",
    description: "组合身体部件，计算 Energy 成本、生成时间、生命值、携带容量和满载移动速度。",
    href: "/tools/creep-body-calculator",
    meta: "免费工具 · 支持链接分享",
    keywords: ["Creep Body", "BODYPART_COST", "MOVE", "WORK", "CARRY", "身体计算器", "生成时间", "fatigue"],
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
  {
    id: "tool:market-terminal-cost-calculator",
    type: "工具",
    title: "Screeps Market 与 Terminal 成本计算器",
    description: "计算运输Energy、Market成交后的实际单价和创建订单的5%手续费。",
    href: "/tools/market-terminal-cost-calculator",
    meta: "免费工具 · URL参数可分享",
    keywords: ["Market 计算器", "Terminal 成本", "calcTransactionCost", "deal", "订单手续费", "Credits"],
    text: "Screeps Market Terminal 运输 Energy 实际单价 买单 卖单 deal 订单 5% 手续费",
  },
  {
    id: "tool:controller-downgrade-planner",
    type: "工具",
    title: "Screeps Controller 降级与 Upgrader 规划器",
    description: "根据ticksToDowngrade、WORK、Boost、有效升级比例和RCL8上限估算安全余量。",
    href: "/tools/controller-downgrade-planner",
    meta: "免费工具 · 只读Console探针",
    keywords: ["Controller 降级", "ticksToDowngrade", "Upgrader", "WORK", "XGH2O", "OPERATE_CONTROLLER"],
    text: "Screeps Controller 降级 安全线 Upgrader WORK Boost RCL8 升级 上限 进度",
  },
  {
    id: "tool:lab-reaction-boost-planner",
    type: "工具",
    title: "Screeps Lab 反应与 Boost 规划器",
    description: "展开化合物反应链，计算基础矿物、Lab轮数、生产Tick和整批Boost需求。",
    href: "/tools/lab-reaction-boost-planner",
    meta: "免费工具 · 支持计划JSON",
    keywords: ["Lab 规划", "反应链", "Boost 计算", "XGH2O", "OPERATE_LAB", "矿物"],
    text: "Screeps Lab reaction Boost compound mineral cooldown output lab XGH2O 化合物 反应",
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
    text: [project.purpose, project.challenge, ...project.approach, ...project.highlights, ...project.nextSteps].join(" "),
  }));

  return [...posts, ...glossary, ...errors, ...toolDocuments, ...projectDocuments];
}
