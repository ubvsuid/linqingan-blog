import Link from "next/link";

import {
  screepsDiagnosticSymptoms,
  type ScreepsDiagnosticLocale,
} from "@/lib/screeps-diagnostic-symptoms";
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

import styles from "./verification-capture-queue.module.css";

function evidenceCoversError(evidence: VerifiedEvidencePreview, errorName: string) {
  const raw = evidence.returnCode?.trim();
  if (!raw) return false;
  if (raw.toUpperCase() === errorName.toUpperCase()) return true;

  const error = screepsErrorCodes.find((candidate) => candidate.name === errorName);
  const numeric = Number(raw);
  return Boolean(error && Number.isInteger(numeric) && numeric === error.value);
}

function getCoverageStatus(
  plan: VerificationCoveragePlan,
  evidence: readonly VerifiedEvidencePreview[],
) {
  const hasLive = evidence.some((record) => record.type === "live");
  const hasConsole = evidence.some((record) => record.type === "console");
  const targetLevelMet = plan.targetLevel === "console" ? hasConsole || hasLive : hasLive;
  const coveredErrorNames = plan.primaryErrorNames.filter((name) =>
    evidence.some((record) => evidenceCoversError(record, name)),
  );
  const errorBranchesMet =
    plan.primaryErrorNames.length === 0 || coveredErrorNames.length === plan.primaryErrorNames.length;
  const targetMet = targetLevelMet && errorBranchesMet;

  return {
    targetMet,
    targetLevelMet,
    coveredErrorNames,
    completeness: evidence.length === 0 ? "unverified" as const : targetMet ? "covered" as const : "partial" as const,
    evidenceCount: evidence.length,
  };
}

function completenessRank(value: "unverified" | "partial" | "covered") {
  if (value === "partial") return 0;
  if (value === "unverified") return 1;
  return 2;
}

export async function VerificationCaptureQueue({ locale }: { locale: ScreepsDiagnosticLocale }) {
  const isEnglish = locale === "en";
  const verified = await getVerifiedContentWithEvidence(locale);
  const allEvidence = verified.flatMap((record) => record.evidence);
  const diagnosticsRoot = isEnglish ? "/en/diagnostics" : "/diagnostics";

  const copy = isEnglish
    ? {
        eyebrow: "NEXT CAPTURE QUEUE",
        title: "Turn evidence gaps into the next five capture jobs",
        body: "This queue is derived from the same accepted + Markdown-accepted Runtime Evidence boundary used by Coverage. Target-covered paths drop out automatically. Within each priority, Partial paths come first, then Unverified paths keep registry order. The queue prioritizes capture work only; it never creates or accepts Evidence.",
        open: "open capture targets",
        target: "Target",
        missing: "Still missing",
        current: "Current",
        next: "Capture next",
        view: "View full coverage path",
        diagnostic: "Open diagnostic path",
        console: "Console",
        live: "Live multi-tick",
        partial: "Partial",
        unverified: "Unverified",
        levelGap: "target evidence level",
        noBranchGap: "Evidence-level target remains",
        evidenceRecords: "accepted record(s)",
        complete: "All planned paths currently meet their target coverage.",
      }
    : {
        eyebrow: "NEXT CAPTURE QUEUE",
        title: "把证据缺口排成下一批 5 个采集任务",
        body: "队列直接使用 Coverage 相同的 accepted + Markdown accepted Runtime Evidence 公共边界计算。达到目标的路径自动退出；同一优先级内先补 Partial，再按 Registry 原顺序处理 Unverified。队列只负责安排采集工作，不会自行创建或接受 Evidence。",
        open: "个待采集目标",
        target: "目标",
        missing: "仍缺",
        current: "当前",
        next: "下一步采集",
        view: "查看完整覆盖路径",
        diagnostic: "打开诊断路径",
        console: "Console",
        live: "Live multi-tick",
        partial: "部分覆盖",
        unverified: "未验证",
        levelGap: "目标证据等级",
        noBranchGap: "仅剩证据等级目标未满足",
        evidenceRecords: "条 accepted Evidence",
        complete: "当前所有计划路径都已达到目标覆盖。",
      };

  const rows = verificationCoveragePlans.flatMap((plan, registryIndex) => {
    const symptom = screepsDiagnosticSymptoms.find((item) => item.id === plan.symptomId);
    if (!symptom) return [];
    const primaryApiIds = new Set(plan.primaryApiEntryIds);
    const evidence = allEvidence.filter((record) => {
      const apiId = getEvidenceApiReferenceId(record.apiName);
      return apiId ? primaryApiIds.has(apiId) : false;
    });
    const status = getCoverageStatus(plan, evidence);
    return [{ plan, symptom, status, registryIndex, localized: localizeVerificationCoveragePlan(plan, locale) }];
  });

  const openRows = rows
    .filter((row) => !row.status.targetMet)
    .sort((left, right) => {
      const priorityRank = (left.plan.priority === "P0" ? 0 : 1) - (right.plan.priority === "P0" ? 0 : 1);
      if (priorityRank !== 0) return priorityRank;
      const completeness = completenessRank(left.status.completeness) - completenessRank(right.status.completeness);
      if (completeness !== 0) return completeness;
      return left.registryIndex - right.registryIndex;
    });
  const captureQueue = openRows.slice(0, 5);

  return (
    <section className={styles.queue} aria-labelledby={`verification-capture-queue-${locale}`}>
      <header className={styles.header}>
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id={`verification-capture-queue-${locale}`}>{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
        <strong className={styles.count}>{openRows.length}<span>{copy.open}</span></strong>
      </header>

      {captureQueue.length > 0 ? (
        <div className={styles.list}>
          {captureQueue.map(({ plan, symptom, status, localized }, index) => {
            const title = isEnglish ? symptom.enTitle : symptom.zhTitle;
            const targetLevel = plan.targetLevel === "live-multitick" ? copy.live : copy.console;
            const missingErrorNames = plan.primaryErrorNames.filter(
              (name) => !status.coveredErrorNames.includes(name),
            );
            const missingParts = [
              ...(!status.targetLevelMet ? [copy.levelGap] : []),
              ...missingErrorNames,
            ];
            const missingLabel = missingParts.length > 0 ? missingParts.join(" · ") : copy.noBranchGap;
            const completenessLabel = status.completeness === "partial" ? copy.partial : copy.unverified;

            return (
              <article className={styles.item} key={plan.symptomId}>
                <div className={styles.rank}>#{index + 1}</div>
                <div className={styles.body}>
                  <header className={styles.itemHeader}>
                    <div>
                      <span className={styles.priority}>{plan.priority}</span>
                      <h3>{title}</h3>
                    </div>
                    <span className={styles.status} data-state={status.completeness}>{completenessLabel}</span>
                  </header>
                  <div className={styles.meta}>
                    <span><strong>{copy.target}</strong>{targetLevel}</span>
                    <span><strong>{copy.current}</strong>{status.evidenceCount} {copy.evidenceRecords}</span>
                    <span><strong>{copy.missing}</strong>{missingLabel}</span>
                  </div>
                  <p><strong>{copy.next}</strong>{localized.nextEvidence}</p>
                  <nav className={styles.links} aria-label={isEnglish ? `Capture links for ${title}` : `${title} 采集链接`}>
                    <Link href={`#coverage-${plan.symptomId}`}>{copy.view}</Link>
                    <Link href={`${diagnosticsRoot}#${plan.symptomId}`}>{copy.diagnostic}</Link>
                  </nav>
                </div>
              </article>
            );
          })}
        </div>
      ) : <p className={styles.complete}>{copy.complete}</p>}
    </section>
  );
}
