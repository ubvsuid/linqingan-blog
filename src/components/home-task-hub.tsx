"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";

import { useBeginnerProgress } from "@/hooks/use-beginner-progress";
import { getBeginnerResumeSlug } from "@/lib/beginner-progress";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";

import styles from "./home-task-hub.module.css";

interface RecentArticle {
  slug: string;
  title: string;
  href: string;
  visitedAt: string;
}

const RECENT_STORAGE_KEY = "linqingan:recent-articles";

function parseRecentArticles(value: string | null): RecentArticle[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentArticle =>
        Boolean(
          item &&
          typeof item.slug === "string" &&
          typeof item.title === "string" &&
          typeof item.href === "string" &&
          typeof item.visitedAt === "string",
        ),
    );
  } catch {
    return [];
  }
}

function useRecentArticles() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === RECENT_STORAGE_KEY) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("site:recent-articles", onStoreChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("site:recent-articles", onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(
    () => window.localStorage.getItem(RECENT_STORAGE_KEY) ?? "[]",
    [],
  );
  const rawValue = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  return parseRecentArticles(rawValue);
}

export function HomeTaskHub() {
  const progress = useBeginnerProgress();
  const recentArticles = useRecentArticles();
  const resumeSlug = getBeginnerResumeSlug(progress);
  const resumeIndex = beginnerSeriesSlugs.indexOf(resumeSlug) + 1;
  const hasProgress = Boolean(
    progress.lastVisitedSlug || progress.completedSlugs.length > 0,
  );

  return (
    <section className={`${styles.hub} deferred-home-block`} aria-labelledby="home-task-title">
      <div className={styles.heading}>
        <p className="eyebrow">CHOOSE YOUR NEXT STEP</p>
        <h2 id="home-task-title">你现在想完成什么？</h2>
        <p>按当前状态进入学习路线、直接解决问题，或系统查阅专题知识。</p>
      </div>

      <div className={styles.grid}>
        <article className={`${styles.card} ${styles.primary}`}>
          <span className={styles.number}>01</span>
          <p className="eyebrow">按顺序学习</p>
          <h3>{hasProgress ? "继续上次的新手路线" : "从零开始学习 Screeps"}</h3>
          <p>
            {hasProgress
              ? `已完成 ${progress.completedSlugs.length} / ${beginnerSeriesSlugs.length} 篇，从第 ${resumeIndex} 篇继续。`
              : "从游戏界面、tick 和第一只 Creep 开始，逐步写出可运行的房间基础代码。"}
          </p>
          <Link href={`/blog/${resumeSlug}`}>
            {hasProgress ? "继续学习" : "开始新手路线"} <span aria-hidden="true">→</span>
          </Link>
        </article>

        <article className={styles.card}>
          <span className={styles.number}>02</span>
          <p className="eyebrow">解决当前问题</p>
          <h3>搜索错误码、API 或中文问题</h3>
          <p>支持 Creep、Memory、ERR_NOT_IN_RANGE、Spawn 失败、CPU bucket 等常见说法。</p>
          <form action="/search" role="search">
            <label htmlFor="home-task-search">描述你遇到的问题</label>
            <div>
              <input id="home-task-search" name="q" type="search" placeholder="例如：Creep 不移动" />
              <button type="submit" aria-label="搜索网站">搜索</button>
            </div>
          </form>
        </article>

        <article className={styles.card}>
          <span className={styles.number}>03</span>
          <p className="eyebrow">按主题查阅</p>
          <h3>进入系统知识库与工具</h3>
          <p>按 Memory、Spawn、经济、寻路、防御、市场和运行诊断查找专题内容。</p>
          <div className={styles.links}>
            <Link href="/knowledge">浏览知识库 →</Link>
            <Link href="/tools">打开工具中心 →</Link>
          </div>
        </article>
      </div>

      {recentArticles.length > 0 ? (
        <div className={styles.recent} aria-label="最近阅读">
          <span>最近阅读</span>
          <div>
            {recentArticles.slice(0, 3).map((article) => (
              <Link href={article.href} key={article.slug}>
                <strong>{article.title}</strong>
                <small>继续阅读 →</small>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
