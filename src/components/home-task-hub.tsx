"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";

import { useBeginnerProgress } from "@/hooks/use-beginner-progress";
import { getBeginnerResumeSlug } from "@/lib/beginner-progress";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";

import { HomeKnowledgeOs } from "./home-knowledge-os";
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

function trackHomeAction(action: string) {
  track("home_task_action", { action });
}

const popularSearches = [
  ["Spawn 不工作", "spawn 不工作"],
  ["Creep 不移动", "Creep 不移动"],
  ["ERR_NOT_ENOUGH_ENERGY", "ERR_NOT_ENOUGH_ENERGY"],
  ["PathFinder", "PathFinder"],
  ["房间布局", "房间布局"],
] as const;

export function HomeTaskHub() {
  const progress = useBeginnerProgress();
  const recentArticles = useRecentArticles();
  const resumeSlug = getBeginnerResumeSlug(progress);
  const resumeIndex = beginnerSeriesSlugs.indexOf(resumeSlug) + 1;
  const hasProgress = Boolean(
    progress.lastVisitedSlug || progress.completedSlugs.length > 0,
  );

  return (
    <>
      <section className={styles.hub} aria-labelledby="home-task-title">
        <div className={styles.heading}>
          <p className="eyebrow">START WITH A QUESTION</p>
          <h2 id="home-task-title">你现在想完成什么？从一个问题开始。</h2>
        </div>

        <form
          action="/search"
          className={styles.search}
          role="search"
          onSubmit={() => trackHomeAction("submit_search")}
        >
          <label className={styles.srOnly} htmlFor="home-task-search">搜索 Screeps 问题</label>
          <span aria-hidden="true">⌕</span>
          <input
            id="home-task-search"
            name="q"
            type="search"
            placeholder="例如：spawn 不工作、Creep 不移动、ERR_NOT_IN_RANGE"
          />
          <button type="submit">搜索全站 <span aria-hidden="true">→</span></button>
        </form>

        <div className={styles.popular} aria-label="热门搜索">
          <span>POPULAR</span>
          {popularSearches.map(([label, query]) => (
            <Link
              href={"/search?q=" + encodeURIComponent(query)}
              key={query}
              onClick={() => trackHomeAction("popular_search")}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className={styles.context}>
          <Link
            href={"/blog/" + resumeSlug}
            onClick={() => trackHomeAction(hasProgress ? "resume_beginner" : "start_beginner")}
          >
            <small>{hasProgress ? "CONTINUE LEARNING" : "BEGINNER ROADMAP"}</small>
            <strong>{hasProgress ? "继续第 " + resumeIndex + " 篇" : "从第一只 Creep 开始"}</strong>
            <span>{hasProgress ? progress.completedSlugs.length + " / " + beginnerSeriesSlugs.length + " 已完成" : "开始学习 →"}</span>
          </Link>
          <Link href="/knowledge" onClick={() => trackHomeAction("open_knowledge")}>
            <small>KNOWLEDGE</small>
            <strong>按系统查知识</strong>
            <span>知识地图 →</span>
          </Link>
          <Link href="/tools" onClick={() => trackHomeAction("open_tools")}>
            <small>TOOLS</small>
            <strong>先计算，再改代码</strong>
            <span>工具中心 →</span>
          </Link>
        </div>

        {recentArticles.length > 0 ? (
          <div className={styles.recent} aria-label="最近阅读">
            <span>最近阅读</span>
            <div>
              {recentArticles.slice(0, 3).map((article) => (
                <Link
                  href={article.href}
                  key={article.slug}
                  onClick={() => trackHomeAction("resume_recent_article")}
                >
                  {article.title} <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <HomeKnowledgeOs locale="zh" />
    </>
  );
}
