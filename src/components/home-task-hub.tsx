"use client";

import Link from "next/link";

import { useBeginnerProgress } from "@/hooks/use-beginner-progress";
import { getBeginnerResumeSlug } from "@/lib/beginner-progress";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";

export function HomeTaskHub() {
  const progress = useBeginnerProgress();
  const resumeSlug = getBeginnerResumeSlug(progress);
  const resumeIndex = beginnerSeriesSlugs.indexOf(resumeSlug) + 1;
  const hasProgress = Boolean(
    progress.lastVisitedSlug || progress.completedSlugs.length > 0,
  );

  return (
    <section className="home-task-hub" aria-labelledby="home-task-title">
      <div className="home-task-heading">
        <p className="eyebrow">CHOOSE YOUR NEXT STEP</p>
        <h2 id="home-task-title">你现在想完成什么？</h2>
        <p>按当前状态进入学习路线、直接解决问题，或系统查阅专题知识。</p>
      </div>

      <div className="home-task-grid">
        <article className="home-task-card home-task-card-primary">
          <span className="home-task-number">01</span>
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

        <article className="home-task-card home-task-card-search">
          <span className="home-task-number">02</span>
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

        <article className="home-task-card">
          <span className="home-task-number">03</span>
          <p className="eyebrow">按主题查阅</p>
          <h3>进入系统知识库与工具</h3>
          <p>按 Memory、Spawn、经济、寻路、防御、市场和运行诊断查找专题内容。</p>
          <div className="home-task-links">
            <Link href="/knowledge">浏览知识库 →</Link>
            <Link href="/knowledge#reference-tools">打开工具中心 →</Link>
          </div>
        </article>
      </div>

      <style>{`
        .home-task-hub {
          width: min(100%, 1120px);
          margin: 52px auto 0;
          text-align: left;
        }
        .home-task-heading {
          max-width: 720px;
          margin: 0 auto 24px;
          text-align: center;
        }
        .home-task-heading h2 {
          margin: 0;
          font-size: clamp(30px, 4.5vw, 48px);
          line-height: 1.08;
          letter-spacing: -.045em;
        }
        .home-task-heading > p:last-child {
          margin: 14px 0 0;
          color: var(--muted);
        }
        .home-task-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .home-task-card {
          position: relative;
          display: flex;
          min-height: 310px;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 28px;
          background: color-mix(in srgb, var(--surface) 92%, transparent);
          box-shadow: 0 18px 50px rgb(20 20 16 / 5%);
        }
        .home-task-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(color-mix(in srgb, var(--border) 34%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--border) 34%, transparent) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: linear-gradient(to bottom right, black, transparent 68%);
          opacity: .35;
        }
        .home-task-card > * { position: relative; }
        .home-task-card-primary {
          border-color: color-mix(in srgb, var(--energy-accent) 58%, var(--border));
        }
        .home-task-number {
          align-self: flex-end;
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, monospace;
          font-size: 12px;
        }
        .home-task-card .eyebrow { margin-top: 28px; }
        .home-task-card h3 {
          margin: 0;
          font-size: clamp(24px, 2.7vw, 31px);
          line-height: 1.2;
          letter-spacing: -.035em;
        }
        .home-task-card > p:not(.eyebrow) {
          margin: 14px 0 24px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
        }
        .home-task-card > a,
        .home-task-links,
        .home-task-card form { margin-top: auto; }
        .home-task-card > a,
        .home-task-links a {
          font-weight: 720;
        }
        .home-task-links { display: grid; gap: 8px; }
        .home-task-card form { display: grid; gap: 8px; }
        .home-task-card form label {
          color: var(--muted);
          font-size: 12px;
        }
        .home-task-card form > div {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
        }
        .home-task-card input,
        .home-task-card button {
          min-height: 46px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--background);
          color: var(--foreground);
        }
        .home-task-card input { min-width: 0; padding: 0 13px; }
        .home-task-card button {
          padding: 0 15px;
          background: var(--foreground);
          color: var(--background);
          font-weight: 700;
          cursor: pointer;
        }
        @media (max-width: 920px) {
          .home-task-grid { grid-template-columns: 1fr; }
          .home-task-card { min-height: 0; }
        }
        @media (max-width: 520px) {
          .home-task-hub { margin-top: 38px; }
          .home-task-card { border-radius: 18px; padding: 22px; }
        }
      `}</style>
    </section>
  );
}
