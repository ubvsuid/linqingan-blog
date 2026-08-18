import Link from "next/link";

import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";

import styles from "./home-problem-hub.module.css";

const featuredSymptomOrder = new Map<string, number>([
  "creep-not-moving",
  "spawn-not-spawning",
  "cpu-too-high",
  "controller-downgrade",
  "resources-not-moving",
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
          <p className="eyebrow">SOLVE BY SYMPTOM</p>
          <h2 id="home-problem-title">你现在遇到了什么问题？</h2>
        </div>
        <p>
          不需要先知道错误码。先从可见症状进入，再继续查看返回码、API、教程、工具与 Runtime Evidence。
        </p>
      </header>

      <div className={styles.grid}>
        {featuredSymptoms.map((symptom) => (
          <Link className={styles.card} href={`/diagnostics#${symptom.id}`} key={symptom.id}>
            <span className={styles.kind}>症状</span>
            <strong>{symptom.zhTitle}</strong>
            <p className={styles.checks}>
              <span>检查</span>
              {diagnosticCheckLabels[symptom.id]?.join(" · ")}
            </p>
            <div className={styles.meta}>
              {symptom.errorNames.slice(0, 2).map((errorName) => (
                <code key={errorName}>{errorName}</code>
              ))}
              <span>开始排查 →</span>
            </div>
          </Link>
        ))}
      </div>

      <footer className={styles.footer}>
        <Link href="/diagnostics">查看全部诊断问题 →</Link>
        <Link href="/screeps-errors">按错误码查询 →</Link>
        <Link href="/screeps-api">按 API 查询 →</Link>
      </footer>
    </section>
  );
}
