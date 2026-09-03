import Link from "next/link";

import { curatedInternalLinkClusters } from "@/lib/internal-link-clusters";
import { debuggingInternalLinkClusters } from "@/lib/internal-link-clusters-debugging";
import { movementInternalLinkClusters } from "@/lib/internal-link-clusters-movement";

import styles from "./article-knowledge-relations.module.css";

interface ArticleCuratedLinksProps {
  href: string;
  locale: "zh" | "en";
}

function titleIdForHref(href: string): string {
  return `curated-links-${href.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
}

export function ArticleCuratedLinks({ href, locale }: ArticleCuratedLinksProps) {
  const relation =
    curatedInternalLinkClusters[href]
    ?? movementInternalLinkClusters[href]
    ?? debuggingInternalLinkClusters[href];
  if (!relation || relation.links.length === 0) return null;

  const titleId = titleIdForHref(href);
  const isEnglish = locale === "en";

  return (
    <section className={styles.relations} aria-labelledby={titleId}>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">CURATED PATH</p>
          <h2 id={titleId}>
            {isEnglish
              ? "Continue through the same system"
              : "沿着同一条问题链继续"}
          </h2>
        </div>
        <p>
          {isEnglish
            ? "These links are maintained for a concrete prerequisite, failure mode, debugging step, or next lesson instead of generic topic similarity."
            : "这些链接按前置知识、具体故障、排错动作或下一课人工维护，不按泛标签机械推荐。"}
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.panel}>
          <span>{relation.cluster}</span>
          <h3>{isEnglish ? "Recommended next steps" : "推荐下一步"}</h3>
          <div className={styles.links}>
            {relation.links.map((link) => (
              <Link href={link.href} key={link.href}>
                <span>{link.label}</span>
                <small>{link.role}</small>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
