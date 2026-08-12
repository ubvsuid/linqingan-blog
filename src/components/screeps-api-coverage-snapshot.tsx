import { screepsApiHubs } from "@/lib/screeps-api-hubs";
import { screepsApiGroups, screepsApiReference } from "@/lib/screeps-api-reference";
import { verificationCoveragePlans } from "@/lib/verification-coverage";

import styles from "./screeps-api-coverage-snapshot.module.css";

export function ScreepsApiCoverageSnapshot({ locale }: { locale: "zh" | "en" }) {
  const isEnglish = locale === "en";
  const p0Paths = verificationCoveragePlans.filter((plan) => plan.priority === "P0").length;
  const groupCounts = screepsApiGroups.map((group) => ({
    group,
    count: screepsApiReference.filter((entry) => entry.group === group).length,
  }));

  return (
    <section className={styles.coverage} aria-labelledby={`api-coverage-${locale}`}>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">API COVERAGE</p>
          <h2 id={`api-coverage-${locale}`}>
            {isEnglish ? "Current site coverage snapshot" : "当前站内 API 覆盖快照"}
          </h2>
        </div>
        <p>
          {isEnglish
            ? "This counts the site's own quick-reference entries, object/practice hubs, and P0 evidence paths. It is not a claim that every official Screeps API is documented here."
            : "这里统计本站已经公开维护的快速 Reference、Object / Practice Hub 与 P0 Evidence 路径，不把它解释成“已经覆盖官方全部 Screeps API”。"}
        </p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{screepsApiReference.length}</strong>
          <span>{isEnglish ? "quick-reference entries" : "个快速 Reference 入口"}</span>
        </div>
        <div className={styles.stat}>
          <strong>{screepsApiHubs.length}</strong>
          <span>{isEnglish ? "object / practice hubs" : "个 Object / Practice Hub"}</span>
        </div>
        <div className={styles.stat}>
          <strong>{p0Paths}</strong>
          <span>{isEnglish ? "P0 runtime evidence paths" : "条 P0 Runtime Evidence 路径"}</span>
        </div>
      </div>

      <div className={styles.groups} aria-label={isEnglish ? "Quick-reference groups" : "快速 Reference 分组"}>
        {groupCounts.map(({ group, count }) => (
          <div className={styles.group} key={group}>
            <span>{group}</span>
            <strong>{count} {isEnglish ? "entries" : "条"}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
