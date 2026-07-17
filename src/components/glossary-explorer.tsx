"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { ScreepsGlossaryEntry } from "@/lib/screeps-glossary";

const categories = ["全部", "对象", "运行", "建筑", "约定"] as const;

type Category = (typeof categories)[number];

export function GlossaryExplorer({ entries }: { entries: ScreepsGlossaryEntry[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("全部");

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");

    return entries.filter((entry) => {
      const matchesCategory = category === "全部" || entry.category === category;
      const searchable = [entry.term, entry.chinese, entry.summary, entry.detail]
        .join(" ")
        .toLocaleLowerCase("zh-CN");
      return matchesCategory && (!normalized || searchable.includes(normalized));
    });
  }, [category, entries, query]);

  return (
    <div className="resource-explorer">
      <div className="resource-toolbar">
        <label className="resource-search">
          <span>搜索术语</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入 Creep、Memory、房间……"
          />
        </label>
        <div className="resource-filters" aria-label="术语分类">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "resource-filter-active" : undefined}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <p className="resource-result-count" aria-live="polite">
        找到 {filteredEntries.length} 个术语
      </p>

      {filteredEntries.length > 0 ? (
        <div className="glossary-grid">
          {filteredEntries.map((entry) => (
            <article key={entry.term} id={entry.term.toLowerCase().replaceAll(" ", "-")}>
              <div className="glossary-topline">
                <span>{entry.category}</span>
                <strong>{entry.term}</strong>
              </div>
              <h2>{entry.chinese}</h2>
              <p className="glossary-summary">{entry.summary}</p>
              <p>{entry.detail}</p>
              {entry.article ? <Link href={entry.article.href}>{entry.article.label} →</Link> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="resource-empty">
          <strong>没有找到对应术语</strong>
          <p>尝试缩短关键词，或切换到“全部”分类。</p>
        </div>
      )}

      <style>{`
        .resource-explorer { display: grid; gap: 24px; }
        .resource-toolbar { display: grid; gap: 18px; border: 1px solid var(--border); border-radius: 22px; padding: 22px; background: var(--surface); }
        .resource-search { display: grid; gap: 8px; color: var(--muted); font-size: 13px; }
        .resource-search input { min-height: 52px; width: 100%; border: 1px solid var(--border); border-radius: 14px; padding: 0 16px; background: var(--background); color: var(--foreground); font: inherit; outline: none; }
        .resource-search input:focus { border-color: var(--foreground); box-shadow: 0 0 0 3px color-mix(in srgb, var(--foreground) 10%, transparent); }
        .resource-filters { display: flex; flex-wrap: wrap; gap: 8px; }
        .resource-filters button { min-height: 38px; border: 1px solid var(--border); border-radius: 999px; padding: 0 14px; background: var(--background); color: var(--muted); cursor: pointer; }
        .resource-filters button.resource-filter-active { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
        .resource-result-count { margin: 0; color: var(--muted); font-size: 13px; }
        .glossary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .glossary-grid article { scroll-margin-top: 120px; border: 1px solid var(--border); border-radius: 20px; padding: 26px; background: var(--surface); }
        .glossary-topline { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: var(--muted); font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: 12px; }
        .glossary-topline strong { color: var(--foreground); font-size: 14px; }
        .glossary-grid h2 { margin: 20px 0 0; font-size: 25px; }
        .glossary-grid p { margin: 12px 0 0; color: var(--muted); line-height: 1.75; }
        .glossary-grid .glossary-summary { color: var(--foreground); font-weight: 620; }
        .glossary-grid a { display: inline-flex; margin-top: 22px; font-size: 14px; font-weight: 650; }
        .resource-empty { border: 1px dashed var(--border); border-radius: 20px; padding: 46px 24px; text-align: center; }
        .resource-empty p { margin: 10px 0 0; color: var(--muted); }
        @media (max-width: 720px) { .glossary-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
