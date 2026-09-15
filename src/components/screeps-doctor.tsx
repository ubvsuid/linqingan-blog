"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  diagnoseCreepHarvestDoctor,
  diagnoseCreepMovementDoctor,
  diagnoseSpawnDoctor,
  SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS,
  type ScreepsDoctorDiagnosis,
} from "@/lib/screeps-doctor";
import { parseScreepsDoctorLaunchSymptom } from "@/lib/screeps-doctor-launcher";

import styles from "./screeps-doctor.module.css";

type Locale = "zh" | "en";
type DoctorSymptom = ScreepsDoctorDiagnosis["symptom"];

const SAMPLE_SNAPSHOTS: Record<DoctorSymptom, string> = {
  "spawn-not-working": JSON.stringify({ version: 1, symptom: "spawn-not-working", room: { visible: true, energyAvailable: 300 }, spawn: { visible: true, owned: true, spawning: false, remainingTime: null }, request: { bodyCost: 350 } }, null, 2),
  "creep-not-moving": JSON.stringify({ version: 1, symptom: "creep-not-moving", creep: { visible: true, owned: true, fatigue: 6, activeMoveParts: 2 } }, null, 2),
  "creep-not-harvesting": JSON.stringify({ version: 1, symptom: "creep-not-harvesting", creep: { visible: true, owned: true, activeWorkParts: 2 }, target: { visible: true, inRange: false } }, null, 2),
};

const SYMPTOM_LABELS: Record<DoctorSymptom, { zh: string; en: string }> = {
  "spawn-not-working": { zh: "Spawn 不工作", en: "Spawn not working" },
  "creep-not-moving": { zh: "Creep 不移动", en: "Creep not moving" },
  "creep-not-harvesting": { zh: "Creep 不采集", en: "Creep not harvesting" },
};

const COPY = {
  zh: {
    eyebrow: "READ-ONLY SNAPSHOT", title: "Screeps Doctor V2",
    intro: "选择一个已支持的症状并粘贴严格的 V1 Snapshot。Doctor 只在浏览器本地解析结构化事实，复用现有 Resolver / Diagnostics / API canonical ID 做确定性判断；不会执行 Screeps 动作、写 Memory 或上传 Snapshot。",
    symptom: "选择症状", label: "Snapshot JSON", placeholder: "粘贴所选症状的 version=1 Snapshot JSON", sample: "载入示例", diagnose: "开始诊断", clear: "清空",
    limit: `最多 ${SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS} 个字符；未知字段会被拒绝。`, error: "Snapshot 未通过严格校验", observed: "Observed facts", diagnosis: "Diagnosis", fix: "Fix", verify: "Verify", classification: "分类", confidence: "置信边界", canonical: "Canonical handoff",
    sessionOnly: "Session Verification 仅用于当前会话复核，不会成为 public Runtime Evidence。", links: "继续使用现有真值入口", resolver: "Problem Resolver", diagnostics: "Diagnostics", api: "Screeps API", tickLab: "Tick Lab",
  },
  en: {
    eyebrow: "READ-ONLY SNAPSHOT", title: "Screeps Doctor V2",
    intro: "Choose a supported symptom and paste a strict V1 Snapshot. Doctor parses structured facts locally in the browser and reuses canonical Resolver / Diagnostics / API IDs for deterministic diagnosis. It does not execute Screeps actions, write Memory, or upload the Snapshot.",
    symptom: "Choose a symptom", label: "Snapshot JSON", placeholder: "Paste a version=1 Snapshot for the selected symptom", sample: "Load example", diagnose: "Diagnose", clear: "Clear",
    limit: `Maximum ${SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS} characters; unknown fields are rejected.`, error: "Snapshot failed strict validation", observed: "Observed facts", diagnosis: "Diagnosis", fix: "Fix", verify: "Verify", classification: "Classification", confidence: "Confidence boundary", canonical: "Canonical handoff",
    sessionOnly: "Session Verification is only for this diagnostic session and never becomes public Runtime Evidence.", links: "Continue with existing truth sources", resolver: "Problem Resolver", diagnostics: "Diagnostics", api: "Screeps API", tickLab: "Tick Lab",
  },
} as const;

const RECOMMENDATIONS: Record<ScreepsDoctorDiagnosis["fix"]["recommendationId"], { zh: string; en: string }> = {
  "restore-room-visibility": { zh: "先恢复或确认房间视野，再重新采集 Snapshot；当前数据不足以判断 Spawn 故障。", en: "Restore or confirm room vision, then capture a new Snapshot; the current facts cannot establish a Spawn failure." },
  "select-visible-spawn": { zh: "确认选择的是当前可见房间中的真实 Spawn，然后重新采集。", en: "Select a real Spawn in the currently visible room, then capture the Snapshot again." },
  "select-owned-spawn": { zh: "改用你拥有的 Spawn；只读 Snapshot 已直接观察到 ownership 阻断。", en: "Use a Spawn you own; the read-only Snapshot directly observed an ownership blocker." },
  "wait-for-current-spawn": { zh: "当前 Spawn 正在生产。等待本次 spawning 完成后重新采集，不要把 busy 误判成 broken。", en: "The Spawn is currently producing. Wait until spawning completes and resnapshot instead of treating busy as broken." },
  "reduce-body-or-refill-energy": { zh: "已知 bodyCost 高于当前可用能量：降低 body 成本或补足房间能量，再重新采集。", en: "The known bodyCost exceeds available room energy. Reduce the body cost or refill energy, then resnapshot." },
  "capture-return-code-in-canonical-resolver": { zh: "只读事实无法证明精确调用失败。进入 canonical Resolver，采集真实 spawnCreep 返回值后再继续；Doctor 本身不会调用 spawnCreep。", en: "Read-only facts cannot prove the exact call failure. Continue in the canonical Resolver and capture the real spawnCreep return value; Doctor itself never calls spawnCreep." },
  "select-visible-creep": { zh: "先确认目标 Creep 当前真实可见，再重新采集 Snapshot；不可见对象不足以证明移动故障。", en: "Confirm the target Creep is currently visible, then capture again; an invisible object cannot establish a movement failure." },
  "select-owned-creep": { zh: "改用你拥有并控制的 Creep；当前 Snapshot 已直接观察到 ownership 阻断。", en: "Use a Creep you own and control; the current Snapshot directly observed an ownership blocker." },
  "restore-active-move-parts-or-replace-creep": { zh: "当前没有可用 MOVE 部件。先恢复可用 MOVE 能力或替换该 Creep，再重新采集；Doctor 不会自动修改 Creep。", en: "There are no active MOVE parts. Restore usable MOVE capability or replace the Creep, then capture again; Doctor does not modify the Creep." },
  "wait-for-fatigue-recovery": { zh: "fatigue 当前大于 0。等待恢复到 0 后重新采集，不要把冷却状态误判成寻路故障。", en: "Fatigue is above zero. Wait for it to recover to zero and resnapshot instead of treating cooldown as a pathfinding failure." },
  "capture-movement-return-code-in-canonical-resolver": { zh: "可见、owned、有 MOVE 且 fatigue=0 仍不能证明精确失败原因。进入 canonical Resolver，保存真实 moveTo/move 返回值后继续。", en: "Visible, owned, active MOVE capability, and zero fatigue still do not prove the exact failure. Continue in the canonical Resolver and capture the real moveTo/move result." },
  "select-visible-harvest-creep": { zh: "先确认待采集的 Creep 当前真实可见，再重新采集 Snapshot；不可见对象不足以判断采集故障。", en: "Confirm the harvesting Creep is currently visible, then capture again; an invisible object cannot establish a harvest failure." },
  "select-owned-harvest-creep": { zh: "改用你拥有并控制的 Creep，再重新采集；Doctor 不会把非 owned 对象当作有效采集执行者。", en: "Use a Creep you own and control, then capture again; Doctor does not treat a non-owned object as a valid harvesting actor." },
  "restore-active-work-parts-or-replace-creep": { zh: "当前没有可用 WORK 部件。修复角色编成或替换该 Creep 后重新采集；Doctor 不会自动修改 Creep。", en: "There are no active WORK parts. Fix the role body or replace the Creep, then capture again; Doctor does not modify the Creep." },
  "select-visible-harvest-target": { zh: "先重新获取一个当前可见的采集目标，再采集 Snapshot；Doctor 不会根据不可见或失效对象猜目标类型。", en: "Reacquire a currently visible harvest target before capturing again; Doctor does not guess target semantics from an invisible or stale object." },
  "move-into-harvest-range": { zh: "只读 Snapshot 已确认目标不在执行距离内。先处理移动并重新采集；如果移动本身失败，转到 Creep movement Resolver，而不是猜采集返回码。", en: "The read-only Snapshot confirms the target is out of action range. Resolve movement and capture again; if movement itself fails, use the Creep movement Resolver instead of guessing a harvest return code." },
  "capture-harvest-return-code-in-canonical-resolver": { zh: "可见、owned、有 WORK、目标可见且已进入距离，仍不足以区分资源不足、无效目标或已接受动作。进入 canonical Resolver，保存真实 harvest 返回值后继续；Doctor 本身不会执行采集动作。", en: "Visible, owned, active WORK capability, a visible target, and valid range still cannot distinguish depleted resource, invalid target, or an accepted action. Continue in the canonical Resolver and capture the real harvest return value; Doctor itself never executes the action." },
};

const VERIFICATION: Record<ScreepsDoctorDiagnosis["verification"]["nextCheckId"], { zh: string; en: string }> = {
  "resnapshot-visible-room": { zh: "房间重新可见后再采集 Snapshot。", en: "Capture a new Snapshot after room vision is restored." },
  "resnapshot-visible-spawn": { zh: "确认 Spawn 可见后重新采集。", en: "Capture again after the Spawn is visible." },
  "resnapshot-owned-spawn": { zh: "切换到 owned Spawn 后重新采集。", en: "Capture again after selecting an owned Spawn." },
  "resnapshot-until-idle": { zh: "等待 Spawn idle 后重新采集。", en: "Capture again once the Spawn becomes idle." },
  "resnapshot-energy-threshold": { zh: "能量达到 bodyCost 阈值后重新采集。", en: "Capture again when available energy reaches the bodyCost threshold." },
  "continue-canonical-resolver": { zh: "继续 canonical Resolver，并以真实返回值复核。", en: "Continue in the canonical Resolver and verify with the real return value." },
  "resnapshot-visible-creep": { zh: "确认 Creep 可见后重新采集。", en: "Capture again after the Creep is visible." },
  "resnapshot-owned-creep": { zh: "切换到 owned Creep 后重新采集。", en: "Capture again after selecting an owned Creep." },
  "resnapshot-active-move-parts": { zh: "确认存在可用 MOVE 部件后重新采集。", en: "Capture again after confirming at least one active MOVE part." },
  "resnapshot-until-fatigue-zero": { zh: "等待 fatigue=0 后重新采集。", en: "Capture again after fatigue reaches zero." },
  "continue-movement-resolver": { zh: "继续 Creep movement Resolver，并以真实 moveTo/move 返回值复核。", en: "Continue in the Creep movement Resolver and verify with the real moveTo/move result." },
  "resnapshot-visible-harvest-creep": { zh: "确认采集 Creep 可见后重新采集。", en: "Capture again after the harvesting Creep is visible." },
  "resnapshot-owned-harvest-creep": { zh: "切换到 owned Creep 后重新采集。", en: "Capture again after selecting an owned Creep." },
  "resnapshot-active-work-parts": { zh: "确认至少存在一个可用 WORK 部件后重新采集。", en: "Capture again after confirming at least one active WORK part." },
  "resnapshot-visible-harvest-target": { zh: "重新获取可见采集目标后再采集。", en: "Capture again after reacquiring a visible harvest target." },
  "resnapshot-harvest-range": { zh: "进入采集距离后重新采集 Snapshot。", en: "Capture again after entering harvest range." },
  "continue-harvest-resolver": { zh: "继续 Creep harvest Resolver，并以真实 harvest 返回值复核。", en: "Continue in the Creep harvest Resolver and verify with the real harvest return value." },
};

export function ScreepsDoctor({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const prefix = locale === "en" ? "/en" : "";
  const [symptom, setSymptom] = useState<DoctorSymptom>("spawn-not-working");
  const [snapshot, setSnapshot] = useState("");
  const [diagnosis, setDiagnosis] = useState<ScreepsDoctorDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestedSymptom = parseScreepsDoctorLaunchSymptom(new URLSearchParams(window.location.search).get("doctor"));
    if (!requestedSymptom) return;
    setSymptom(requestedSymptom);
    setSnapshot("");
    setDiagnosis(null);
    setError(null);
  }, []);

  function selectSymptom(nextSymptom: DoctorSymptom) {
    setSymptom(nextSymptom);
    setSnapshot("");
    setDiagnosis(null);
    setError(null);
  }

  function runDiagnosis() {
    try {
      let result: ScreepsDoctorDiagnosis;
      if (symptom === "spawn-not-working") result = diagnoseSpawnDoctor(snapshot);
      else if (symptom === "creep-not-moving") result = diagnoseCreepMovementDoctor(snapshot);
      else result = diagnoseCreepHarvestDoctor(snapshot);
      setDiagnosis(result);
      setError(null);
    } catch (cause) {
      setDiagnosis(null);
      setError(cause instanceof Error ? cause.message : "Invalid Snapshot.");
    }
  }

  function clear() {
    setSnapshot("");
    setDiagnosis(null);
    setError(null);
  }

  return (
    <section id="screeps-doctor" className={styles.doctor} aria-labelledby="screeps-doctor-title">
      <div className={styles.header}>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="screeps-doctor-title">{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>

      <fieldset className={styles.symptoms}>
        <legend>{copy.symptom}</legend>
        <div>
          {(Object.keys(SYMPTOM_LABELS) as DoctorSymptom[]).map((item) => (
            <button key={item} type="button" className={item === symptom ? styles.activeSymptom : styles.symptomButton} aria-pressed={item === symptom} onClick={() => selectSymptom(item)}>
              {SYMPTOM_LABELS[item][locale]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={styles.label} htmlFor="screeps-doctor-snapshot">{copy.label}</label>
      <textarea id="screeps-doctor-snapshot" className={styles.textarea} value={snapshot} onChange={(event) => setSnapshot(event.target.value)} placeholder={copy.placeholder} spellCheck={false} maxLength={SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS} rows={14} />
      <p className={styles.hint}>{copy.limit}</p>
      <div className={styles.actions}>
        <button type="button" onClick={runDiagnosis} disabled={!snapshot.trim()}>{copy.diagnose}</button>
        <button type="button" className={styles.secondary} onClick={() => { setSnapshot(SAMPLE_SNAPSHOTS[symptom]); setDiagnosis(null); setError(null); }}>{copy.sample}</button>
        <button type="button" className={styles.secondary} onClick={clear}>{copy.clear}</button>
      </div>

      {error ? <div className={styles.error} role="alert"><strong>{copy.error}</strong><code>{error}</code></div> : null}

      {diagnosis ? (
        <div className={styles.result} aria-live="polite">
          <div className={styles.card}><h3>{copy.observed}</h3><ul>{diagnosis.observations.map((observation) => <li key={observation}><code>{observation}</code></li>)}</ul></div>
          <div className={styles.card}>
            <h3>{copy.diagnosis}</h3>
            <dl>
              <div><dt>{copy.classification}</dt><dd><code>{diagnosis.classification}</code></dd></div>
              <div><dt>{copy.confidence}</dt><dd><code>{diagnosis.confidence}</code></dd></div>
              <div><dt>{copy.canonical}</dt><dd><code>{diagnosis.canonical.resolverFlowId}</code>{diagnosis.canonical.resolverStepId ? <> · <code>{diagnosis.canonical.resolverStepId}</code></> : null}{diagnosis.canonical.resolverOutcomeId ? <> · <code>{diagnosis.canonical.resolverOutcomeId}</code></> : null}<> · <code>{diagnosis.canonical.diagnosticSymptomId}</code></></dd></div>
            </dl>
          </div>
          <div className={styles.card}><h3>{copy.fix}</h3><p>{RECOMMENDATIONS[diagnosis.fix.recommendationId][locale]}</p><code>{diagnosis.fix.recommendationId}</code></div>
          <div className={styles.card}><h3>{copy.verify}</h3><p>{VERIFICATION[diagnosis.verification.nextCheckId][locale]}</p><p className={styles.boundary}><strong>{copy.sessionOnly}</strong></p></div>
          <div className={styles.handoffs}>
            <strong>{copy.links}</strong>
            <div>
              <Link href={`${prefix}/resolver`}>{copy.resolver}</Link>
              <Link href={`${prefix}/diagnostics`}>{copy.diagnostics}</Link>
              <Link href={`${prefix}/screeps-api#${diagnosis.canonical.apiEntryId}`}>{copy.api}</Link>
              {diagnosis.symptom === "spawn-not-working" ? <Link href={`${prefix}/tick-lab`}>{copy.tickLab}</Link> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
