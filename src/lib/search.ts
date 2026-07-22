import { projects } from "@/lib/projects";
import { getSearchablePosts } from "@/lib/posts";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { screepsGlossary } from "@/lib/screeps-glossary";

export type SearchDocumentType = "文章" | "术语" | "错误码" | "项目";

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

export function getSearchDocuments(): SearchDocument[] {
  const posts: SearchDocument[] = getSearchablePosts().map((post) => ({
    id: `post:${post.slug}`,
    type: "文章",
    title: post.title,
    description: post.description,
    href: `/blog/${post.slug}`,
    meta: `${post.category} · ${post.readingMinutes} 分钟`,
    keywords: [...post.tags, post.category],
    text: post.text,
  }));

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

  return [...posts, ...glossary, ...errors, ...projectDocuments];
}
