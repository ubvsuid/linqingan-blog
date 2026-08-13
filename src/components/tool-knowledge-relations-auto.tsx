"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/components/container";
import type {
  ToolKnowledgeRelationRecord,
  ToolKnowledgeRelationsLocale,
} from "@/lib/tool-knowledge-relations";

import styles from "./tool-knowledge-relations-auto.module.css";

interface ToolKnowledgeRelationsAutoProps {
  locale: ToolKnowledgeRelationsLocale;
  relations: ToolKnowledgeRelationRecord[];
}

export function ToolKnowledgeRelationsAuto({
  locale,
  relations,
}: ToolKnowledgeRelationsAutoProps) {
  const pathname = usePathname();
  const relation = relations.find((item) => item.toolHref === pathname);

  if (!relation) return null;

  const copy =
    locale === "zh"
      ? {
          eyebrow: "KNOWLEDGE GRAPH",
          title: "从这个工具继续到文章、API 与错误码",
          description:
            "这些入口由现有 API Hub 关系自动生成。工具用于计算和诊断，文章负责解释边界，API 与错误码负责继续定位失败原因。",
          guides: "相关文章",
          api: "相关 API Hub",
          errors: "可能遇到的错误码",
          guideMeta: "Guide",
          apiMeta: "API",
          errorMeta: "Error",
        }
      : {
          eyebrow: "KNOWLEDGE GRAPH",
          title: "Continue from this tool to guides, APIs, and errors",
          description:
            "These links are generated from the existing API Hub relationships. Use the tool for calculation or diagnosis, then use the guides, API hubs, and error references to verify assumptions and debug failures.",
          guides: "Related guides",
          api: "Related API hubs",
          errors: "Possible error codes",
          guideMeta: "Guide",
          apiMeta: "API",
          errorMeta: "Error",
        };

  return (
    <aside className={styles.shell} aria-labelledby="tool-knowledge-relations-title">
      <Container>
        <div className={styles.header}>
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 id="tool-knowledge-relations-title">{copy.title}</h2>
          </div>
          <p>{copy.description}</p>
        </div>

        <div className={styles.grid}>
          {relation.guides.length > 0 ? (
            <section className={styles.panel} aria-label={copy.guides}>
              <span>{copy.guides}</span>
              <div className={styles.links}>
                {relation.guides.map((guide) => (
                  <Link key={guide.href} href={guide.href}>
                    <strong>{guide.label}</strong>
                    <small>{guide.meta ?? copy.guideMeta}</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {relation.apiHubs.length > 0 ? (
            <section className={styles.panel} aria-label={copy.api}>
              <span>{copy.api}</span>
              <div className={styles.links}>
                {relation.apiHubs.map((hub) => (
                  <Link key={hub.href} href={hub.href}>
                    <strong>{hub.label}</strong>
                    <small>{hub.meta ?? copy.apiMeta}</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {relation.errors.length > 0 ? (
            <section className={styles.panel} aria-label={copy.errors}>
              <span>{copy.errors}</span>
              <div className={styles.links}>
                {relation.errors.map((error) => (
                  <Link key={error.href} href={error.href}>
                    <code>{error.label}</code>
                    <small>{error.meta ?? copy.errorMeta}</small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </Container>
    </aside>
  );
}
