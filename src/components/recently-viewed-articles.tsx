"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./recently-viewed-articles.module.css";

interface RecentArticle {
  slug: string;
  title: string;
  href: string;
  visitedAt: string;
}

const STORAGE_KEY = "linqingan:recent-articles";

function readRecentArticles(): RecentArticle[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentArticle =>
        Boolean(item && typeof item.slug === "string" && typeof item.title === "string" && typeof item.href === "string" && typeof item.visitedAt === "string"),
      )
      .slice(0, 6);
  } catch {
    return [];
  }
}

export function RecentlyViewedArticles() {
  const [items, setItems] = useState<RecentArticle[]>([]);

  useEffect(() => {
    const refresh = () => setItems(readRecentArticles());
    refresh();
    window.addEventListener("site:recent-articles", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("site:recent-articles", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="recently-viewed-title">
      <div className={styles.header}>
        <div>
          <p className="eyebrow">RECENTLY VIEWED</p>
          <h2 id="recently-viewed-title">继续刚才的阅读</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem(STORAGE_KEY);
            setItems([]);
          }}
        >
          清除本地记录
        </button>
      </div>
      <ol className={styles.list}>
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={item.href}>
              <strong>{item.title}</strong>
              <time dateTime={item.visitedAt}>
                {new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(item.visitedAt))}
              </time>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
