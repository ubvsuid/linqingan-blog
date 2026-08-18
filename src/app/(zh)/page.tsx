import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { HomeTaskHub } from "@/components/home-task-hub";
import { HomeProblemHub } from "@/components/home-problem-hub";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { changelogEntries } from "@/lib/changelog";
import { formatDate } from "@/lib/date";
import { knowledgeBaseSections, knowledgeBaseSlugs } from "@/lib/knowledge-base";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";
import { latestSiteAuditEntry } from "@/lib/site-audit-entry";
import { toolCatalog } from "@/lib/tool-catalog";

import styles from "../home.module.css";
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

const toolDemoLines: Record<string, readonly string[]> = {
  "room-diagnostics": ["Spawn  ✓", "Energy  78%", "CPU  review"],
  "creep-body-calculator": ["10 WORK", "10 CARRY", "10 MOVE"],
  "controller-downgrade-planner": ["RCL  7", "WORK  15", "Margin  check"],
  "market-terminal-cost-calculator": ["Amount  10,000", "Energy  calc", "Credits  net"],
};

const beginnerHighlights = [
  "认识 Screeps、tick 与游戏循环",
  "控制第一只 Creep",
  "采集与运输 Energy",
  "建立 Spawn 与基础房间循环",
];

const verificationLevels = [
  {
    eyebrow: "OFFICIAL DOCS",
    title: "文档确认",
    description: "API 签名、返回值和明确规则按文章逐项记录来源。",
  },
  {
    eyebrow: "OFFLINE",
    title: "离线检查",
    description: "语法、确定性模拟和边界用例与真实 Runtime 证据分开。",
  },
  {
    eyebrow: "CONSOLE",
    title: "Console 实测",
    description: "只有实际 Console 证据存在时，文章才会标记对应验证。",
  },
  {
    eyebrow: "LIVE",
    title: "主循环验证",
    description: "跨 tick 或真实房间行为必须有实际运行证据，不用推断代替。",
  },
];

const quickEntries = [
  { href: "/screeps-api", eyebrow: "API", title: "API 快速查询" },
  { href: "/screeps-errors", eyebrow: "ERROR", title: "错误码" },
  { href: "/glossary", eyebrow: "GLOSSARY", title: "术语表" },
  { href: "/search", eyebrow: "SEARCH", title: "搜索全站" },
];

const recentChangeEntries = [
  latestSiteAuditEntry,
  ...changelogEntries.filter((entry) => entry.type !== "内容"),
]
  .sort((left, right) => right.date.localeCompare(left.date))
  .slice(0, 3);

export default function HomePage() {
  const allPosts = getAllPosts();
  const latestPosts = allPosts.slice(0, 3);
  const articleCount = allPosts.length;
  const knowledgeArticleCount = knowledgeBaseSlugs.length;
  const sectionCount = knowledgeBaseSections.length;
  const featuredTools = featuredToolSlugs.flatMap((slug) => {
    const tool = toolCatalog.find((entry) => entry.slug === slug);
    return tool ? [tool] : [];
  });

  return (
    <main className={styles.home}>
      <section className={`${styles.hero} screeps-room-grid`}>
        <Container className={styles.heroInner}>
          <p className="eyebrow">SCREEPS · JAVASCRIPT · SYSTEMS</p>
          <h1>构建，运行，迭代</h1>
          <p className={styles.heroDescription}>
            面向 Screeps 玩家与 JavaScript 开发者的中文教程、API 查询、错误排查、实用工具与 Runtime Evidence 知识站。从按顺序学习的新手路线开始，再用知识库与诊断中心把代码逐步变成可以持续运行的系统。
          </p>
          <p className={styles.heroStats}>
            {articleCount} 篇文章 · {sectionCount} 个知识模块 · {beginnerSeriesSlugs.length} 篇新手路线
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/beginner">开始新手路线</Link>
            <Link className="button button-secondary" href="/diagnostics">解决当前问题</Link>
          </div>
        </Container>
      </section>

      <Container>
        <HomeTaskHub />
        <HomeProblemHub />
      </Container>

      <section className={refreshStyles.toolsSection} aria-labelledby="home-tools-title">
        <Container>
          <div className={refreshStyles.sectionHeading}>
            <div>
              <p className="eyebrow">SCREEPS TOOLBOX</p>
              <h2 id="home-tools-title">先计算，再改代码</h2>
              <p>把高频判断交给本地工具。无需 Screeps Token，不连接账号，也不会执行游戏动作。</p>
            </div>
            <Link href="/tools">查看全部 {toolCatalog.length} 个工具 →</Link>
          </div>

          <div className={refreshStyles.toolGrid}>
            {featuredTools.map((tool) => (
              <Link className={refreshStyles.toolCard} href={`/tools/${tool.slug}`} key={tool.slug}>
                <div>
                  <span className="eyebrow">{tool.eyebrow}</span>
                  <strong>{tool.zhTitle}</strong>
                  <p>{tool.zhDescription}</p>
                </div>
                <div className={refreshStyles.toolDemo} aria-label={`${tool.zhTitle} 示例视图`}>
                  <small>示例视图</small>
                  {toolDemoLines[tool.slug]?.map((line) => <code key={line}>{line}</code>)}
                </div>
                <span className={refreshStyles.cardAction}>打开工具 →</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className={refreshStyles.learningSection} aria-labelledby="home-learning-title">
        <Container>
          <div className={refreshStyles.sectionHeading}>
            <div>
              <p className="eyebrow">LEARN SCREEPS</p>
              <h2 id="home-learning-title">按你的阶段学习</h2>
              <p>第一次玩就按路线往下走；已经有基础，就直接进入专题知识模块。</p>
            </div>
          </div>

          <div className={refreshStyles.learningGrid}>
            <article className={refreshStyles.learningPanel}>
              <div className={refreshStyles.panelTopline}>
                <span>01</span>
                <p className="eyebrow">BEGINNER ROADMAP</p>
              </div>
              <h3>第一次玩 Screeps</h3>
              <p>{beginnerSeriesSlugs.length} 篇按顺序学习的新手路线，从游戏循环一路走到稳定的基础房间。</p>
              <ol className={refreshStyles.learningSteps}>
                {beginnerHighlights.map((item, index) => (
                  <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>
                ))}
              </ol>
              <Link href="/beginner">开始新手路线 →</Link>
            </article>

            <article className={refreshStyles.learningPanel}>
              <div className={refreshStyles.panelTopline}>
                <span>02</span>
                <p className="eyebrow">KNOWLEDGE MAP</p>
              </div>
              <h3>已经掌握基础</h3>
              <p>{knowledgeArticleCount} 篇专题内容组织在 {sectionCount} 个模块中，按系统而不是发布时间查资料。</p>
              <ol className={refreshStyles.moduleList}>
                {knowledgeBaseSections.map((section) => (
                  <li key={section.id}>
                    <span>{String(section.number).padStart(2, "0")}</span>
                    <strong>{section.title}</strong>
                  </li>
                ))}
              </ol>
              <Link href="/knowledge">进入知识库 →</Link>
            </article>
          </div>
        </Container>
      </section>

      <section className={refreshStyles.verificationSection} aria-labelledby="home-verification-title">
        <Container>
          <div className={refreshStyles.verificationPanel}>
            <div className={refreshStyles.verificationIntro}>
              <p className="eyebrow">RUNTIME EVIDENCE</p>
              <h2 id="home-verification-title">每一个结论，都有自己的证据等级</h2>
              <p>
                Screeps 官方文档、离线模拟、Console 实测和真实主循环不是同一件事。没有实际运行证据的结果，不会被写成“已经实服验证”。
              </p>
              <div className={refreshStyles.verificationActions}>
                <Link href="/verification">查看验证方法 →</Link>
                <Link href="/verified">查看最近验证 →</Link>
              </div>
            </div>

            <div className={refreshStyles.verificationGrid}>
              {verificationLevels.map((level) => (
                <article key={level.eyebrow}>
                  <span>{level.eyebrow}</span>
                  <strong>{level.title}</strong>
                  <p>{level.description}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className={refreshStyles.activitySection} aria-labelledby="home-activity-title">
        <Container>
          <div className={refreshStyles.sectionHeading}>
            <div>
              <p className="eyebrow">RECENT ACTIVITY</p>
              <h2 id="home-activity-title">最近发生了什么</h2>
              <p>把新内容和网站级技术修订分开看，不再重复堆叠多个“最近更新”模块。</p>
            </div>
          </div>

          <div className={refreshStyles.activityGrid}>
            <section aria-labelledby="home-latest-content">
              <div className={refreshStyles.activityColumnHeading}>
                <h3 id="home-latest-content">最近内容</h3>
                <Link href="/blog">全部文章 →</Link>
              </div>
              <div className={refreshStyles.activityList}>
                {latestPosts.map((post) => {
                  const date = post.updatedAt ?? post.publishedAt;
                  const wasUpdated = Boolean(post.updatedAt && post.updatedAt !== post.publishedAt);
                  return (
                    <Link href={`/blog/${post.slug}`} key={post.slug}>
                      <div><time dateTime={date}>{formatDate(date)}</time><span>{wasUpdated ? "更新" : "发布"}</span></div>
                      <strong>{post.title}</strong>
                      <small>阅读 →</small>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="home-latest-changes">
              <div className={refreshStyles.activityColumnHeading}>
                <h3 id="home-latest-changes">最近技术修订</h3>
                <Link href="/changelog">更新日志 →</Link>
              </div>
              <div className={refreshStyles.activityList}>
                {recentChangeEntries.map((entry) => (
                  <Link href={entry.links?.[0]?.href ?? "/changelog"} key={entry.id}>
                    <div><time dateTime={entry.date}>{formatDate(entry.date)}</time><span>{entry.type}</span></div>
                    <strong>{entry.title}</strong>
                    <small>查看 →</small>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </Container>
      </section>

      <section className={refreshStyles.quickSection} aria-labelledby="home-quick-title">
        <Container>
          <div className={refreshStyles.quickHeading}>
            <div><p className="eyebrow">QUICK LOOKUP</p><h2 id="home-quick-title">快速查询</h2></div>
            <p>已经知道自己要查什么？直接进入参考页。</p>
          </div>
          <nav className={refreshStyles.quickGrid} aria-label="Screeps 快速查询">
            {quickEntries.map((entry) => (
              <Link href={entry.href} key={entry.href}>
                <span>{entry.eyebrow}</span>
                <strong>{entry.title}</strong>
                <small aria-hidden="true">→</small>
              </Link>
            ))}
          </nav>
        </Container>
      </section>
    </main>
  );
}
