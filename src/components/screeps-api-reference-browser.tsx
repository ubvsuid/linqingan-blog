"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { ScreepsApiReferenceEntry } from "@/lib/screeps-api-reference";

import styles from "./screeps-api-reference-browser.module.css";

function normalize(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

export function ScreepsApiReferenceBrowser({
  entries,
  groups,
}: {
  entries: ScreepsApiReferenceEntry[];
  groups: string[];
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("全部");
  const normalizedQuery = normalize(query);

  const filtered = useMemo(
    () => entries.filter((entry) => {
      if (group !== "全部" && entry.group !== group) return false;
      if (!normalizedQuery) return true;
      return normalize([
        entry.object,
        entry.method,
        entry.signature,
        entry.summary,
        entry.group,
      ].join(" ")).includes(normalizedQuery);
    }),
    [entries, group, normalizedQuery],
  );

  return (
    <div className={styles.browser}>
      <div className={styles.controls}>
        <label>
          <span>查询 API</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如 moveTo、Market、Controller"
            autoComplete="off"
          />
        </label>
        <label>
          <span>对象分组</span>
          <select value={group} onChange={(event) => setGroup(event.target.value)}>
            <option value="全部">全部分组</option>
            {groups.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className={styles.summary} aria-live="polite">
        <strong>{filtered.length}</strong>
        <span> / {entries.length} 个常用 API</span>
      </div>

      {filtered.length > 0 ? (
        <div className={styles.groups}>
          {groups.map((groupName) => {
            const groupEntries = filtered.filter((entry) => entry.group === groupName);
            if (groupEntries.length === 0) return null;
            return (
              <section key={groupName} className={styles.group}>
                <header>
                  <h2>{groupName}</h2>
                  <span>{groupEntries.length} 项</span>
                </header>
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">对象 / 方法</th>
                        <th scope="col">调用形式</th>
                        <th scope="col">用途</th>
                        <th scope="col">站内指南</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupEntries.map((entry) => (
                        <tr key={`${entry.object}.${entry.method}`}>
                          <td><strong>{entry.object}.{entry.method}</strong></td>
                          <td><code>{entry.signature}</code></td>
                          <td>{entry.summary}</td>
                          <td>
                            {entry.guideHref ? <Link href={entry.guideHref}>查看指南 →</Link> : <span>使用站内搜索</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <strong>没有匹配的 API</strong>
          <p>可以只输入对象名、方法名或更短关键词。</p>
        </div>
      )}
    </div>
  );
}
