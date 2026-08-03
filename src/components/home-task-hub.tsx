import Link from "next/link";

import styles from "@/components/home-task-hub.module.css";
import {
  HomeRecentReading,
  HomeTaskProgressCard,
} from "@/components/home-task-personalization";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";

export function HomeTaskHub() {
  return (
    <section
      className={`${styles.root} deferred-home-block`}
      aria-labelledby="home-task-title"
    >
      <div className={styles.heading}>
        <p className="eyebrow">CHOOSE YOUR NEXT STEP</p>
        <h2 id="home-task-title">你现在想完成什么？</h2>
        <p>按当前状态进入学习路线、直接解决问题，或系统查阅专题知识。</p>
      </div>

      <div className={styles.grid}>
        <HomeTaskProgressCard slugs={[...beginnerSeriesSlugs]} />

        <article className={styles.card}>
          <span className={styles.number}>02</span>
          <p className="eyebrow">解决当前问题</p>
          <h3>搜索错误码、API 或中文问题</h3>
          <p>支持 Creep、Memory、ERR_NOT_IN_RANGE、Spawn 失败、CPU bucket 等常见说法。</p>
          <form action="/search" role="search">
            <label htmlFor="home-task-search">描述你遇到的问题</label>
            <div>
              <input
                id="home-task-search"
                name="q"
                type="search"
                placeholder="例如：Creep 不移动"
              />
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
            <Link href="/knowledge#reference-tools">打开工具中心 →</Link>
          </div>
        </article>
      </div>

      <HomeRecentReading />
    </section>
  );
}
