import Link from "next/link";

import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";

import styles from "./home-problem-hub.module.css";

const featuredSymptomOrder = new Map<string, number>([
  "spawn-not-spawning",
  "creep-not-moving",
  "resources-not-moving",
  "cpu-too-high",
  "controller-downgrade",
  "market-action-failed",
].map((id, index) => [id, index]));

const diagnosticCheckLabels: Record<string, readonly string[]> = {
  "creep-not-moving": ["返回值", "fatigue", "路径", "目标"],
  "spawn-not-spawning": ["Energy", "body", "name", "Spawn 状态"],
  "cpu-too-high": ["getUsed()", "bucket", "PathFinder", "全量扫描"],
  "controller-downgrade": ["ticksToDowngrade", "Upgrader", "Link", "Energy"],
  "resources-not-moving": ["withdraw", "moveTo", "transfer", "Store"],
  "market-action-failed": ["Credits", "Terminal", "Energy", "Order"],
};

const featuredSymptoms = screepsDiagnosticSymptoms
  .filter((symptom) => featuredSymptomOrder.has(symptom.id))
  .sort(
    (left, right) =>
      (featuredSymptomOrder.get(left.id) ?? 99) -
      (featuredSymptomOrder.get(right.id) ?? 99),
  );

export function HomeProblemHub() {
  return (
    <section className={styles.section} aria-labelledby="home-problem-title">
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">SOLVE BY SYMPTOM · DOCTOR</p>
          <h2 id="home-problem-title">我遇到了问题，直接开始诊断</h2>
        </div>
        <p>
          不需要先知道错误码。选择可见症状，Doctor 会引导你查看证据、Resolver、API、返回码和对应修复路径。
        </p>
      </header>

      <div className={styles.grid}>
        {featuredSymptoms.map((symptom) => (
          <Link className={styles.card} href={`/diagnostics#${symptom.id}`} key={symptom.id}>
            <span className={styles.kind}>Doctor Flow</span>
            <strong>{symptom.zhTitle}</strong>
            <p className={styles.checks}>
              <span>诊断证据</span>
              {diagnosticCheckLabels[symptom.id]?.join(" · ")}
            </p>
            <div className={styles.meta}>
              {symptom.errorNames.slice(0, 2).map((errorName) => (
                <code key={errorName}>{errorName}</code>
              ))}
              <span>启动 Doctor →</span>
            </div>
          </Link>
        ))}
      </div>

      <footer className={styles.footer}>
        <Link href="/diagnostics">查看全部 Doctor 问题 →</Link>
        <Link href="/screeps-errors">按错误码查询 →</Link>
        <Link href="/screeps-api">按 API 查询 →</Link>
      </footer>
    </section>
  );
}
