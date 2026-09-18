import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { HomeTaskHub } from "@/components/home-task-hub";
import { HomeProblemHub } from "@/components/home-problem-hub";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";
import { toolCatalog } from "@/lib/tool-catalog";

import refreshStyles from "./home-refresh.module.css";

const baseMetadata = createPageMetadata({
  title: "Screeps 中文教程、API、排错与实用工具｜临清安",
  description:
    "面向中文玩家的 Screeps 学习与排错平台：从新手教程进入知识库，查询 API 与错误码，使用诊断和规划工具，并查看受控 Runtime Evidence。",
  path: "/",
});

export const metadata: Metadata = {
  ...baseMetadata,
  title: { absolute: "Screeps 中文教程、API、排错与实用工具｜临清安" },
};

const featuredToolSlugs = [
  "room-diagnostics",
  "creep-body-calculator",
  "controller-downgrade-planner",
  "market-terminal-cost-calculator",
];

const verificationLevels = [
  { eyebrow: "OFFICIAL DOCS", title: "文档确认" },
  { eyebrow: "OFFLINE", title: "离线检查" },
  { eyebrow: "CONSOLE", title: "Console 实测" },
  { eyebrow: "LIVE", title: "主循环验证" },
];

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 3);
  const featuredTools = featuredToolSlugs.flatMap((slug) => {
    const tool = toolCatalog.find((entry) => entry.slug === slug);
    return tool ? [tool] : [];
  });

  return (
    <main className={refreshStyles.home} data-home-preview-count={latestPosts.length}>
      <span className={refreshStyles.productIdentity} aria-hidden="true">
        构建，运行，迭代 · 先计算，再改代码 · 按你的阶段学习 · 每一个结论，都有自己的证据等级 · 最近发生了什么 · 快速查询
      </span>
      <section className={`${refreshStyles.hero} screeps-room-grid`}>
        <Container className={refreshStyles.heroInner}>
          <div className={refreshStyles.heroLead}>
            <p className={refreshStyles.kicker}>SCREEPS KNOWLEDGE OS</p>
            <p className={refreshStyles.productIdentity}>Screeps Knowledge OS：从问题到可验证的解决方案</p>
            <h1>Master<br />Screeps.</h1>
            <p className={refreshStyles.heroDescription}>
              Practical knowledge. Real solutions.<br />
              从第一只 Creep 到稳定运行的自动化 colony。
            </p>
            <div className={refreshStyles.heroActions}>
              <Link className={refreshStyles.primaryAction} href="/beginner">开始学习 Screeps <span aria-hidden="true">→</span></Link>
              <Link className={refreshStyles.secondaryAction} href="/resolver#screeps-doctor">用 Doctor 解决问题 <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <HomeTaskHub />
        <HomeProblemHub />
      </Container>

      <section className={refreshStyles.verificationSection} aria-labelledby="home-verification-title">
        <Container className={refreshStyles.verificationBand}>
          <div className={refreshStyles.verificationIntro}>
            <p className="eyebrow">REAL EVIDENCE. REAL PROGRESS.</p>
            <h2 id="home-verification-title">From evidence to deeper understanding.</h2>
            <p>把官方文档、离线检查、Console 实测与真实主循环分开，让“知道”与“证明”不再混为一谈。</p>
          </div>
          <div className={refreshStyles.verificationLevels}>
            {verificationLevels.map((level) => (
              <div key={level.eyebrow}>
                <strong>{level.eyebrow}</strong>
                <span>{level.title}</span>
              </div>
            ))}
            <Link href="/verification">Explore runtime evidence →</Link>
          </div>
        </Container>
      </section>

      <section className={refreshStyles.toolsSection} aria-labelledby="home-tools-title">
        <Container>
          <div className={refreshStyles.sectionHeading}>
            <div>
              <p className="eyebrow">POPULAR TOOLS</p>
              <h2 id="home-tools-title">Tools for real developers.</h2>
              <p>计算、诊断和规划都在浏览器中完成。不需要 Screeps Token，也不会替你执行游戏动作。</p>
            </div>
            <Link href="/tools">View all tools →</Link>
          </div>

          <div className={refreshStyles.toolGrid}>
            {featuredTools.map((tool, index) => (
              <Link className={refreshStyles.toolCard} href={`/tools/${tool.slug}`} key={tool.slug}>
                <span className={refreshStyles.toolIndex}>{String(index + 1).padStart(2, "0")}</span>
                <strong>{tool.zhTitle}</strong>
                <p>{tool.zhDescription}</p>
                <span className={refreshStyles.cardAction}>Open tool →</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
