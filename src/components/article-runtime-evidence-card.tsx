import Link from "next/link";

import type { PublicVerificationEvidenceRecord } from "@/lib/verification-evidence";

import styles from "./article-runtime-evidence-card.module.css";

interface ArticleRuntimeEvidenceCardProps {
  evidence: PublicVerificationEvidenceRecord[];
  locale?: "zh" | "en";
}

function formatDate(value: string, locale: "zh" | "en") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function evidenceRuntimeSummary(record: PublicVerificationEvidenceRecord, locale: "zh" | "en") {
  const parts: string[] = [];
  if (record.returnCode) {
    parts.push(locale === "zh" ? `返回 ${record.returnCode}` : `returned ${record.returnCode}`);
  }
  if (record.gameTime !== null) parts.push(`Game.time ${record.gameTime}`);
  if (record.tickStart !== null && record.tickEnd !== null) {
    parts.push(locale === "zh" ? `Tick ${record.tickStart}–${record.tickEnd}` : `ticks ${record.tickStart}–${record.tickEnd}`);
  }
  const environment = [record.shard, record.roomName].filter(Boolean).join(" / ");
  if (environment) parts.push(environment);
  return parts;
}

export function ArticleRuntimeEvidenceCard({
  evidence,
  locale = "zh",
}: ArticleRuntimeEvidenceCardProps) {
  if (evidence.length === 0) return null;

  const visible = evidence.slice(0, 3);
  const verifiedHref = locale === "zh" ? "/verified" : "/en/verified";

  return (
    <section className={styles.card} aria-label={locale === "zh" ? "真实运行证据" : "Runtime verification evidence"}>
      <div className={styles.header}>
        <div>
          <span className="eyebrow">RUNTIME EVIDENCE</span>
          <h2>
            {locale === "zh"
              ? `${evidence.length} 条已接受的真实运行证据`
              : `${evidence.length} accepted runtime evidence record${evidence.length === 1 ? "" : "s"}`}
          </h2>
        </div>
        <Link href={verifiedHref}>
          {locale === "zh" ? "查看验证档案 →" : "Open verified archive →"}
        </Link>
      </div>

      <div className={styles.list}>
        {visible.map((record) => (
          <article className={styles.item} key={record.evidenceKey}>
            <div className={styles.meta}>
              <span className={styles.key}>{record.evidenceKey}</span>
              <span>{record.verificationType === "live" ? (locale === "zh" ? "真实主循环" : "Live multi-tick") : "Console"}</span>
              <span>{record.apiName}</span>
              <span>{formatDate(record.verifiedAt, locale)}</span>
            </div>
            {evidenceRuntimeSummary(record, locale).length > 0 ? (
              <div className={styles.meta}>
                {evidenceRuntimeSummary(record, locale).map((part) => <span key={part}>{part}</span>)}
              </div>
            ) : null}
            <p className={styles.note}>{record.evidenceNote}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
