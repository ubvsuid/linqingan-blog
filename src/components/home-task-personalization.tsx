"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";

import styles from "@/components/home-task-hub.module.css";

interface RecentArticle {
  slug: string;
  title: string;
  href: string;
  visitedAt: string;
}

interface BeginnerProgress {
  completedSlugs: string[];
  lastVisitedSlug: string | null;
}

const RECENT_STORAGE_KEY = "linqingan:recent-articles";
const PROGRESS_STORAGE_KEY = "linqingan.beginner-progress.v1";
const PROGRESS_EVENT = "linqingan:beginner-progress-change";
const EMPTY_PROGRESS = '{"completedSlugs":[],"lastVisitedSlug":null}';

function useStorageValue(key: string, eventName: string, fallback: string) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(eventName, onStoreChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(eventName, onStoreChange);
    };
  }, [eventName, key]);

  const getSnapshot = useCallback(
    () => window.localStorage.getItem(key) ?? fallback,
    [fallback, key],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => fallback);
}

function parseProgress(value: string, slugs: string[]): BeginnerProgress {
  try {
    const parsed = JSON.parse(value) as Partial<BeginnerProgress>;
    const completedSlugs = Array.isArray(parsed.completedSlugs)
      ? parsed.completedSlugs.filter(
          (slug): slug is string => typeof slug === "string" && slugs.includes(slug),
        )
      : [];
    const lastVisitedSlug =
      typeof parsed.lastVisitedSlug === "string"
      && slugs.includes(parsed.lastVisitedSlug)
        ? parsed.lastVisitedSlug
        : null;
    return { completedSlugs: [...new Set(completedSlugs)], lastVisitedSlug };
  } catch {
    return { completedSlugs: [], lastVisitedSlug: null };
  }
}

function getResumeSlug(progress: BeginnerProgress, slugs: string[]): string {
  const firstIncomplete = slugs.find(
    (slug) => !progress.completedSlugs.includes(slug),
  );

  if (!progress.lastVisitedSlug) return firstIncomplete ?? slugs[0];
  if (!progress.completedSlugs.includes(progress.lastVisitedSlug)) {
    return progress.lastVisitedSlug;
  }

  const lastVisitedIndex = slugs.indexOf(progress.lastVisitedSlug);
  return (
    slugs
      .slice(lastVisitedIndex + 1)
      .find((slug) => !progress.completedSlugs.includes(slug))
    ?? firstIncomplete
    ?? slugs[slugs.length - 1]
  );
}

function parseRecentArticles(value: string): RecentArticle[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentArticle =>
        Boolean(
          item
          && typeof item.slug === "string"
          && typeof item.title === "string"
          && typeof item.href === "string"
          && typeof item.visitedAt === "string",
        ),
    );
  } catch {
    return [];
  }
}

export function HomeTaskProgressCard({ slugs }: { slugs: string[] }) {
  const rawProgress = useStorageValue(
    PROGRESS_STORAGE_KEY,
    PROGRESS_EVENT,
    EMPTY_PROGRESS,
  );
  const progress = parseProgress(rawProgress, slugs);
  const resumeSlug = getResumeSlug(progress, slugs);
  const resumeIndex = slugs.indexOf(resumeSlug) + 1;
  const hasProgress = Boolean(
    progress.lastVisitedSlug || progress.completedSlugs.length > 0,
  );

  return (
    <article className={`${styles.card} ${styles.primary}`}>
      <span className={styles.number}>01</span>
      <p className="eyebrow">按顺序学习</p>
      <h3>{hasProgress ? "继续上次的新手路线" : "从零开始学习 Screeps"}</h3>
      <p>
        {hasProgress
          ? `已完成 ${progress.completedSlugs.length} / ${slugs.length} 篇，从第 ${resumeIndex} 篇继续。`
          : "从游戏界面、tick 和第一只 Creep 开始，逐步写出可运行的房间基础代码。"}
      </p>
      <Link href={`/blog/${resumeSlug}`}>
        {hasProgress ? "继续学习" : "开始新手路线"} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export function HomeRecentReading() {
  const rawArticles = useStorageValue(
    RECENT_STORAGE_KEY,
    "site:recent-articles",
    "[]",
  );
  const articles = parseRecentArticles(rawArticles).slice(0, 3);

  if (articles.length === 0) return null;

  return (
    <div className={styles.recent} aria-label="最近阅读">
      <span>最近阅读</span>
      <div className={styles.recentList}>
        {articles.map((article) => (
          <Link href={article.href} key={article.slug}>
            <strong>{article.title}</strong>
            <small>继续阅读 →</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
