"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  screepsApiGroups,
  type ScreepsApiReferenceEntry,
} from "@/lib/screeps-api-reference";
import type { ScreepsApiLocale } from "@/lib/screeps-api-reference-localized";

import styles from "./screeps-api-explorer.module.css";

function normalize(value: string, locale: ScreepsApiLocale): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase(locale === "en" ? "en" : "zh-CN");
}

export function ScreepsApiExplorer({
  entries,
  locale = "zh",
}: {
  entries: ScreepsApiReferenceEntry[];
  locale?: ScreepsApiLocale;
}) {
  const copy = locale === "en"
    ? {
        all: "All",
        searchLabel: "Search common APIs",
        placeholder: "For example: moveTo, Market, Controller, Link…",
        filterLabel: "Filter APIs by group",
        summary: (visible: number, total: number) => `Showing ${visible} / ${total} entries`,
        keywordsLabel: "Related keywords",
        guide: "Open site guide →",
        emptyTitle: "No matching API entry",
        emptyBody: "Try an object name, method name, or a shorter keyword, or continue with site search.",
        search: "Open site search →",
        searchHref: "/en/search",
      }
    : {
        all: "全部",
        searchLabel: "搜索常用 API",
        placeholder: "例如 moveTo、Market、Controller、Link……",
        filterLabel: "API 分类筛选",
        summary: (visible: number, total: number) => `当前显示 ${visible} / ${total} 项`,
        keywordsLabel: "相关关键词",
        guide: "查看站内说明 →",
        emptyTitle: "没有找到匹配项",
        emptyBody: "可以改用对象名、方法名或更短的关键词，也可以继续使用站内搜索。",
        search: "打开站内搜索 →",
        searchHref: "/search",
      };

  const allGroup = "__all__";
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>(allGroup);
  const normalizedQuery = normalize(query, locale);

  const visibleEntries = useMemo(
    () =>
      entries.filter((entry) => {
        if (group !== allGroup && entry.group !== group) return false;
        if (!normalizedQuery) return true;
        return normalize(
          [entry.signature, entry.summary, ...entry.keywords].join(" "),
          locale,
        ).includes(normalizedQuery);
      }),
    [entries, group, locale, normalizedQuery],
  );

  return (
    <section className={styles.explorer} aria-labelledby="api-explorer-title">
      <div className={styles.controls}>
        <label>
          <span id="api-explorer-title">{copy.searchLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.placeholder}
          />
        </label>

        <div className={styles.filters} aria-label={copy.filterLabel}>
          {[
            { value: allGroup, label: copy.all },
            ...screepsApiGroups.map((item) => ({ value: item, label: item })),
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={group === item.value}
              onClick={() => setGroup(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.summary} aria-live="polite">
        {copy.summary(visibleEntries.length, entries.length)}
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
              <div className={styles.keywords} aria-label={copy.keywordsLabel}>
                {entry.keywords.slice(0, 4).map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
              {entry.guideHref ? (
                <Link href={entry.guideHref}>{copy.guide}</Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <strong>{copy.emptyTitle}</strong>
          <p>{copy.emptyBody}</p>
          <Link href={copy.searchHref}>{copy.search}</Link>
        </div>
      )}
    </section>
  );
}
