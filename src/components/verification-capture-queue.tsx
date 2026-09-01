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

const spawnCaptureRecipes = [
  {
    errorName: "ERR_INVALID_ARGS",
    enTitle: "Invalid body · dryRun only",
    zhTitle: "非法 body · 仅 dryRun",
    enGuard: "Use an idle, active owned Spawn. The empty body is intentionally invalid. The snippet keeps nothing unless the observed code is exactly ERR_INVALID_ARGS (-10).",
    zhGuard: "使用空闲、active 且属于自己的 Spawn。空 body 是刻意制造的无效参数；只有真实返回值严格等于 ERR_INVALID_ARGS (-10) 时才保留采集结果。",
    code: `var spawn = Object.values(Game.spawns).find(function (item) {
  return item.my && item.isActive() && !item.spawning;
});
if (!spawn) throw new Error("Need an idle active owned Spawn; skip this branch for now.");

var name = "LQInvalid_" + Game.time;
var before = EvidenceCapture.snapshot({ spawn: spawn, room: spawn.room });
before.probe = {
  branch: "ERR_INVALID_ARGS",
  name: name,
  body: [],
  dryRun: true,
  spawnActive: spawn.isActive(),
  spawnBusy: Boolean(spawn.spawning)
};

var rc = spawn.spawnCreep([], name, { dryRun: true });
if (rc !== ERR_INVALID_ARGS) {
  throw new Error("Unexpected return code " + rc + "; discard this capture.");
}

var after = EvidenceCapture.snapshot({ spawn: spawn, room: spawn.room });
EvidenceCapture.captureConsole({
  articleSlug: "screeps-spawn-create-creep",
  language: "zh-CN",
  roomName: spawn.room.name,
  apiName: "StructureSpawn.spawnCreep",
  returnCode: rc,
  beforeState: before,
  afterState: after,
  evidenceNote: "Explicit dryRun with an empty body returned ERR_INVALID_ARGS (-10); no spawn intent was submitted.",
  label: "SPAWN-INVALID-ARGS"
});`,
  },
  {
    errorName: "ERR_BUSY",
    enTitle: "Naturally busy Spawn · dryRun only",
    zhTitle: "自然忙碌 Spawn · 仅 dryRun",
    enGuard: "Wait for a Spawn that is already spawning through normal colony activity. Do not start or cancel a Creep just to manufacture this branch. The snippet is dryRun-only and fails closed unless it observes ERR_BUSY (-4).",
    zhGuard: "只等待正常房间运行中已经处于 spawning 的 Spawn；不要为了制造该分支额外开始或取消 Creep。代码只执行 dryRun，并在不是 ERR_BUSY (-4) 时直接失败丢弃。",
    code: `var spawn = Object.values(Game.spawns).find(function (item) {
  return item.my && item.isActive() && Boolean(item.spawning);
});
if (!spawn) throw new Error("No naturally busy owned Spawn; skip this branch for now.");

var name = "LQBusy_" + Game.time;
var body = [MOVE];
var before = EvidenceCapture.snapshot({ spawn: spawn, room: spawn.room });
before.probe = {
  branch: "ERR_BUSY",
  name: name,
  body: body,
  dryRun: true,
  spawnActive: spawn.isActive(),
  spawnBusy: Boolean(spawn.spawning),
  spawningName: spawn.spawning && spawn.spawning.name
};

var rc = spawn.spawnCreep(body, name, { dryRun: true });
if (rc !== ERR_BUSY) {
  throw new Error("Unexpected return code " + rc + "; discard this capture.");
}

var after = EvidenceCapture.snapshot({ spawn: spawn, room: spawn.room });
EvidenceCapture.captureConsole({
  articleSlug: "screeps-spawn-create-creep",
  language: "zh-CN",
  roomName: spawn.room.name,
  apiName: "StructureSpawn.spawnCreep",
  returnCode: rc,
  beforeState: before,
  afterState: after,
  evidenceNote: "A naturally busy owned Spawn returned ERR_BUSY (-4) to an explicit dryRun probe; no additional spawn intent was submitted.",
  label: "SPAWN-BUSY"
});`,
  },
  {
    errorName: "ERR_RCL_NOT_ENOUGH",
    enTitle: "Naturally inactive Spawn · never downgrade for evidence",
    zhTitle: "自然 inactive Spawn · 不为采证降级",
    enGuard: "Only use an owned Spawn that is already inactive because of the current room state. Never downgrade, unclaim, destroy, or otherwise damage a room to obtain this Evidence. If no such Spawn exists, leave this branch pending.",
    zhGuard: "仅在当前房间状态本来就存在 owned 且 inactive 的 Spawn 时采集。不要为了采证主动降级 Controller、unclaim、destroy 或破坏房间；没有自然条件就继续保持 Pending。",
    code: `var spawn = Object.values(Game.spawns).find(function (item) {
  return item.my && item.isActive() === false;
});
if (!spawn) throw new Error("No naturally inactive owned Spawn; leave ERR_RCL_NOT_ENOUGH pending.");

var name = "LQRcl_" + Game.time;
var body = [MOVE];
var before = EvidenceCapture.snapshot({
  spawn: spawn,
  room: spawn.room,
  controller: spawn.room.controller
});
before.probe = {
  branch: "ERR_RCL_NOT_ENOUGH",
  name: name,
  body: body,
  dryRun: true,
  spawnActive: spawn.isActive(),
  controllerLevel: spawn.room.controller && spawn.room.controller.level
};

var rc = spawn.spawnCreep(body, name, { dryRun: true });
if (rc !== ERR_RCL_NOT_ENOUGH) {
  throw new Error("Unexpected return code " + rc + "; discard this capture.");
}

var after = EvidenceCapture.snapshot({
  spawn: spawn,
  room: spawn.room,
  controller: spawn.room.controller
});
EvidenceCapture.captureConsole({
  articleSlug: "screeps-spawn-create-creep",
  language: "zh-CN",
  roomName: spawn.room.name,
  apiName: "StructureSpawn.spawnCreep",
  returnCode: rc,
  beforeState: before,
  afterState: after,
  evidenceNote: "A naturally inactive owned Spawn returned ERR_RCL_NOT_ENOUGH (-14) to a dryRun probe; no room downgrade or spawn intent was performed for evidence collection.",
  label: "SPAWN-RCL-NOT-ENOUGH"
});`,
  },
] as const;

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

function SpawnCaptureRecipe({
  locale,
  missingErrorNames,
}: {
  locale: ScreepsDiagnosticLocale;
  missingErrorNames: readonly string[];
}) {
  const isEnglish = locale === "en";
  const recipes = spawnCaptureRecipes.filter((recipe) => missingErrorNames.includes(recipe.errorName));
  if (recipes.length === 0) return null;

  const copy = isEnglish
    ? {
        eyebrow: "SAFE CAPTURE RECIPE",
        title: "Finish the remaining spawnCreep() branches without changing colony policy",
        body: "The current public Evidence already covers the Energy-shortage and duplicate-name branches. These recipes target only still-missing branches. Every probe uses dryRun, records scoped before/after state, and fails closed if the observed return code is not the intended branch.",
        install: "Open the read-only Evidence Capture Kit",
        method: "Review the Evidence workflow",
        guard: "Safety guard",
        lifecycle: "A printed bundle is still only captured material. Validate it, review it, then accept it separately; this recipe never changes Evidence status.",
      }
    : {
        eyebrow: "SAFE CAPTURE RECIPE",
        title: "不改变房间策略，补完剩余 spawnCreep() 返回码分支",
        body: "当前公开 Evidence 已覆盖 Energy 不足与重名分支；这里仅针对仍缺的分支。每个探针都只使用 dryRun，记录限定范围的前后状态，并在真实返回值不是目标分支时 fail-closed 丢弃。",
        install: "打开只读 Evidence Capture Kit",
        method: "查看 Evidence 采集流程",
        guard: "安全条件",
        lifecycle: "Console 打印出的 bundle 仍然只是 captured material；必须先校验、review，再单独 accept。本 recipe 不会改变任何 Evidence 状态。",
      };

  return (
    <aside className={styles.recipe} aria-label={isEnglish ? "Safe Spawn Runtime Evidence capture recipe" : "安全 Spawn Runtime Evidence 采集 recipe"}>
      <header className={styles.recipeHeader}>
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h4>{copy.title}</h4>
          <p>{copy.body}</p>
        </div>
        <nav className={styles.recipeLinks}>
          <Link href="/screeps-evidence-capture-kit.js">{copy.install}</Link>
          <Link href={isEnglish ? "/en/verification" : "/verification"}>{copy.method}</Link>
        </nav>
      </header>

      <div className={styles.recipeGrid}>
        {recipes.map((recipe) => (
          <section className={styles.recipeCard} key={recipe.errorName}>
            <div className={styles.recipeCardHeader}>
              <code>{recipe.errorName}</code>
              <strong>{isEnglish ? recipe.enTitle : recipe.zhTitle}</strong>
            </div>
            <p><strong>{copy.guard}</strong>{isEnglish ? recipe.enGuard : recipe.zhGuard}</p>
            <pre className={styles.recipeCode}><code>{recipe.code}</code></pre>
          </section>
        ))}
      </div>

      <p className={styles.recipeLifecycle}>{copy.lifecycle}</p>
    </aside>
  );
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
                  {index === 0 && plan.symptomId === "spawn-not-spawning" ? (
                    <SpawnCaptureRecipe locale={locale} missingErrorNames={missingErrorNames} />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : <p className={styles.complete}>{copy.complete}</p>}
    </section>
  );
}
