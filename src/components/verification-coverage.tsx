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
  localizeVerificationCoveragePlan,
  verificationCoveragePlans,
  type VerificationCoveragePlan,
} from "@/lib/verification-coverage";
import {
  getVerifiedContentWithEvidence,
  type VerifiedEvidencePreview,
} from "@/lib/verified-content";

import styles from "./verification-coverage.module.css";

function uniqueByHref<T extends { href: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function evidenceCoversError(evidence: VerifiedEvidencePreview, errorName: string) {
  const raw = evidence.returnCode?.trim();
  if (!raw) return false;
  if (raw.toUpperCase() === errorName.toUpperCase()) return true;

  const error = screepsErrorCodes.find((candidate) => candidate.name === errorName);
  const numeric = Number(raw);
  return Boolean(error && Number.isInteger(numeric) && numeric === error.value);
}

function coverageStatus(
  plan: VerificationCoveragePlan,
  evidence: readonly VerifiedEvidencePreview[],
) {
  const hasLive = evidence.some((record) => record.type === "live");
  const hasConsole = evidence.some((record) => record.type === "console");
  const targetLevelMet = plan.targetLevel === "console" ? hasConsole || hasLive : hasLive;
  const coveredErrorNames = plan.primaryErrorNames.filter((name) =>
    evidence.some((record) => evidenceCoversError(record, name)),
  );
  const errorBranchesMet = plan.primaryErrorNames.length === 0 || coveredErrorNames.length === plan.primaryErrorNames.length;
  const targetMet = targetLevelMet && errorBranchesMet;

  return {
    hasLive,
    hasConsole,
    targetMet,
    targetLevelMet,
    coveredErrorNames,
    completeness: evidence.length === 0 ? "unverified" as const : targetMet ? "covered" as const : "partial" as const,
    evidenceLevel: hasLive ? "live-multitick" as const : hasConsole ? "console" as const : "none" as const,
  };
}

function formatEvidence(evidence: VerifiedEvidencePreview, isEnglish: boolean) {
  const parts = [
    evidence.type === "live" ? "LIVE" : "CONSOLE",
    evidence.apiName,
  ];
  if (evidence.returnCode) parts.push(isEnglish ? `return ${evidence.returnCode}` : `返回 ${evidence.returnCode}`);
  parts.push(evidence.verifiedAt.slice(0, 10));
  return parts.join(" · ");
}

export async function VerificationCoverage({ locale }: { locale: ScreepsDiagnosticLocale }) {
  const isEnglish = locale === "en";
  const verified = await getVerifiedContentWithEvidence(locale);
  const apiEntries = getLocalizedScreepsApiReference(locale);
  const errorMap = new Map(screepsErrorCodes.map((error) => [error.name, error] as const));
  const diagnosticsRoot = isEnglish ? "/en/diagnostics" : "/diagnostics";
  const errorsRoot = isEnglish ? "/en/screeps-errors" : "/screeps-errors";
  const verificationRoot = isEnglish ? "/en/verification" : "/verification";
  const verifiedRoot = isEnglish ? "/en/verified" : "/verified";

  const copy = isEnglish
    ? {
        eyebrow: "VERIFICATION COVERAGE",
        title: "Coverage is measured against accepted runtime evidence",
        body: "The registry prioritizes what should be proved next. Current coverage is calculated from structured Runtime Evidence that survives the same accepted + Markdown-accepted public boundary as Diagnostic Center, then matched to each path by canonical API identity.",
        total: "planned diagnostic paths",
        evidenced: "paths with accepted evidence",
        evidenceRecords: "structured accepted evidence records",
        legendTitle: "How to read the status",
        legendBody: "Evidence strength and coverage completeness are separate. A path is only target-covered when the planned evidence level is present and all planned primary return-code branches are represented; otherwise accepted evidence remains Partial.",
        unverified: "Unverified",
        partial: "Partial",
        covered: "Target covered",
        none: "No accepted runtime evidence",
        console: "Console",
        live: "Live multi-tick",
        target: "Target evidence",
        current: "Current accepted evidence",
        returnBranches: "return-code branches",
        goal: "Coverage goal",
        next: "Next evidence to capture",
        errors: "Primary error branches",
        apis: "Primary API surfaces",
        hubs: "Related object hubs",
        tools: "Useful tools",
        noErrors: "No single return-code branch defines this path.",
        noAccepted: "No matching structured accepted Runtime Evidence is public for the primary APIs yet.",
        acceptedGuideCount: "accepted guide(s)",
        acceptedEvidenceCount: "evidence record(s)",
        openDiagnostic: "Open diagnostic path",
        method: "Verification method",
        archive: "Runtime Evidence Hub",
      }
    : {
        eyebrow: "VERIFICATION COVERAGE",
        title: "用已接受的运行时证据衡量验证覆盖",
        body: "这份 Registry 只决定“下一步最值得验证什么”。当前覆盖由与 Diagnostic Center 相同的 accepted + Markdown accepted 公共边界筛出的结构化 Runtime Evidence 计算，再按 canonical API identity 关联到每条症状路径。",
        total: "条计划诊断路径",
        evidenced: "条已有 accepted Evidence 路径",
        evidenceRecords: "条结构化 accepted Evidence",
        legendTitle: "如何理解状态",
        legendBody: "证据强度与覆盖完整度分开记录。只有达到计划证据等级，并覆盖计划中的主要返回码分支，才标记为“目标已覆盖”；已有 accepted Evidence 但仍有缺口时保持“部分覆盖”。",
        unverified: "未验证",
        partial: "部分覆盖",
        covered: "目标已覆盖",
        none: "暂无已接受运行时证据",
        console: "Console",
        live: "Live multi-tick",
        target: "目标证据",
        current: "当前 accepted 证据",
        returnBranches: "个返回码分支",
        goal: "覆盖目标",
        next: "下一步应采集的证据",
        errors: "主要错误码分支",
        apis: "主要 API",
        hubs: "相关对象 Hub",
        tools: "可用工具",
        noErrors: "这条路径没有单一错误码可以定义。",
        noAccepted: "当前主要 API 还没有可匹配的公开结构化 accepted Runtime Evidence。",
        acceptedGuideCount: "篇已接受文章",
        acceptedEvidenceCount: "条 Evidence",
        openDiagnostic: "打开诊断路径",
        method: "验证方法",
        archive: "Runtime Evidence Hub",
      };

  const rows = verificationCoveragePlans.flatMap((plan) => {
    const symptom = screepsDiagnosticSymptoms.find((item) => item.id === plan.symptomId);
    if (!symptom) return [];

    const diagnostics = symptom.errorNames
      .map((name) => getScreepsErrorDiagnostic(name))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const guideLinks = uniqueByHref([
      ...diagnostics.flatMap((diagnostic) =>
        diagnostic.guides.map((link) => getLocalizedErrorDiagnosticLink(link, locale)),
      ),
      ...plan.primaryApiEntryIds.flatMap((id) => {
        const entry = apiEntries.find((candidate) => candidate.id === id);
        return entry?.guideHref
          ? [{ href: entry.guideHref, label: isEnglish ? `Guide for ${entry.signature}` : `${entry.signature} 对应教程` }]
          : [];
      }),
    ]);
    const guideHrefSet = new Set(guideLinks.map((link) => link.href));
    const primaryApiIdSet = new Set(plan.primaryApiEntryIds);
    const relatedVerified = verified.filter((record) =>
      guideHrefSet.has(record.href) ||
      record.evidence.some((evidence) => {
        const apiId = getEvidenceApiReferenceId(evidence.apiName);
        return apiId ? primaryApiIdSet.has(apiId) : false;
      }),
    );
    const relatedEvidence = relatedVerified.flatMap((record) =>
      record.evidence.flatMap((evidence) => {
        const apiId = getEvidenceApiReferenceId(evidence.apiName);
        return apiId && primaryApiIdSet.has(apiId)
          ? [{ recordHref: record.href, recordTitle: record.title, evidence }]
          : [];
      }),
    );
    const status = coverageStatus(plan, relatedEvidence.map((item) => item.evidence));
    const localized = localizeVerificationCoveragePlan(plan, locale);
    const apiRelations = plan.primaryApiEntryIds
      .map((id) => apiEntries.find((entry) => entry.id === id))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    const hubSlugs = new Set([
      ...(symptom.directHubSlugs ?? []),
      ...diagnostics.flatMap((diagnostic) => diagnostic.hubSlugs),
    ]);
    const hubs = [...hubSlugs]
      .map((slug) => screepsApiHubs.find((hub) => hub.slug === slug))
      .filter((hub): hub is NonNullable<typeof hub> => Boolean(hub));
    const tools = uniqueByHref([
      ...(symptom.tools ?? []).map((link) => localizeDiagnosticLink(link, locale)),
      ...diagnostics.flatMap((diagnostic) =>
        diagnostic.tools.map((link) => getLocalizedErrorDiagnosticLink(link, locale)),
      ),
    ]);

    return [{ plan, symptom, localized, relatedVerified, relatedEvidence, status, apiRelations, hubs, tools }];
  });

  const evidencedPathCount = rows.filter((row) => row.relatedEvidence.length > 0).length;
  const acceptedEvidenceCount = new Set(
    rows.flatMap((row) => row.relatedEvidence.map((item) => item.evidence.evidenceKey)),
  ).size;

  return (
    <section className={styles.coverage} aria-labelledby={`verification-coverage-${locale}`}>
      <header className={styles.intro}>
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id={`verification-coverage-${locale}`}>{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
        <div className={styles.summary} aria-label={isEnglish ? "Coverage summary" : "覆盖摘要"}>
          <strong>{rows.length}<span>{copy.total}</span></strong>
          <strong>{evidencedPathCount}<span>{copy.evidenced}</span></strong>
          <strong>{acceptedEvidenceCount}<span>{copy.evidenceRecords}</span></strong>
        </div>
      </header>

      <aside className={styles.legend}>
        <div><strong>{copy.legendTitle}</strong><p>{copy.legendBody}</p></div>
        <div className={styles.legendItems}>
          <span data-state="unverified">{copy.unverified}</span>
          <span data-state="partial">{copy.partial}</span>
          <span data-state="covered">{copy.covered}</span>
        </div>
      </aside>

      <div className={styles.grid}>
        {rows.map(({ plan, symptom, localized, relatedVerified, relatedEvidence, status, apiRelations, hubs, tools }) => {
          const title = isEnglish ? symptom.enTitle : symptom.zhTitle;
          const completenessLabel = status.completeness === "covered"
            ? copy.covered
            : status.completeness === "partial"
              ? copy.partial
              : copy.unverified;
          const currentLevel = status.evidenceLevel === "live-multitick"
            ? copy.live
            : status.evidenceLevel === "console"
              ? copy.console
              : copy.none;
          const targetLevel = plan.targetLevel === "live-multitick" ? copy.live : copy.console;
          const branchCoverage = plan.primaryErrorNames.length > 0
            ? `${status.coveredErrorNames.length}/${plan.primaryErrorNames.length} ${copy.returnBranches}`
            : null;

          return (
            <article className={styles.card} id={`coverage-${plan.symptomId}`} key={plan.symptomId}>
              <header className={styles.cardHead}>
                <div>
                  <span className={styles.priority}>{plan.priority}</span>
                  <h3>{title}</h3>
                </div>
                <span className={styles.status} data-state={status.completeness}>{completenessLabel}</span>
              </header>

              <div className={styles.levels}>
                <div><span>{copy.target}</span><strong>{targetLevel}</strong></div>
                <div><span>{copy.current}</span><strong>{currentLevel}{branchCoverage ? ` · ${branchCoverage}` : ""}</strong></div>
              </div>

              <section className={styles.plan}>
                <div><h4>{copy.goal}</h4><p>{localized.goal}</p></div>
                <div><h4>{copy.next}</h4><p>{localized.nextEvidence}</p></div>
              </section>

              <div className={styles.relations}>
                <section>
                  <h4>{copy.errors}</h4>
                  {plan.primaryErrorNames.length > 0 ? (
                    <div className={styles.chips}>
                      {plan.primaryErrorNames.map((name) => {
                        const error = errorMap.get(name);
                        const diagnostic = getScreepsErrorDiagnostic(name);
                        const href = `${errorsRoot}#${diagnostic ? `diagnostic-${name.toLowerCase()}` : name.toLowerCase()}`;
                        return (
                          <Link href={href} key={name}>
                            <code>{name}</code>{error ? <span>{error.value}</span> : null}
                          </Link>
                        );
                      })}
                    </div>
                  ) : <p className={styles.muted}>{copy.noErrors}</p>}
                </section>

                <section>
                  <h4>{copy.apis}</h4>
                  <div className={styles.chips}>
                    {apiRelations.map((entry) => (
                      <Link href={`${isEnglish ? "/en" : ""}/screeps-api#${entry.id}`} key={entry.id}>
                        <code>{entry.signature}</code>
                      </Link>
                    ))}
                  </div>
                </section>

                <section>
                  <h4>{copy.hubs}</h4>
                  <div className={styles.chips}>
                    {hubs.slice(0, 5).map((hub) => (
                      <Link href={getScreepsApiHubHref(hub.slug, locale)} key={hub.slug}>{hub.objectName}</Link>
                    ))}
                  </div>
                </section>

                <section>
                  <h4>{copy.tools}</h4>
                  <div className={styles.linkStack}>
                    {tools.slice(0, 4).map((tool) => <Link href={tool.href} key={tool.href}>{tool.label} →</Link>)}
                  </div>
                </section>
              </div>

              <footer className={styles.evidence}>
                <div>
                  <strong>{copy.current}</strong>
                  <span>{relatedVerified.length} {copy.acceptedGuideCount} · {relatedEvidence.length} {copy.acceptedEvidenceCount}</span>
                </div>
                {relatedEvidence.length > 0 ? (
                  <div className={styles.linkStack}>
                    {relatedEvidence.slice(0, 6).map(({ recordHref, recordTitle, evidence }) => (
                      <Link href={recordHref} key={evidence.evidenceKey} title={recordTitle}>
                        {formatEvidence(evidence, isEnglish)}
                      </Link>
                    ))}
                  </div>
                ) : <p className={styles.muted}>{copy.noAccepted}</p>}
                <nav aria-label={isEnglish ? `Verification links for ${title}` : `${title} 验证链接`}>
                  <Link href={`${diagnosticsRoot}#${plan.symptomId}`}>{copy.openDiagnostic}</Link>
                  <Link href={verificationRoot}>{copy.method}</Link>
                  <Link href={verifiedRoot}>{copy.archive}</Link>
                </nav>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
