"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatDate } from "@/lib/date";
import type { VerifiedContentRecord, VerifiedEvidencePreview } from "@/lib/verified-content";

import styles from "./verified-content-explorer.module.css";

function formatEvidencePreview(evidence: VerifiedEvidencePreview): string {
  const parts: string[] = [evidence.evidenceKey, evidence.apiName];
  if (evidence.returnCode) parts.push(`返回 ${evidence.returnCode}`);
  if (evidence.gameTime !== null) parts.push(`Game.time ${evidence.gameTime}`);
  if (evidence.tickStart !== null && evidence.tickEnd !== null) {
    parts.push(`Tick ${evidence.tickStart}–${evidence.tickEnd}`);
  }
  return parts.join(" · ");
}

function isWithinDays(date: string, days: number): boolean {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return false;
  return timestamp >= Date.now() - days * 24 * 60 * 60 * 1000;
}

export function VerifiedContentExplorer({ posts }: { posts: VerifiedContentRecord[] }) {
  const [level, setLevel] = useState("all");
  const [apiName, setApiName] = useState("all");
  const [returnCode, setReturnCode] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const apiNames = useMemo(
    () => [...new Set(posts.flatMap((post) => post.evidence.map((item) => item.apiName)))].sort(),
    [posts],
  );
  const returnCodes = useMemo(
    () => [...new Set(posts.flatMap((post) => post.evidence.flatMap((item) => item.returnCode ? [item.returnCode] : [])))].sort(
      (left, right) => Number(left) - Number(right),
    ),
    [posts],
  );

  const filteredPosts = useMemo(
    () => posts.filter((post) => {
      const levelMatches =
        level === "all" ||
        (level === "console" && post.consoleTested) ||
        (level === "live" && post.liveTested);
      const apiMatches = apiName === "all" || post.evidence.some((item) => item.apiName === apiName);
      const returnMatches = returnCode === "all" || post.evidence.some((item) => item.returnCode === returnCode);
      const dateMatches =
        dateRange === "all" ||
        (dateRange === "30" && isWithinDays(post.date, 30)) ||
        (dateRange === "90" && isWithinDays(post.date, 90)) ||
        (dateRange === "365" && isWithinDays(post.date, 365));
      return levelMatches && apiMatches && returnMatches && dateMatches;
    }),
    [apiName, dateRange, level, posts, returnCode],
  );

  const hasFilters = level !== "all" || apiName !== "all" || returnCode !== "all" || dateRange !== "all";

  return (
    <section className={styles.explorer} aria-labelledby="verified-explorer-title">
      <div className={styles.filterPanel}>
        <div>
          <p className="eyebrow">FILTER EVIDENCE</p>
          <h2 id="verified-explorer-title">按验证级别、API、返回码或时间筛选</h2>
          <p>筛选只使用已经通过文章验证边界并进入公开列表的 accepted Evidence。</p>
        </div>
        <div className={styles.filters}>
          <label>
            <span>验证级别</span>
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="all">全部</option>
              <option value="console">Console</option>
              <option value="live">Live / 多 tick</option>
            </select>
          </label>
          <label>
            <span>API</span>
            <select value={apiName} onChange={(event) => setApiName(event.target.value)}>
              <option value="all">全部 API</option>
              {apiNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            <span>返回码</span>
            <select value={returnCode} onChange={(event) => setReturnCode(event.target.value)}>
              <option value="all">全部返回码</option>
              {returnCodes.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
          </label>
          <label>
            <span>时间</span>
            <select value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
              <option value="all">全部时间</option>
              <option value="30">最近 30 天</option>
              <option value="90">最近 90 天</option>
              <option value="365">最近 1 年</option>
            </select>
          </label>
          <button
            type="button"
            disabled={!hasFilters}
            onClick={() => {
              setLevel("all");
              setApiName("all");
              setReturnCode("all");
              setDateRange("all");
            }}
          >
            清除筛选
          </button>
        </div>
      </div>

      <p className={styles.resultCount} aria-live="polite">
        当前显示 {filteredPosts.length} / {posts.length} 篇已验证内容
      </p>

      {filteredPosts.length > 0 ? (
        <div className={styles.list} aria-label="筛选后的已验证文章">
          {filteredPosts.map((post) => (
            <article key={post.id}>
              <div className={styles.evidenceMeta}>
                <strong>{post.level === "live" ? "真实主循环" : "Screeps Console"}</strong>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.testEnvironment ? <span>{post.testEnvironment}</span> : null}
                {post.evidenceCount > 0 ? <span>{post.evidenceCount} 条运行证据</span> : null}
              </div>
              <div>
                <h3><Link href={post.href}>{post.title}</Link></h3>
                <p>{post.description}</p>
                {post.evidence.length > 0 ? (
                  <div className={styles.runtimeEvidence}>
                    <strong>已接受的结构化证据</strong>
                    {post.evidence.slice(0, 4).map((evidence) => (
                      <span key={evidence.evidenceKey}>{formatEvidencePreview(evidence)}</span>
                    ))}
                  </div>
                ) : post.latestEvidence ? (
                  <div className={styles.runtimeEvidence}>
                    <strong>最近一条结构化证据</strong>
                    <span>{formatEvidencePreview(post.latestEvidence)}</span>
                  </div>
                ) : null}
                <Link className={styles.articleLink} href={post.href}>查看文章验证状态 →</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <strong>没有符合当前筛选条件的公开证据。</strong>
          <p>可以清除筛选，或前往 Verification Coverage 查看下一批 Runtime Evidence 计划。</p>
          <Link href="/verification/coverage">查看验证覆盖 →</Link>
        </div>
      )}
    </section>
  );
}
