import Link from "next/link";

import { DoctorLauncherLink } from "@/components/doctor-launcher-link";
import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";
import { getScreepsDoctorLaunchByDiagnosticSymptom } from "@/lib/screeps-doctor-launcher";

import styles from "./home-problem-hub.module.css";

const featuredSymptomOrder = new Map<string, number>([
  "spawn-not-spawning",
  "creep-not-moving",
  "creep-not-harvesting",
  "resources-not-moving",
  "controller-downgrade",
  "cpu-too-high",
].map((id, index) => [id, index]));

const diagnosticCheckLabels: Record<string, readonly string[]> = {
  "spawn-not-spawning": ["Energy", "body", "name", "Spawn 状态"],
  "creep-not-moving": ["返回值", "fatigue", "路径", "目标"],
  "creep-not-harvesting": ["WORK", "目标", "距离", "返回值"],
  "resources-not-moving": ["withdraw", "moveTo", "transfer", "Store"],
  "controller-downgrade": ["ticksToDowngrade", "Upgrader", "Link", "Energy"],
  "cpu-too-high": ["getUsed()", "bucket", "PathFinder", "全量扫描"],
};

const featuredSymptoms = screepsDiagnosticSymptoms
  .filter((symptom) => featuredSymptomOrder.has(symptom.id))
  .sort(
    (left, right) =>
      (featuredSymptomOrder.get(left.id) ?? 99) -
      (featuredSymptomOrder.get(right.id) ?? 99),
  );

const homepageSymptoms = featuredSymptoms.filter((symptom) =>
  ["spawn-not-spawning", "creep-not-moving", "resources-not-moving"].includes(symptom.id),
);

export function HomeProblemHub() {
  return (
    <section className={styles.section} aria-labelledby="home-problem-title">
      <header className={styles.heading}>
        <div>
          <p className="eyebrow">SOLVE BY SYMPTOM</p>
          <span className={styles.srOnly}>你现在遇到了什么问题？</span><h2 id="home-problem-title">Find out why.</h2><p className={styles.tagline}>Diagnose. Understand. Fix. Move forward.</p>
        </div>
        <p>
          不需要先知道错误码。从最常见的 Spawn、移动与资源流问题开始，再进入完整 Diagnostics、Resolver、API 和返回码路径。
        </p>
      </header>

      <div className={styles.grid}>
        {homepageSymptoms.map((symptom) => {
          const doctorLaunch = getScreepsDoctorLaunchByDiagnosticSymptom(symptom.id);
          const href = doctorLaunch
            ? `/resolver?doctor=${doctorLaunch.doctorSymptom}#screeps-doctor`
            : `/diagnostics#${symptom.id}`;
          const content = (
            <>
              <span className={styles.kind}>{doctorLaunch ? "Doctor Quick Start" : "Diagnostics"}</span>
              <strong>{symptom.zhTitle}</strong>
              <p className={styles.checks}>
                <span>诊断证据</span>
                {diagnosticCheckLabels[symptom.id]?.join(" · ")}
              </p>
              <div className={styles.meta}>
                {symptom.errorNames.slice(0, 2).map((errorName) => (
                  <code key={errorName}>{errorName}</code>
                ))}
                <span>{doctorLaunch ? "启动 Doctor →" : "开始排查 →"}</span>
              </div>
            </>
          );

          return doctorLaunch ? (
            <DoctorLauncherLink
              className={styles.card}
              href={href}
              key={symptom.id}
              symptom={doctorLaunch.doctorSymptom}
            >
              {content}
            </DoctorLauncherLink>
          ) : (
            <Link className={styles.card} href={href} key={symptom.id}>
              {content}
            </Link>
          );
        })}
      </div>

      <footer className={styles.footer}>
        <Link href="/diagnostics">查看全部诊断问题 →</Link>
        <Link href="/screeps-errors">按错误码查询 →</Link>
        <Link href="/screeps-api">按 API 查询 →</Link>
      </footer>
    </section>
  );
}
