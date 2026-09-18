"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";

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
  ["spawn not working", "spawn 不工作"],
  ["creep not moving", "Creep 不移动"],
  ["ERR_NOT_ENOUGH_ENERGY", "ERR_NOT_ENOUGH_ENERGY"],
  ["PathFinder", "PathFinder"],
  ["room layout", "房间布局"],
  ["CPU limit", "CPU bucket"],
] as const;

export function HomeTaskHub() {
  const recentArticles = useRecentArticles();

  return (
    <>
      <section className={styles.hub} aria-labelledby="home-task-title">
        <h2 className={styles.srOnly} id="home-task-title">你现在想完成什么？从一个问题开始。</h2>

        <form action="/search" className={styles.search} role="search" onSubmit={() => trackHomeAction("submit_search")}>
          <label className={styles.srOnly} htmlFor="home-task-search">搜索 Screeps 问题</label>
          <span className={styles.searchIcon} aria-hidden="true">⌕</span>
          <input id="home-task-search" name="q" type="search" placeholder={'Describe your problem, e.g. "spawn not working"'} />
          <button type="submit">Search <span aria-hidden="true">→</span></button>
        </form>

        <div className={styles.popular} aria-label="热门搜索">
          <span>Popular:</span>
          {popularSearches.map(([label, query]) => (
            <Link href={"/search?q=" + encodeURIComponent(query)} key={query} onClick={() => trackHomeAction("popular_search")}>
              {label}
            </Link>
          ))}
        </div>

        {recentArticles.length > 0 ? (
          <div className={styles.recent} aria-label="最近阅读">
            <span>最近阅读</span>
            <div>
              {recentArticles.slice(0, 3).map((article) => (
                <Link href={article.href} key={article.slug} onClick={() => trackHomeAction("resume_recent_article")}>
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
