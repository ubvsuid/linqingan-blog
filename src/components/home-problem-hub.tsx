import Link from "next/link";

import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";

import styles from "./home-problem-hub.module.css";

const featuredSymptoms = screepsDiagnosticSymptoms.slice(0, 8);

export function HomeProblemHub() {
  return (
    <section className={styles.section} aria-labelledby="home-problem-title">
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">SOLVE BY SYMPTOM</p>
          <h2 id="home-problem-title">你现在遇到了什么问题？</h2>
        </div>
        <p>
          不需要先知道错误码。直接从房间里看到的现象进入排查，再继续查看返回码、API、教程、工具和已接受的 Runtime Evidence。
        </p>
      </header>

      <div className={styles.grid}>
        {featuredSymptoms.map((symptom) => (
          <Link className={styles.card} href={`/diagnostics#${symptom.id}`} key={symptom.id}>
            <span className={styles.kind}>症状</span>
            <strong>{symptom.zhTitle}</strong>
            <p>{symptom.zhSummary}</p>
            <div className={styles.meta}>
              {symptom.errorNames.slice(0, 2).map((errorName) => (
                <code key={errorName}>{errorName}</code>
              ))}
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>

      <footer className={styles.footer}>
        <Link href="/diagnostics">进入完整诊断中心 →</Link>
        <Link href="/screeps-errors">按错误码查询 →</Link>
        <Link href="/screeps-api">按 API 查询 →</Link>
      </footer>
    </section>
  );
}
