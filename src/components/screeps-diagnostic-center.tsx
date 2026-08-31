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
import { getEvidenceApiReferenceId } from "@/lib/verification-evidence-relations";
import {
  getVerifiedContentWithEvidence,
  type VerifiedEvidencePreview,
} from "@/lib/verified-content";

import styles from "./screeps-diagnostic-center.module.css";

function uniqueByHref<T extends { href: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function uniqueStrings(items: readonly string[]): string[] {
  return [...new Set(items)];
}

function formatRuntimeEvidence(
  evidence: VerifiedEvidencePreview,
  isEnglish: boolean,
): string {
  const parts = [
    evidence.type === "live" ? "LIVE" : "CONSOLE",
    evidence.apiName,
  ];
  if (evidence.returnCode) {
    parts.push(isEnglish ? `return ${evidence.returnCode}` : `返回 ${evidence.returnCode}`);
  }
  if (evidence.shard) parts.push(evidence.shard);
  if (evidence.roomName) parts.push(evidence.roomName);
  parts.push(evidence.verifiedAt.slice(0, 10));
  return parts.join(" · ");
}

export async function ScreepsDiagnosticCenter({ locale }: { locale: ScreepsDiagnosticLocale }) {
  const isEnglish = locale === "en";
  const apiEntries = getLocalizedScreepsApiReference(locale);
  const verified = await getVerifiedContentWithEvidence(locale);
  const errorMap = new Map(screepsErrorCodes.map((error) => [error.name, error] as const));
  const apiRootHref = isEnglish ? "/en/screeps-api" : "/screeps-api";
  const errorsRootHref = isEnglish ? "/en/screeps-errors" : "/screeps-errors";
  const searchRootHref = isEnglish ? "/en/search" : "/search";
  const verificationHref = isEnglish ? "/en/verification" : "/verification";
  const coverageHref = isEnglish ? "/en/verification/coverage" : "/verification/coverage";
  const verifiedHref = isEnglish ? "/en/verified" : "/verified";

  const copy = isEnglish
    ? {
        eyebrow: "SYMPTOM-FIRST DIAGNOSTICS",
        title: "Start from what you see in the room",
        body: "You do not need to know the error constant first. Pick the visible symptom, run the quick triage, then continue through return codes, APIs, focused guides, tools, and accepted Runtime Evidence as one problem-solving path.",
        paths: "symptom paths",
        triage: "Quick triage",
        errors: "Most likely return-code branches",
        moreErrors: "More possible return codes",
        noError: "No single return code defines this symptom; measure the runtime state directly.",
        apis: "Primary API surfaces",
        moreApis: "More related APIs",
        hubs: "Primary object hubs",
        moreHubs: "More related object hubs",
        guides: "Focused guides",
        tools: "Useful tools",
        verification: "Accepted Runtime Evidence",
        noVerified: "No related public Console/live verified guide is accepted yet.",
        verifiedCount: "accepted verified guide(s)",
        evidenceDetail: "Evidence detail",
        searchProblem: "Search this symptom",
        verificationMethod: "Verification method",
        coverage: "Verification coverage",
        recentlyVerified: "Runtime Evidence Hub",
        errorReference: "All error codes",
      }
    : {
        eyebrow: "SYMPTOM-FIRST DIAGNOSTICS",
        title: "从你在房间里看到的现象开始",
        body: "不需要先记住错误码。先选择可见症状，执行快速排查，再沿着“返回码 → API → 教程/工具 → accepted Runtime Evidence”完成同一条问题解决路径；次要关系按需展开。",
        paths: "条症状路径",
        triage: "快速排查",
        errors: "最可能的返回码",
        moreErrors: "更多可能的返回码",
        noError: "这个症状没有单一返回码可以定义，应直接测量运行时状态。",
        apis: "主要 API",
        moreApis: "更多相关 API",
        hubs: "主要对象 Hub",
        moreHubs: "更多相关对象 Hub",
        guides: "专题教程",
        tools: "实用工具",
        verification: "已接受 Runtime Evidence",
        noVerified: "当前还没有与这条症状路径相关的公开 Console / Live 已接受验证文章。",
        verifiedCount: "篇已接受验证文章",
        evidenceDetail: "证据细节",
        searchProblem: "搜索这个症状",
        verificationMethod: "验证方法",
        coverage: "验证覆盖",
        recentlyVerified: "Runtime Evidence Hub",
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

          const directApiIds = uniqueStrings(symptom.directApiEntryIds ?? []);
          const directApiIdSet = new Set(directApiIds);
          const diagnosticApiIds = uniqueStrings(diagnostics.flatMap((diagnostic) => diagnostic.apiEntryIds));
          const primaryApiIds = directApiIds.length > 0 ? directApiIds.slice(0, 4) : diagnosticApiIds.slice(0, 3);
          const primaryApiIdSet = new Set(primaryApiIds);
          const secondaryApiIds = uniqueStrings([
            ...directApiIds.slice(primaryApiIds.length),
            ...diagnosticApiIds,
          ]).filter((id) => !primaryApiIdSet.has(id)).slice(0, 3);

          const primaryApis = primaryApiIds
            .map((id) => apiEntries.find((entry) => entry.id === id))
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
          const secondaryApis = secondaryApiIds
            .map((id) => apiEntries.find((entry) => entry.id === id))
            .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

          const directHubSlugs = uniqueStrings(symptom.directHubSlugs ?? []);
          const diagnosticHubSlugs = uniqueStrings(diagnostics.flatMap((diagnostic) => diagnostic.hubSlugs));
          const primaryHubSlugs = directHubSlugs.length > 0 ? directHubSlugs.slice(0, 3) : diagnosticHubSlugs.slice(0, 2);
          const primaryHubSlugSet = new Set(primaryHubSlugs);
          const secondaryHubSlugs = uniqueStrings([
            ...directHubSlugs.slice(primaryHubSlugs.length),
            ...diagnosticHubSlugs,
          ]).filter((slug) => !primaryHubSlugSet.has(slug)).slice(0, 2);

          const primaryHubs = primaryHubSlugs
            .map((slug) => screepsApiHubs.find((hub) => hub.slug === slug))
            .filter((hub): hub is NonNullable<typeof hub> => Boolean(hub));
          const secondaryHubs = secondaryHubSlugs
            .map((slug) => screepsApiHubs.find((hub) => hub.slug === slug))
            .filter((hub): hub is NonNullable<typeof hub> => Boolean(hub));

          const symptomGuides = ("guides" in symptom ? symptom.guides : []).map((link) => localizeDiagnosticLink(link, locale));
          const primaryApiGuides = primaryApis.flatMap((entry) =>
            entry.guideHref
              ? [{ label: isEnglish ? `Guide for ${entry.signature}` : `${entry.signature} 对应教程`, href: entry.guideHref }]
              : [],
          );
          const diagnosticGuides = diagnostics.flatMap((diagnostic) =>
            diagnostic.guides.map((link) => getLocalizedErrorDiagnosticLink(link, locale)),
          );
          const secondaryApiGuides = secondaryApis.flatMap((entry) =>
            entry.guideHref
              ? [{ label: isEnglish ? `Guide for ${entry.signature}` : `${entry.signature} 对应教程`, href: entry.guideHref }]
              : [],
          );
          const guides = uniqueByHref([
            ...symptomGuides,
            ...primaryApiGuides,
            ...diagnosticGuides,
            ...secondaryApiGuides,
          ]).slice(0, 4);

          const tools = uniqueByHref([
            ...(symptom.tools ?? []).map((link) => localizeDiagnosticLink(link, locale)),
            ...diagnostics.flatMap((diagnostic) =>
              diagnostic.tools.map((link) => getLocalizedErrorDiagnosticLink(link, locale)),
            ),
          ]).slice(0, 3);

          const primaryErrorNames = symptom.errorNames.slice(0, 3);
          const secondaryErrorNames = symptom.errorNames.slice(3, 5);
          const verificationHrefSet = new Set(guides.map((guide) => guide.href));
          const relatedVerified = verified.filter((record) =>
            verificationHrefSet.has(record.href) ||
            record.evidence.some((evidence) => {
              const evidenceApiId = getEvidenceApiReferenceId(evidence.apiName);
              return evidenceApiId ? directApiIdSet.has(evidenceApiId) : false;
            }),
          );
          const triage = isEnglish ? symptom.enTriage : symptom.zhTriage;
          const symptomTitle = isEnglish ? symptom.enTitle : symptom.zhTitle;
          const symptomSearchHref = `${searchRootHref}?q=${encodeURIComponent(symptomTitle)}`;

          const renderErrorLink = (name: string) => {
            const error = errorMap.get(name);
            const diagnostic = getScreepsErrorDiagnostic(name);
            const href = `${errorsRootHref}#${diagnostic ? `diagnostic-${name.toLowerCase()}` : name.toLowerCase()}`;
            return (
              <Link href={href} key={name}>
                <code>{name}</code>{error ? <span>{error.value}</span> : null}
              </Link>
            );
          };

          return (
            <article className={styles.card} id={symptom.id} key={symptom.id}>
              <header className={styles.cardHead}>
                <div>
                  <span>{isEnglish ? "SYMPTOM" : "症状"}</span>
                  <h3>{symptomTitle}</h3>
                </div>
                <p>{isEnglish ? symptom.enSummary : symptom.zhSummary}</p>
              </header>

              <section className={styles.triage}>
                <h4>{copy.triage}</h4>
                <ol>{triage.map((step) => <li key={step}>{step}</li>)}</ol>
              </section>

              <section className={styles.errors}>
                <h4>{copy.errors}</h4>
                {primaryErrorNames.length > 0 ? (
                  <>
                    <div className={styles.chips}>{primaryErrorNames.map(renderErrorLink)}</div>
                    {secondaryErrorNames.length > 0 ? (
                      <details className={styles.moreRelations}>
                        <summary>{copy.moreErrors}</summary>
                        <div className={styles.chips}>{secondaryErrorNames.map(renderErrorLink)}</div>
                      </details>
                    ) : null}
                  </>
                ) : <p className={styles.muted}>{copy.noError}</p>}
              </section>

              <div className={styles.relations}>
                <section>
                  <h4>{copy.apis}</h4>
                  <div className={styles.chips}>
                    {primaryApis.map((entry) => (
                      <Link href={`${apiRootHref}#${entry.id}`} key={entry.id}><code>{entry.signature}</code></Link>
                    ))}
                  </div>
                  {secondaryApis.length > 0 ? (
                    <details className={styles.moreRelations}>
                      <summary>{copy.moreApis}</summary>
                      <div className={styles.chips}>
                        {secondaryApis.map((entry) => (
                          <Link href={`${apiRootHref}#${entry.id}`} key={entry.id}><code>{entry.signature}</code></Link>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </section>

                <section>
                  <h4>{copy.hubs}</h4>
                  <div className={styles.chips}>
                    {primaryHubs.map((hub) => (
                      <Link href={getScreepsApiHubHref(hub.slug, locale)} key={hub.slug}>{hub.objectName}</Link>
                    ))}
                  </div>
                  {secondaryHubs.length > 0 ? (
                    <details className={styles.moreRelations}>
                      <summary>{copy.moreHubs}</summary>
                      <div className={styles.chips}>
                        {secondaryHubs.map((hub) => (
                          <Link href={getScreepsApiHubHref(hub.slug, locale)} key={hub.slug}>{hub.objectName}</Link>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </section>

                <section>
                  <h4>{copy.guides}</h4>
                  <div className={styles.linkStack}>{guides.map((guide) => <Link href={guide.href} key={guide.href}>{guide.label} →</Link>)}</div>
                </section>

                <section>
                  <h4>{copy.tools}</h4>
                  <div className={styles.linkStack}>{tools.map((tool) => <Link href={tool.href} key={tool.href}>{tool.label} →</Link>)}</div>
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
                      <div key={record.href}>
                        <Link href={record.href}>{record.liveTested ? "LIVE" : "CONSOLE"} · {record.title}</Link>
                        {record.evidence.slice(0, 2).map((evidence) => (
                          <span key={evidence.evidenceKey}>
                            {formatRuntimeEvidence(evidence, isEnglish)}{evidence.note ? ` · ${evidence.note}` : ""}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
                <nav aria-label={copy.verification}>
                  <Link href={symptomSearchHref}>{copy.searchProblem}</Link>
                  <Link href={verificationHref}>{copy.verificationMethod}</Link>
                  <Link href={`${coverageHref}#coverage-${symptom.id}`}>{copy.coverage}</Link>
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
