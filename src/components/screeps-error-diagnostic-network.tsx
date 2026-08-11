import Link from "next/link";

import {
  getLocalizedErrorDiagnosticLink,
  screepsErrorDiagnostics,
  type ScreepsErrorDiagnosticLocale,
} from "@/lib/screeps-error-diagnostics";
import { getLocalizedScreepsApiReference } from "@/lib/screeps-api-reference-localized";
import { getScreepsApiHubHref, screepsApiHubs } from "@/lib/screeps-api-hubs";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { getVerifiedContentWithEvidence } from "@/lib/verified-content";

import styles from "./screeps-error-diagnostic-network.module.css";

export async function ScreepsErrorDiagnosticNetwork({
  locale,
}: {
  locale: ScreepsErrorDiagnosticLocale;
}) {
  const isEnglish = locale === "en";
  const apiEntries = getLocalizedScreepsApiReference(locale);
  const verified = await getVerifiedContentWithEvidence(locale);
  const errorsByName = new Map(screepsErrorCodes.map((code) => [code.name, code] as const));
  const apiRootHref = isEnglish ? "/en/screeps-api" : "/screeps-api";
  const verificationHref = isEnglish ? "/en/verification" : "/verification";
  const verifiedHref = isEnglish ? "/en/verified" : "/verified";

  const copy = isEnglish
    ? {
        eyebrow: "DIAGNOSTIC NETWORK",
        title: "High-frequency error paths",
        body: "Start from a return code, then move through the APIs, object hubs, focused guides, tools, and current runtime-verification status connected to that failure branch.",
        pathCount: "priority paths",
        checkNext: "What should I check next?",
        api: "API surfaces",
        hubs: "Object hubs",
        guides: "Focused guides",
        tools: "Related tools",
        verification: "Runtime verification",
        noneVerified: "No related guide is publicly Console/live verified yet.",
        verifiedCount: "accepted verified guide(s)",
        method: "Verification method",
        allVerified: "Recently verified",
        openError: "Open full error entry",
      }
    : {
        eyebrow: "DIAGNOSTIC NETWORK",
        title: "高频错误诊断路径",
        body: "从返回码出发，继续进入它已经关联的 API、对象 Hub、专题教程、工具与当前 Runtime Verification 状态，而不是停留在错误码释义。",
        pathCount: "条重点路径",
        checkNext: "下一步检查什么？",
        api: "相关 API",
        hubs: "对象 Hub",
        guides: "专题教程",
        tools: "相关工具",
        verification: "Runtime Verification",
        noneVerified: "当前还没有与这条错误路径相关的公开 Console / Live 已验证文章。",
        verifiedCount: "篇已接受验证文章",
        method: "验证方法",
        allVerified: "最近验证",
        openError: "打开完整错误条目",
      };

  return (
    <section className={styles.network} aria-labelledby={`error-diagnostic-network-${locale}`}>
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id={`error-diagnostic-network-${locale}`}>{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
        <strong>{screepsErrorDiagnostics.length} {copy.pathCount}</strong>
      </header>

      <div className={styles.grid}>
        {screepsErrorDiagnostics.map((diagnostic) => {
          const error = errorsByName.get(diagnostic.name);
          if (!error) return null;

          const relatedApis = diagnostic.apiEntryIds
            .map((id) => apiEntries.find((entry) => entry.id === id))
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
          const relatedHubs = diagnostic.hubSlugs
            .map((slug) => screepsApiHubs.find((hub) => hub.slug === slug))
            .filter((hub): hub is NonNullable<typeof hub> => Boolean(hub));
          const guides = diagnostic.guides.map((link) =>
            getLocalizedErrorDiagnosticLink(link, locale),
          );
          const tools = diagnostic.tools.map((link) =>
            getLocalizedErrorDiagnosticLink(link, locale),
          );
          const verifiedHrefSet = new Set([
            ...guides.map((guide) => guide.href),
            ...relatedApis.flatMap((entry) => (entry.guideHref ? [entry.guideHref] : [])),
          ]);
          const relatedVerified = verified.filter((record) => verifiedHrefSet.has(record.href));
          const checks = isEnglish ? diagnostic.enChecks : diagnostic.zhChecks;
          const errorHref = `${isEnglish ? "/en/screeps-errors" : "/screeps-errors"}#${diagnostic.name.toLowerCase()}`;

          return (
            <article
              key={diagnostic.name}
              id={`diagnostic-${diagnostic.name.toLowerCase()}`}
              className={styles.card}
            >
              <header className={styles.cardHead}>
                <div>
                  <span>{isEnglish ? "return" : "返回值"} {error.value}</span>
                  <h3><code>{diagnostic.name}</code></h3>
                </div>
                <p>{isEnglish ? diagnostic.enSummary : diagnostic.zhSummary}</p>
              </header>

              <div className={styles.checks}>
                <h4>{copy.checkNext}</h4>
                <ol>
                  {checks.map((check) => <li key={check}>{check}</li>)}
                </ol>
              </div>

              <div className={styles.relations}>
                <section>
                  <h4>{copy.api}</h4>
                  <div className={styles.chips}>
                    {relatedApis.map((entry) => (
                      <Link key={entry.id} href={`${apiRootHref}#${entry.id}`}>
                        <code>{entry.signature}</code>
                      </Link>
                    ))}
                  </div>
                </section>

                <section>
                  <h4>{copy.hubs}</h4>
                  <div className={styles.chips}>
                    {relatedHubs.map((hub) => (
                      <Link key={hub.slug} href={getScreepsApiHubHref(hub.slug, locale)}>
                        {hub.objectName}
                      </Link>
                    ))}
                  </div>
                </section>

                <section>
                  <h4>{copy.guides}</h4>
                  <div className={styles.linkStack}>
                    {guides.map((guide) => (
                      <Link key={guide.href} href={guide.href}>{guide.label} →</Link>
                    ))}
                  </div>
                </section>

                <section>
                  <h4>{copy.tools}</h4>
                  <div className={styles.linkStack}>
                    {tools.map((tool) => (
                      <Link key={tool.href} href={tool.href}>{tool.label} →</Link>
                    ))}
                  </div>
                </section>
              </div>

              <footer className={styles.verification}>
                <div>
                  <strong>{copy.verification}</strong>
                  {relatedVerified.length > 0 ? (
                    <span>{relatedVerified.length} {copy.verifiedCount}</span>
                  ) : (
                    <span>{copy.noneVerified}</span>
                  )}
                </div>
                {relatedVerified.length > 0 ? (
                  <div className={styles.verifiedLinks}>
                    {relatedVerified.slice(0, 3).map((record) => (
                      <Link key={record.href} href={record.href}>
                        {record.liveTested ? "LIVE" : "CONSOLE"} · {record.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
                <nav aria-label={copy.verification}>
                  <Link href={verificationHref}>{copy.method}</Link>
                  <Link href={verifiedHref}>{copy.allVerified}</Link>
                  <Link href={errorHref}>{copy.openError}</Link>
                </nav>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
