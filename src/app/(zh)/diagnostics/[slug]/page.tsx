import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import {
  chineseDiagnosticDetailIds,
  getChineseDiagnosticDetailSymptom,
} from "@/lib/screeps-diagnostic-detail-pages";
import { getScreepsErrorDiagnostic } from "@/lib/screeps-error-diagnostics";
import { getLocalizedScreepsApiReference } from "@/lib/screeps-api-reference-localized";
import { getScreepsApiHubHref, screepsApiHubs } from "@/lib/screeps-api-hubs";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { localizeDiagnosticLink } from "@/lib/screeps-diagnostic-symptoms";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

import styles from "./diagnostic-detail.module.css";

export const revalidate = 300;

export function generateStaticParams() {
  return chineseDiagnosticDetailIds.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const symptom = getChineseDiagnosticDetailSymptom(slug);
  if (!symptom) return {};

  return createPageMetadata({
    title: `${symptom.zhTitle}怎么排查 | Screeps 故障诊断`,
    description: `${symptom.zhSummary} 按真实返回值、API、对象 Hub、工具与验证边界逐步排查。`,
    path: `/diagnostics/${symptom.id}`,
  });
}

export default async function DiagnosticDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const symptom = getChineseDiagnosticDetailSymptom(slug);
  if (!symptom) notFound();

  const apiEntries = getLocalizedScreepsApiReference("zh");
  const errorMap = new Map(screepsErrorCodes.map((error) => [error.name, error] as const));
  const pageUrl = `${siteConfig.url}/diagnostics/${symptom.id}`;
  const guides = (symptom.guides ?? []).map((link) => localizeDiagnosticLink(link, "zh"));
  const tools = (symptom.tools ?? []).map((link) => localizeDiagnosticLink(link, "zh"));
  const apiItems = (symptom.directApiEntryIds ?? [])
    .map((id) => apiEntries.find((entry) => entry.id === id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const hubItems = (symptom.directHubSlugs ?? [])
    .map((slugValue) => screepsApiHubs.find((hub) => hub.slug === slugValue))
    .filter((hub): hub is NonNullable<typeof hub> => Boolean(hub));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${symptom.zhTitle}怎么排查`,
        url: pageUrl,
        inLanguage: "zh-CN",
        description: symptom.zhSummary,
        isPartOf: { "@id": `${siteConfig.url}/diagnostics` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.url },
          { "@type": "ListItem", position: 2, name: "故障诊断中心", item: `${siteConfig.url}/diagnostics` },
          { "@type": "ListItem", position: 3, name: symptom.zhTitle, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Container>
        <nav className="resource-breadcrumb" aria-label="面包屑">
          <Link href="/diagnostics">故障诊断中心</Link>
          <span aria-hidden="true">/</span>
          <span>{symptom.zhTitle}</span>
        </nav>

        <header className={styles.hero}>
          <div>
            <p className="eyebrow">SCREEPS SYMPTOM DIAGNOSTIC</p>
            <h1>{symptom.zhTitle}怎么排查？</h1>
            <p>{symptom.zhSummary}</p>
          </div>
          <Link className={styles.backLink} href={`/diagnostics#${symptom.id}`}>
            回到完整诊断中心 →
          </Link>
        </header>

        <div className={styles.layout}>
          <article className={styles.mainColumn}>
            <section className={styles.panel}>
              <span className={styles.kicker}>01 · QUICK TRIAGE</span>
              <h2>先按这个顺序快速排查</h2>
              <ol className={styles.steps}>
                {symptom.zhTriage.map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className={styles.panel}>
              <span className={styles.kicker}>02 · RETURN CODES</span>
              <h2>把真实返回值接到对应分支</h2>
              {symptom.errorNames.length > 0 ? (
                <div className={styles.codeGrid}>
                  {symptom.errorNames.map((name) => {
                    const diagnostic = getScreepsErrorDiagnostic(name);
                    const error = errorMap.get(name);
                    const anchor = diagnostic ? `diagnostic-${name.toLowerCase()}` : name.toLowerCase();
                    return (
                      <Link href={`/screeps-errors#${anchor}`} key={name}>
                        <code>{name}</code>
                        {error ? <span>{error.value}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.muted}>
                  这类症状没有单一错误码可以定义。优先记录 Game.cpu.getUsed()、bucket 与跨 tick 状态，再比较修改前后的趋势。
                </p>
              )}
            </section>

            <section className={styles.panel}>
              <span className={styles.kicker}>03 · API & OBJECTS</span>
              <h2>继续检查直接相关的 API 与对象</h2>
              <div className={styles.relationColumns}>
                <div>
                  <h3>主要 API</h3>
                  <div className={styles.linkStack}>
                    {apiItems.map((entry) => (
                      <Link href={`/screeps-api#${entry.id}`} key={entry.id}>
                        <code>{entry.signature}</code> →
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>对象 Hub</h3>
                  <div className={styles.linkStack}>
                    {hubItems.map((hub) => (
                      <Link href={getScreepsApiHubHref(hub.slug, "zh")} key={hub.slug}>
                        {hub.objectName} →
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {(guides.length > 0 || tools.length > 0) ? (
              <section className={styles.panel}>
                <span className={styles.kicker}>04 · NEXT STEP</span>
                <h2>需要继续时，再进入教程或工具</h2>
                <div className={styles.relationColumns}>
                  <div>
                    <h3>专题教程</h3>
                    <div className={styles.linkStack}>
                      {guides.length > 0
                        ? guides.map((guide) => <Link href={guide.href} key={guide.href}>{guide.label} →</Link>)
                        : <span className={styles.muted}>当前优先从 API 与错误码分支继续。</span>}
                    </div>
                  </div>
                  <div>
                    <h3>实用工具</h3>
                    <div className={styles.linkStack}>
                      {tools.map((tool) => <Link href={tool.href} key={tool.href}>{tool.label} →</Link>)}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </article>

          <aside className={styles.sidebar}>
            <section className={styles.boundary}>
              <span className={styles.kicker}>RUNTIME EVIDENCE</span>
              <h2>不要把“返回 OK”直接当成后续结果已经发生</h2>
              <p>
                本页提供的是排查路径。Console、离线检查与真实多 tick 结果属于不同证据层级；没有 accepted Evidence 的结论不会在这里写成“已实服验证”。
              </p>
              <div className={styles.linkStack}>
                <Link href="/verification">查看验证方法 →</Link>
                <Link href={`/verification/coverage#coverage-${symptom.id}`}>查看这条路径的验证覆盖 →</Link>
                <Link href="/verified">查看最近已接受验证 →</Link>
              </div>
            </section>

            <section className={styles.otherSymptoms}>
              <span className={styles.kicker}>OTHER SYMPTOMS</span>
              <h2>其他第一阶段诊断页</h2>
              <div className={styles.linkStack}>
                {chineseDiagnosticDetailIds
                  .filter((id) => id !== symptom.id)
                  .map((id) => {
                    const item = getChineseDiagnosticDetailSymptom(id);
                    return item ? <Link href={`/diagnostics/${id}`} key={id}>{item.zhTitle} →</Link> : null;
                  })}
              </div>
            </section>
          </aside>
        </div>
      </Container>
    </main>
  );
}
