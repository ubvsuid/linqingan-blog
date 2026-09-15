"use client";

import Link from "next/link";
import { useState } from "react";

import {
  diagnoseSpawnDoctor,
  SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS,
  type SpawnDoctorDiagnosis,
} from "@/lib/screeps-doctor";

import styles from "./screeps-doctor.module.css";

type Locale = "zh" | "en";

const SAMPLE_SNAPSHOT = JSON.stringify(
  {
    version: 1,
    symptom: "spawn-not-working",
    room: { visible: true, energyAvailable: 300 },
    spawn: { visible: true, owned: true, spawning: false, remainingTime: null },
    request: { bodyCost: 350 },
  },
  null,
  2,
);

const COPY = {
  zh: {
    eyebrow: "READ-ONLY SNAPSHOT",
    title: "Screeps Doctor V1 · Spawn 不工作",
    intro: "粘贴一份严格的 V1 Snapshot。Doctor 只在浏览器里解析这些结构化事实，并复用现有 Resolver / Diagnostics 的 canonical ID 给出确定性判断；不会执行 Screeps 代码、调用 Spawn、写 Memory 或上传 Snapshot。",
    label: "Snapshot JSON",
    placeholder: "粘贴 version=1 的 Spawn Snapshot JSON",
    sample: "载入示例",
    diagnose: "开始诊断",
    clear: "清空",
    limit: `最多 ${SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS} 个字符；未知字段会被拒绝。`,
    error: "Snapshot 未通过严格校验",
    observed: "Observed facts",
    diagnosis: "Diagnosis",
    fix: "Fix",
    verify: "Verify",
    classification: "分类",
    confidence: "置信边界",
    canonical: "Canonical handoff",
    sessionOnly: "Session Verification 仅用于当前会话复核，不会成为 public Runtime Evidence。",
    links: "继续使用现有真值入口",
    resolver: "Problem Resolver",
    diagnostics: "Diagnostics",
    api: "Screeps API",
    tickLab: "Tick Lab",
  },
  en: {
    eyebrow: "READ-ONLY SNAPSHOT",
    title: "Screeps Doctor V1 · Spawn not working",
    intro: "Paste a strict V1 Snapshot. Doctor parses these structured facts locally in the browser and reuses canonical Resolver / Diagnostics IDs for deterministic diagnosis. It does not execute Screeps code, call Spawn, write Memory, or upload the Snapshot.",
    label: "Snapshot JSON",
    placeholder: "Paste a version=1 Spawn Snapshot JSON",
    sample: "Load example",
    diagnose: "Diagnose",
    clear: "Clear",
    limit: `Maximum ${SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS} characters; unknown fields are rejected.`,
    error: "Snapshot failed strict validation",
    observed: "Observed facts",
    diagnosis: "Diagnosis",
    fix: "Fix",
    verify: "Verify",
    classification: "Classification",
    confidence: "Confidence boundary",
    canonical: "Canonical handoff",
    sessionOnly: "Session Verification is only for this diagnostic session and never becomes public Runtime Evidence.",
    links: "Continue with existing truth sources",
    resolver: "Problem Resolver",
    diagnostics: "Diagnostics",
    api: "Screeps API",
    tickLab: "Tick Lab",
  },
} as const;

const RECOMMENDATIONS: Record<SpawnDoctorDiagnosis["fix"]["recommendationId"], { zh: string; en: string }> = {
  "restore-room-visibility": {
    zh: "先恢复或确认房间视野，再重新采集 Snapshot；当前数据不足以判断 Spawn 故障。",
    en: "Restore or confirm room vision, then capture a new Snapshot; the current facts cannot establish a Spawn failure.",
  },
  "select-visible-spawn": {
    zh: "确认选择的是当前可见房间中的真实 Spawn，然后重新采集。",
    en: "Select a real Spawn in the currently visible room, then capture the Snapshot again.",
  },
  "select-owned-spawn": {
    zh: "改用你拥有的 Spawn；只读 Snapshot 已直接观察到 ownership 阻断。",
    en: "Use a Spawn you own; the read-only Snapshot directly observed an ownership blocker.",
  },
  "wait-for-current-spawn": {
    zh: "当前 Spawn 正在生产。等待本次 spawning 完成后重新采集，不要把 busy 误判成 broken。",
    en: "The Spawn is currently producing. Wait until spawning completes and resnapshot instead of treating busy as broken.",
  },
  "reduce-body-or-refill-energy": {
    zh: "已知 bodyCost 高于当前可用能量：降低 body 成本或补足房间能量，再重新采集。",
    en: "The known bodyCost exceeds available room energy. Reduce the body cost or refill energy, then resnapshot.",
  },
  "capture-return-code-in-canonical-resolver": {
    zh: "只读事实无法证明精确调用失败。进入 canonical Resolver，采集真实 spawnCreep 返回值后再继续；Doctor 本身不会调用 spawnCreep。",
    en: "Read-only facts cannot prove the exact call failure. Continue in the canonical Resolver and capture the real spawnCreep return value; Doctor itself never calls spawnCreep.",
  },
};

const VERIFICATION: Record<SpawnDoctorDiagnosis["verification"]["nextCheckId"], { zh: string; en: string }> = {
  "resnapshot-visible-room": { zh: "房间重新可见后再采集 Snapshot。", en: "Capture a new Snapshot after room vision is restored." },
  "resnapshot-visible-spawn": { zh: "确认 Spawn 可见后重新采集。", en: "Capture again after the Spawn is visible." },
  "resnapshot-owned-spawn": { zh: "切换到 owned Spawn 后重新采集。", en: "Capture again after selecting an owned Spawn." },
  "resnapshot-until-idle": { zh: "等待 Spawn idle 后重新采集。", en: "Capture again once the Spawn becomes idle." },
  "resnapshot-energy-threshold": { zh: "能量达到 bodyCost 阈值后重新采集。", en: "Capture again when available energy reaches the bodyCost threshold." },
  "continue-canonical-resolver": { zh: "继续 canonical Resolver，并以真实返回值复核。", en: "Continue in the canonical Resolver and verify with the real return value." },
};

export function ScreepsDoctor({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const prefix = locale === "en" ? "/en" : "";
  const [snapshot, setSnapshot] = useState("");
  const [diagnosis, setDiagnosis] = useState<SpawnDoctorDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  function runDiagnosis() {
    try {
      const result = diagnoseSpawnDoctor(snapshot);
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

      <label className={styles.label} htmlFor="screeps-doctor-snapshot">{copy.label}</label>
      <textarea
        id="screeps-doctor-snapshot"
        className={styles.textarea}
        value={snapshot}
        onChange={(event) => setSnapshot(event.target.value)}
        placeholder={copy.placeholder}
        spellCheck={false}
        maxLength={SCREEPS_DOCTOR_MAX_SNAPSHOT_CHARS}
        rows={14}
      />
      <p className={styles.hint}>{copy.limit}</p>
      <div className={styles.actions}>
        <button type="button" onClick={runDiagnosis} disabled={!snapshot.trim()}>{copy.diagnose}</button>
        <button type="button" className={styles.secondary} onClick={() => { setSnapshot(SAMPLE_SNAPSHOT); setDiagnosis(null); setError(null); }}>{copy.sample}</button>
        <button type="button" className={styles.secondary} onClick={clear}>{copy.clear}</button>
      </div>

      {error ? (
        <div className={styles.error} role="alert">
          <strong>{copy.error}</strong>
          <code>{error}</code>
        </div>
      ) : null}

      {diagnosis ? (
        <div className={styles.result} aria-live="polite">
          <div className={styles.card}>
            <h3>{copy.observed}</h3>
            <ul>{diagnosis.observations.map((observation) => <li key={observation}><code>{observation}</code></li>)}</ul>
          </div>
          <div className={styles.card}>
            <h3>{copy.diagnosis}</h3>
            <dl>
              <div><dt>{copy.classification}</dt><dd><code>{diagnosis.classification}</code></dd></div>
              <div><dt>{copy.confidence}</dt><dd><code>{diagnosis.confidence}</code></dd></div>
              <div><dt>{copy.canonical}</dt><dd><code>{diagnosis.canonical.resolverFlowId}</code> · <code>{diagnosis.canonical.diagnosticSymptomId}</code>{diagnosis.canonical.resolverOutcomeId ? <> · <code>{diagnosis.canonical.resolverOutcomeId}</code></> : null}</dd></div>
            </dl>
          </div>
          <div className={styles.card}>
            <h3>{copy.fix}</h3>
            <p>{RECOMMENDATIONS[diagnosis.fix.recommendationId][locale]}</p>
            <code>{diagnosis.fix.recommendationId}</code>
          </div>
          <div className={styles.card}>
            <h3>{copy.verify}</h3>
            <p>{VERIFICATION[diagnosis.verification.nextCheckId][locale]}</p>
            <p className={styles.boundary}><strong>{copy.sessionOnly}</strong></p>
          </div>
          <div className={styles.handoffs}>
            <strong>{copy.links}</strong>
            <div>
              <Link href={`${prefix}/resolver`}>{copy.resolver}</Link>
              <Link href={`${prefix}/diagnostics`}>{copy.diagnostics}</Link>
              <Link href={`${prefix}/screeps-api`}>{copy.api}</Link>
              <Link href={`${prefix}/tick-lab`}>{copy.tickLab}</Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
