import Link from "next/link";

import { Container } from "@/components/container";
import {
  getLocalizedHubLink,
  getScreepsApiHubHref,
  type ScreepsApiHubConfig,
  type ScreepsApiHubLocale,
} from "@/lib/screeps-api-hubs";
import { getLocalizedScreepsApiReference } from "@/lib/screeps-api-reference-localized";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { siteConfig } from "@/lib/site";
import { getVerifiedContentWithEvidence } from "@/lib/verified-content";

import styles from "./screeps-api-hub-page.module.css";

function uniqueLinks(links: Array<{ label: string; href: string }>) {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

export async function ScreepsApiHubPage({
  hub,
  locale,
}: {
  hub: ScreepsApiHubConfig;
  locale: ScreepsApiHubLocale;
}) {
  const entries = getLocalizedScreepsApiReference(locale).filter((entry) =>
    hub.entryIds.includes(entry.id),
  );
  const errors = screepsErrorCodes.filter((error) => hub.errorNames.includes(error.name));
  const tools = hub.tools.map((link) => getLocalizedHubLink(link, locale));
  const modules = hub.modules.map((link) => getLocalizedHubLink(link, locale));
  const guideLinks = uniqueLinks([
    ...entries.flatMap((entry) =>
      entry.guideHref ? [{ label: entry.signature, href: entry.guideHref }] : [],
    ),
    ...(hub.extraGuides ?? []).map((link) => getLocalizedHubLink(link, locale)),
  ]);
  const verified = await getVerifiedContentWithEvidence(locale);
  const guideHrefSet = new Set(guideLinks.map((guide) => guide.href));
  const relatedVerified = verified.filter((record) => guideHrefSet.has(record.href));
  const isEnglish = locale === "en";
  const hubHref = getScreepsApiHubHref(hub.slug, locale);
  const pageUrl = `${siteConfig.url}${hubHref}`;
  const apiRootHref = isEnglish ? "/en/screeps-api" : "/screeps-api";
  const errorsHref = isEnglish ? "/en/screeps-errors" : "/screeps-errors";
  const verifiedHref = isEnglish ? "/en/verified" : "/verified";
  const verificationHref = isEnglish ? "/en/verification" : "/verification";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEnglish ? hub.enTitle : hub.zhTitle,
    description: isEnglish ? hub.enDescription : hub.zhDescription,
    url: pageUrl,
    inLanguage: isEnglish ? "en" : "zh-CN",
    mainEntity:
      entries.length > 0
        ? {
            "@type": "ItemList",
            numberOfItems: entries.length,
            itemListElement: entries.map((entry, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: entry.signature,
              url: `${apiRootHref}#${entry.id}`,
            })),
          }
        : undefined,
  };

  const copy = isEnglish
    ? {
        eyebrow: "OBJECT HUB",
        breadcrumb: "API Quick Reference",
        apiTitle: "Covered API surfaces",
        apiBody: "These entries come from the shared quick-reference dataset. Open the full reference when you need to search across objects.",
        apiOpen: "Open in API reference →",
        errorTitle: "High-signal return codes",
        errorBody: "These are the return-code paths already connected to this object in the site's existing guides and error reference.",
        errorOpen: "Open return code →",
        guideTitle: "Focused guides",
        guideBody: "Use the focused guides for workflow details instead of duplicating full tutorials on this hub.",
        toolTitle: "Related tools",
        moduleTitle: "Knowledge modules",
        verificationTitle: "Runtime verification",
        verificationBody: "Only guides that pass the existing Markdown acceptance boundary and have an accepted Console or live verification level appear here.",
        noVerified: "No related guide is publicly Console/live verified yet.",
        verifiedOpen: "Open verified guide →",
        verificationMethod: "Read the verification method",
        allVerified: "Open all recently verified guides",
        back: "All API references",
        official: "Official API Reference ↗",
        result: "return",
      }
    : {
        eyebrow: "OBJECT HUB",
        breadcrumb: "API 快速查询",
        apiTitle: "当前覆盖的 API 入口",
        apiBody: "这些条目直接来自共享的 API 快速查询数据源。需要跨对象搜索时，继续回到完整 Reference。",
        apiOpen: "在 API Reference 中打开 →",
        errorTitle: "高信号返回码",
        errorBody: "这里只列出当前站内已有教程与错误码中心明确连接到这个对象的排查入口。",
        errorOpen: "打开错误码 →",
        guideTitle: "专题教程",
        guideBody: "具体工作流继续由已有专题文章承载，Hub 不重复制造第二套教程。",
        toolTitle: "相关工具",
        moduleTitle: "知识模块",
        verificationTitle: "Runtime Verification",
        verificationBody: "只有同时通过现有 Markdown 接受边界，并达到 Console 或 Live 公开等级的相关文章才会显示在这里。",
        noVerified: "当前还没有与这个 Hub 相关的公开 Console / Live 已验证文章。",
        verifiedOpen: "打开已验证文章 →",
        verificationMethod: "查看验证方法",
        allVerified: "查看全部最近验证",
        back: "全部 API Reference",
        official: "官方 API Reference ↗",
        result: "返回值",
      };

  return (
    <main className={styles.page} lang={isEnglish ? "en" : "zh-CN"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container>
        <nav className={styles.breadcrumb} aria-label={isEnglish ? "Breadcrumb" : "面包屑"}>
          <Link href={apiRootHref}>{copy.breadcrumb}</Link>
          <span aria-hidden="true">/</span>
          <span>{hub.objectName}</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{isEnglish ? hub.enTitle : hub.zhTitle}</h1>
          <p>{isEnglish ? hub.enDescription : hub.zhDescription}</p>
          <p className={styles.scope}>{isEnglish ? hub.enScope : hub.zhScope}</p>
          <div className="button-row">
            <Link className="button button-secondary" href={apiRootHref}>{copy.back}</Link>
            <a className="button button-secondary" href="https://docs.screeps.com/api/" target="_blank" rel="noreferrer">
              {copy.official}
            </a>
          </div>
        </header>

        {entries.length > 0 ? (
          <section className={styles.section} aria-labelledby="hub-api-title">
            <div className={styles.sectionHead}>
              <div>
                <p className="eyebrow">API</p>
                <h2 id="hub-api-title">{copy.apiTitle}</h2>
                <p>{copy.apiBody}</p>
              </div>
              <strong>{entries.length}</strong>
            </div>
            <div className={styles.apiGrid}>
              {entries.map((entry) => (
                <article key={entry.id} className={styles.apiCard}>
                  <span>{entry.group}</span>
                  <h3><code>{entry.signature}</code></h3>
                  <p>{entry.summary}</p>
                  <div className={styles.tags}>
                    {entry.keywords.slice(0, 4).map((keyword) => <span key={keyword}>{keyword}</span>)}
                  </div>
                  <Link href={`${apiRootHref}#${entry.id}`}>{copy.apiOpen}</Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.twoColumn}>
          <div className={styles.panel}>
            <p className="eyebrow">RETURN CODES</p>
            <h2>{copy.errorTitle}</h2>
            <p>{copy.errorBody}</p>
            <div className={styles.linkStack}>
              {errors.map((error) => (
                <Link key={error.name} href={`${errorsHref}#${error.name.toLowerCase()}`}>
                  <span><code>{error.name}</code> <small>{copy.result} {error.value}</small></span>
                  {!isEnglish ? <em>{error.meaning}</em> : null}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <p className="eyebrow">GUIDES</p>
            <h2>{copy.guideTitle}</h2>
            <p>{copy.guideBody}</p>
            <div className={styles.linkStack}>
              {guideLinks.map((guide) => (
                <Link key={guide.href} href={guide.href}><span>{guide.label}</span></Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.twoColumn}>
          <div className={styles.panel}>
            <p className="eyebrow">TOOLS</p>
            <h2>{copy.toolTitle}</h2>
            <div className={styles.linkStack}>
              {tools.map((tool) => <Link key={tool.href} href={tool.href}><span>{tool.label}</span></Link>)}
            </div>
          </div>
          <div className={styles.panel}>
            <p className="eyebrow">LEARN</p>
            <h2>{copy.moduleTitle}</h2>
            <div className={styles.linkStack}>
              {modules.map((module) => <Link key={module.href} href={module.href}><span>{module.label}</span></Link>)}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.verification}`} aria-labelledby="hub-verification-title">
          <div className={styles.sectionHead}>
            <div>
              <p className="eyebrow">PROVE</p>
              <h2 id="hub-verification-title">{copy.verificationTitle}</h2>
              <p>{copy.verificationBody}</p>
            </div>
            <strong>{relatedVerified.length}</strong>
          </div>
          {relatedVerified.length > 0 ? (
            <div className={styles.verifiedGrid}>
              {relatedVerified.slice(0, 4).map((record) => (
                <article key={record.href}>
                  <span>{record.liveTested ? "LIVE" : "CONSOLE"}</span>
                  <h3>{record.title}</h3>
                  <p>{record.description}</p>
                  <small>{record.date}{record.evidenceCount > 0 ? ` · ${record.evidenceCount} evidence` : ""}</small>
                  <Link href={record.href}>{copy.verifiedOpen}</Link>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyVerification}>
              <strong>{copy.noVerified}</strong>
              <div>
                <Link href={verificationHref}>{copy.verificationMethod}</Link>
                <Link href={verifiedHref}>{copy.allVerified}</Link>
              </div>
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
