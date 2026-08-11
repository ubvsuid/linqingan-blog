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
import {
  localizeVerificationCoveragePlan,
  verificationCoveragePlans,
  type VerificationCoveragePlan,
} from "@/lib/verification-coverage";
import { getVerifiedContentWithEvidence } from "@/lib/verified-content";

import styles from "./verification-coverage.module.css";

function uniqueByHref<T extends { href: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

function coverageStatus(
  plan: VerificationCoveragePlan,
  records: Awaited<ReturnType<typeof getVerifiedContentWithEvidence>>,
) {
  const hasLive = records.some((record) => record.liveTested);
  const hasConsole = records.some((record) => record.consoleTested);
  const targetMet = plan.targetLevel === "console" ? hasConsole || hasLive : hasLive;

  return {
    hasLive,
    hasConsole,
    targetMet,
    completeness: records.length === 0 ? "unverified" as const : targetMet ? "covered" as const : "partial" as const,
    evidenceLevel: hasLive ? "live-multitick" as const : hasConsole ? "console" as const : "none" as const,
  };
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
        body: "The registry prioritizes what should be proved next. Coverage status is calculated from the same accepted public verification layer used by Diagnostic Center; database records cannot promote an unaccepted guide on their own.",
        total: "planned diagnostic paths",
        p0: "P0 evidence priorities",
        accepted: "accepted related runtime guides",
        legendTitle: "How to read the status",
        legendBody: "Evidence strength and coverage completeness are separate. Console and live multi-tick are evidence levels; partial means some accepted evidence exists but the planned target is not met yet.",
        unverified: "Unverified",
        partial: "Partial",
        covered: "Target covered",
        none: "No accepted runtime evidence",
        console: "Console",
        live: "Live multi-tick",
        target: "Target evidence",
        current: "Current accepted evidence",
        goal: "Coverage goal",
        next: "Next evidence to capture",
        errors: "Primary error branches",
        apis: "Primary API surfaces",
        hubs: "Related object hubs",
        tools: "Useful tools",
        guides: "Related guide surfaces",
        noErrors: "No single return-code branch defines this path.",
        noAccepted: "No related accepted Console/live guide is public yet.",
        openDiagnostic: "Open diagnostic path",
        method: "Verification method",
        archive: "Recently verified",
        acceptedCount: "accepted guide(s)",
      }
    : {
        eyebrow: "VERIFICATION COVERAGE",
        title: "用已接受的运行时证据衡量验证覆盖",
        body: "这份 Registry 只决定“下一步最值得验证什么”。当前覆盖状态仍由 Diagnostic Center 同一套公开 accepted Verification 层计算；数据库记录不能单独把未接受文章提升为已验证。",
        total: "条计划诊断路径",
        p0: "个 P0 证据优先项",
        accepted: "篇相关已接受运行时文章",
        legendTitle: "如何理解状态",
        legendBody: "证据强度与覆盖完整度分开记录。Console / Live multi-tick 是证据等级；Partial 表示已经有部分 accepted 证据，但还没有达到这条路径计划的目标。",
        unverified: "未验证",
        partial: "部分覆盖",
        covered: "目标已覆盖",
        none: "暂无已接受运行时证据",
        console: "Console",
        live: "Live multi-tick",
        target: "目标证据",
        current: "当前 accepted 证据",
        goal: "覆盖目标",
        next: "下一步应采集的证据",
        errors: "主要错误码分支",
        apis: "主要 API",
        hubs: "相关对象 Hub",
        tools: "可用工具",
        guides: "相关教程入口",
        noErrors: "这条路径没有单一错误码可以定义。",
        noAccepted: "当前还没有相关的公开 accepted Console / Live 验证文章。",
        openDiagnostic: "打开诊断路径",
        method: "验证方法",
        archive: "最近验证",
        acceptedCount: "篇已接受文章",
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
    const relatedVerified = verified.filter((record) => guideHrefSet.has(record.href));
    const status = coverageStatus(plan, relatedVerified);
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

    return [{ plan, symptom, localized, guideLinks, relatedVerified, status, apiRelations, hubs, tools }];
  });

  const p0Count = rows.filter((row) => row.plan.priority === "P0").length;
  const acceptedCount = new Set(rows.flatMap((row) => row.relatedVerified.map((record) => record.href))).size;

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
          <strong>{p0Count}<span>{copy.p0}</span></strong>
          <strong>{acceptedCount}<span>{copy.accepted}</span></strong>
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
        {rows.map(({ plan, symptom, localized, guideLinks, relatedVerified, status, apiRelations, hubs, tools }) => {
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
                <div><span>{copy.current}</span><strong>{currentLevel}</strong></div>
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
                        return (
                          <Link href={`${errorsRoot}#diagnostic-${name.toLowerCase()}`} key={name}>
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
                  <strong>{copy.guides}</strong>
                  <span>{guideLinks.length} · {relatedVerified.length} {copy.acceptedCount}</span>
                </div>
                {relatedVerified.length > 0 ? (
                  <div className={styles.linkStack}>
                    {relatedVerified.slice(0, 3).map((record) => (
                      <Link href={record.href} key={record.href}>{record.liveTested ? copy.live : copy.console} · {record.title}</Link>
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
