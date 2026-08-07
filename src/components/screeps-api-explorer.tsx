"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  screepsApiGroups,
  type ScreepsApiReferenceEntry,
} from "@/lib/screeps-api-reference";

import styles from "./screeps-api-explorer.module.css";

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

export function ScreepsApiExplorer({
  entries,
}: {
  entries: ScreepsApiReferenceEntry[];
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("全部");
  const normalizedQuery = normalize(query);

  const visibleEntries = useMemo(
    () =>
      entries.filter((entry) => {
        if (group !== "全部" && entry.group !== group) return false;
        if (!normalizedQuery) return true;
        return normalize(
          [entry.signature, entry.summary, ...entry.keywords].join(" "),
        ).includes(normalizedQuery);
      }),
    [entries, group, normalizedQuery],
  );

  return (
    <section className={styles.explorer} aria-labelledby="api-explorer-title">
      <div className={styles.controls}>
        <label>
          <span id="api-explorer-title">搜索常用 API</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如 moveTo、Market、Controller、Link……"
          />
        </label>

        <div className={styles.filters} aria-label="API 分类筛选">
          {["全部", ...screepsApiGroups].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={group === item}
              onClick={() => setGroup(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.summary} aria-live="polite">
        当前显示 {visibleEntries.length} / {entries.length} 项
      </p>

      {visibleEntries.length > 0 ? (
        <div className={styles.grid}>
          {visibleEntries.map((entry) => (
            <article id={entry.id} key={entry.id}>
              <span className={styles.group}>{entry.group}</span>
              <h2>
                <code>{entry.signature}</code>
              </h2>
              <p>{entry.summary}</p>
              <div className={styles.keywords} aria-label="相关关键词">
                {entry.keywords.slice(0, 4).map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
              {entry.guideHref ? (
                <Link href={entry.guideHref}>查看站内说明 →</Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <strong>没有找到匹配项</strong>
          <p>可以改用对象名、方法名或更短的关键词，也可以继续使用站内搜索。</p>
          <Link href="/search">打开站内搜索 →</Link>
        </div>
      )}
    </section>
  );
}
