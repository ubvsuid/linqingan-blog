import Link from "next/link";

import {
  getScreepsApiHubHref,
  screepsApiHubs,
  type ScreepsApiHubLocale,
} from "@/lib/screeps-api-hubs";

import styles from "./screeps-api-hub-directory.module.css";

export function ScreepsApiHubDirectory({ locale }: { locale: ScreepsApiHubLocale }) {
  const isEnglish = locale === "en";

  return (
    <section className={styles.section} aria-labelledby={`api-hubs-${locale}`}>
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">OBJECT HUBS</p>
          <h2 id={`api-hubs-${locale}`}>
            {isEnglish ? "Start from a core game object" : "从核心对象进入"}
          </h2>
          <p>
            {isEnglish
              ? "Use these hubs when you already know the object you are working with. Each hub connects the shared API reference to existing guides, return codes, tools, and accepted runtime verification."
              : "已经知道自己在处理哪个对象时，可以先从 Hub 进入。每个 Hub 会把共享 API Reference、已有教程、返回码、工具和已接受的 Runtime Verification 串在一起。"}
          </p>
        </div>
        <strong>{screepsApiHubs.length}</strong>
      </div>

      <div className={styles.grid}>
        {screepsApiHubs.map((hub) => (
          <Link key={hub.slug} href={getScreepsApiHubHref(hub.slug, locale)} className={styles.card}>
            <span>{hub.objectName}</span>
            <h3>{isEnglish ? hub.enTitle : hub.zhTitle}</h3>
            <p>{isEnglish ? hub.enDescription : hub.zhDescription}</p>
            <small>
              {hub.entryIds.length} {isEnglish ? "API entries" : "个 API 入口"} · {hub.errorNames.length} {isEnglish ? "return-code paths" : "个返回码入口"}
            </small>
          </Link>
        ))}
      </div>
    </section>
  );
}
