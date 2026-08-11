import Link from "next/link";

import {
  localizeDiagnosticLink,
  screepsDiagnosticSymptoms,
  type ScreepsDiagnosticLocale,
} from "@/lib/screeps-diagnostic-symptoms";
import {
  getLocalizedErrorDiagnosticLink,
  getScreepsErrorDiagnostic,
} from "@/lib/screeps-error-diagnostics";
import { getLocalizedScreepsApiReference } from "@/lib/screeps-api-reference-localized";
import { getScreepsApiHubHref, screepsApiHubs } from "@/lib/screeps-api-hubs";
import { screepsErrorCodes } from "@/lib/screeps-errors";
import { getVerifiedContentWithEvidence } from "@/lib/verified-content";

import styles from "./screeps-diagnostic-center.module.css";

function uniqueByHref<T extends { href: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

export async function ScreepsDiagnosticCenter({ locale }: { locale: ScreepsDiagnosticLocale }) {
  const isEnglish = locale === "en";
  const apiEntries = getLocalizedScreepsApiReference(locale);
  const verified = await getVerifiedContentWithEvidence(locale);
  const errorMap = new Map(screepsErrorCodes.map((error) => [error.name, error] as const));
  const apiRootHref = isEnglish ? "/en/screeps-api" : "/screeps-api";
  const errorsRootHref = isEnglish ? "/en/screeps-errors" : "/screeps-errors";
  const verificationHref = isEnglish ? "/en/verification" : "/verification";
  const verifiedHref = isEnglish ? "/en/verified" : "/verified";

  const copy = isEnglish
    ? {
        eyebrow: "SYMPTOM-FIRST DIAGNOSTICS",
        title: "Start from what you see in the room",
        body: "You do not need to know the error constant first. Pick the visible symptom, run the quick triage, then continue into return codes, APIs, object hubs, guides, tools, and accepted runtime verification.",
        paths: "symptom paths",
        triage: "Quick triage",
        errors: "Likely return-code branches",
        noError: "No single return code defines this symptom; measure the runtime state directly.",
        apis: "API surfaces",
        hubs: "Object hubs",
        guides: "Focused guides",
        tools: "Useful tools",
        verification: "Runtime verification",
        noVerified: "No related public Console/live verified guide is accepted yet.",
        verifiedCount: "accepted verified guide(s)",
        verificationMethod: "Verification method",
        recentlyVerified: "Recently verified",
        errorReference: "All error codes",
      }
    : {
        eyebrow: "SYMPTOM-FIRST DIAGNOSTICS",
        title: "从你在房间里看到的现象开始",
        body: "不需要先记住错误码。先选择可见症状，执行快速排查，再继续进入返回码、API、对象 Hub、专题教程、工具与已接受 Runtime Verification。",
        paths: "条症状路径",
        triage: "快速排查",
        errors: "可能的返回码分支",
        noError: "这个症状没有单一返回码可以定义，应直接测量运行时状态。",
        apis: "相关 API",
        hubs: "对象 Hub",
        guides: "专题教程",
        tools: "实用工具",
        verification: "Runtime Verification",
        noVerified: "当前还没有与这条症状路径相关的公开 Console / Live 已接受验证文章。",
        verifiedCount: "篇已接受验证文章",
        verificationMethod: "验证方法",
        recentlyVerified: "最近验证",
        errorReference: "全部错误码",
      };

  return (
    <section className={styles.center} aria-labelledby={`diagnostic-center-${locale}`}>
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id={`diagnostic-center-${locale}`}>{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
        <strong>{screepsDiagnosticSymptoms.length} {copy.paths}</strong>
      </header>

      <nav className={styles.index} aria-label={isEnglish ? "Diagnostic symptoms" : "诊断症状索引"}>
        {screepsDiagnosticSymptoms.map((symptom) => (
          <Link href={`#${symptom.id}`} key={symptom.id}>
            {isEnglish ? symptom.enTitle : symptom.zhTitle}
          </Link>
        ))}
      </nav>

      <div className={styles.grid}>
        {screepsDiagnosticSymptoms.map((symptom) => {
          const diagnostics = symptom.errorNames
            .map((name) => getScreepsErrorDiagnostic(name))
            .filter((diagnostic): diagnostic is NonNullable<typeof diagnostic> => Boolean(diagnostic));
          const apiIds = new Set([
            ...(symptom.directApiEntryIds ?? []),
            ...diagnostics.flatMap((diagnostic) => diagnostic.apiEntryIds),
          ]);
          const hubSlugs = new Set([
            ...(symptom.directHubSlugs ?? []),
            ...diagnostics.flatMap((diagnostic) => diagnostic.hubSlugs),
          ]);
          const relatedApis = [...apiIds]
            .map((id) => apiEntries.find((entry) => entry.id === id))
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
          const relatedHubs = [...hubSlugs]
            .map((slug) => screepsApiHubs.find((hub) => hub.slug === slug))
            .filter((hub): hub is NonNullable<typeof hub> => Boolean(hub));
          const guides = uniqueByHref([
            ...diagnostics.flatMap((diagnostic) =>
              diagnostic.guides.map((link) => getLocalizedErrorDiagnosticLink(link, locale)),
            ),
            ...relatedApis.flatMap((entry) => entry.guideHref
              ? [{ label: isEnglish ? `Guide for ${entry.signature}` : `${entry.signature} 对应教程`, href: entry.guideHref }]
              : []),
          ]);
          const tools = uniqueByHref([
            ...(symptom.tools ?? []).map((link) => localizeDiagnosticLink(link, locale)),
            ...diagnostics.flatMap((diagnostic) =>
              diagnostic.tools.map((link) => getLocalizedErrorDiagnosticLink(link, locale)),
            ),
          ]);
          const verificationHrefSet = new Set(guides.map((guide) => guide.href));
          const relatedVerified = verified.filter((record) => verificationHrefSet.has(record.href));
          const triage = isEnglish ? symptom.enTriage : symptom.zhTriage;

          return (
            <article className={styles.card} id={symptom.id} key={symptom.id}>
              <header className={styles.cardHead}>
                <div>
                  <span>{isEnglish ? "SYMPTOM" : "症状"}</span>
                  <h3>{isEnglish ? symptom.enTitle : symptom.zhTitle}</h3>
                </div>
                <p>{isEnglish ? symptom.enSummary : symptom.zhSummary}</p>
              </header>

              <section className={styles.triage}>
                <h4>{copy.triage}</h4>
                <ol>{triage.map((step) => <li key={step}>{step}</li>)}</ol>
              </section>

              <section className={styles.errors}>
                <h4>{copy.errors}</h4>
                {symptom.errorNames.length > 0 ? (
                  <div className={styles.chips}>
                    {symptom.errorNames.map((name) => {
                      const error = errorMap.get(name);
                      const diagnostic = getScreepsErrorDiagnostic(name);
                      const href = `${errorsRootHref}#${diagnostic ? `diagnostic-${name.toLowerCase()}` : name.toLowerCase()}`;
                      return (
                        <Link href={href} key={name}>
                          <code>{name}</code>{error ? <span>{error.value}</span> : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : <p className={styles.muted}>{copy.noError}</p>}
              </section>

              <div className={styles.relations}>
                <section>
                  <h4>{copy.apis}</h4>
                  <div className={styles.chips}>
                    {relatedApis.map((entry) => (
                      <Link href={`${apiRootHref}#${entry.id}`} key={entry.id}><code>{entry.signature}</code></Link>
                    ))}
                  </div>
                </section>

                <section>
                  <h4>{copy.hubs}</h4>
                  <div className={styles.chips}>
                    {relatedHubs.map((hub) => (
                      <Link href={getScreepsApiHubHref(hub.slug, locale)} key={hub.slug}>{hub.objectName}</Link>
                    ))}
                  </div>
                </section>

                <section>
                  <h4>{copy.guides}</h4>
                  <div className={styles.linkStack}>{guides.slice(0, 6).map((guide) => <Link href={guide.href} key={guide.href}>{guide.label} →</Link>)}</div>
                </section>

                <section>
                  <h4>{copy.tools}</h4>
                  <div className={styles.linkStack}>{tools.slice(0, 5).map((tool) => <Link href={tool.href} key={tool.href}>{tool.label} →</Link>)}</div>
                </section>
              </div>

              <footer className={styles.verification}>
                <div>
                  <strong>{copy.verification}</strong>
                  <span>{relatedVerified.length > 0 ? `${relatedVerified.length} ${copy.verifiedCount}` : copy.noVerified}</span>
                </div>
                {relatedVerified.length > 0 ? (
                  <div className={styles.verifiedLinks}>
                    {relatedVerified.slice(0, 3).map((record) => (
                      <Link href={record.href} key={record.href}>{record.liveTested ? "LIVE" : "CONSOLE"} · {record.title}</Link>
                    ))}
                  </div>
                ) : null}
                <nav aria-label={copy.verification}>
                  <Link href={verificationHref}>{copy.verificationMethod}</Link>
                  <Link href={verifiedHref}>{copy.recentlyVerified}</Link>
                  <Link href={errorsRootHref}>{copy.errorReference}</Link>
                </nav>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
