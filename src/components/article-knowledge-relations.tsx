import Link from "next/link";

import { getKnowledgeBasePostPosition } from "@/lib/knowledge-base";
import { getAllPosts } from "@/lib/posts";
import {
  getScreepsApiHubHref,
  screepsApiHubs,
} from "@/lib/screeps-api-hubs";
import { screepsApiReference } from "@/lib/screeps-api-reference";
import { screepsErrorCodes } from "@/lib/screeps-errors";

import styles from "./article-knowledge-relations.module.css";

interface ArticleKnowledgeRelationsProps {
  slug: string;
}

function uniqueByHref<T extends { href: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

export function ArticleKnowledgeRelations({ slug }: ArticleKnowledgeRelationsProps) {
  const articleHref = `/blog/${slug}`;
  const relatedEntries = screepsApiReference.filter((entry) => entry.guideHref === articleHref);
  const relatedEntryIds = new Set(relatedEntries.map((entry) => entry.id));
  const relatedHubs = screepsApiHubs.filter(
    (hub) =>
      hub.entryIds.some((entryId) => relatedEntryIds.has(entryId)) ||
      (hub.extraGuides ?? []).some((guide) => guide.zhHref === articleHref),
  );
  const relatedErrorNames = new Set(relatedHubs.flatMap((hub) => [...hub.errorNames]));
  const relatedErrors = screepsErrorCodes.filter((error) => relatedErrorNames.has(error.name)).slice(0, 6);
  const relatedTools = uniqueByHref(
    relatedHubs.flatMap((hub) =>
      hub.tools.map((tool) => ({ label: tool.zhLabel, href: tool.zhHref })),
    ),
  ).slice(0, 5);
  const knowledgePosition = getKnowledgeBasePostPosition(slug);
  const postsBySlug = new Map(getAllPosts().map((post) => [post.slug, post]));
  const nextPost = knowledgePosition?.nextSlug
    ? postsBySlug.get(knowledgePosition.nextSlug)
    : null;

  if (
    relatedEntries.length === 0 &&
    relatedHubs.length === 0 &&
    relatedErrors.length === 0 &&
    relatedTools.length === 0 &&
    !knowledgePosition
  ) {
    return null;
  }

  return (
    <section className={styles.relations} aria-labelledby={`article-relations-${slug}`}>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">KNOWLEDGE GRAPH</p>
          <h2 id={`article-relations-${slug}`}>把这篇文章连接到 API、错误码和工具</h2>
        </div>
        <p>
          这里由现有 API Reference、Object Hub 与知识库顺序自动生成，用来继续排查和学习；它不替代正文中的具体前置条件与返回值说明。
        </p>
      </div>

      <div className={styles.grid}>
        {relatedEntries.length > 0 || relatedHubs.length > 0 ? (
          <div className={styles.panel}>
            <span>RELATED API</span>
            <h3>相关 API 与对象入口</h3>
            <div className={styles.links}>
              {relatedEntries.slice(0, 5).map((entry) => (
                <Link key={entry.id} href={`/screeps-api#${entry.id}`}>
                  <code>{entry.signature}</code>
                  <small>API</small>
                </Link>
              ))}
              {relatedHubs.slice(0, 4).map((hub) => (
                <Link key={hub.slug} href={getScreepsApiHubHref(hub.slug)}>
                  <span>{hub.zhTitle}</span>
                  <small>Hub</small>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {relatedErrors.length > 0 ? (
          <div className={styles.panel}>
            <span>POSSIBLE ERRORS</span>
            <h3>相关错误码</h3>
            <div className={styles.links}>
              {relatedErrors.map((error) => (
                <Link key={error.name} href={`/screeps-errors#${error.name.toLowerCase()}`}>
                  <code>{error.name}</code>
                  <small>{error.value}</small>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {relatedTools.length > 0 ? (
          <div className={styles.panel}>
            <span>USEFUL TOOLS</span>
            <h3>相关诊断与规划工具</h3>
            <div className={styles.links}>
              {relatedTools.map((tool) => (
                <Link key={tool.href} href={tool.href}>
                  <span>{tool.label}</span>
                  <small>Tool</small>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {knowledgePosition ? (
          <div className={styles.panel}>
            <span>NEXT TOPIC</span>
            <h3>继续这个知识模块</h3>
            <div className={styles.next}>
              <p>
                当前属于“{knowledgePosition.section.title}”第 {knowledgePosition.index + 1} / {knowledgePosition.section.slugs.length} 篇。
              </p>
              {nextPost ? (
                <Link href={`/blog/${nextPost.slug}`}>下一篇：{nextPost.title} →</Link>
              ) : (
                <Link href={`/knowledge/${knowledgePosition.section.id}`}>
                  本模块已读到末尾，返回模块地图 →
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
