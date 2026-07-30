import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { HomeTaskHub } from "@/components/home-task-hub";
import { HomeMaintenancePanel } from "@/components/home-maintenance-panel";
import { PostCard } from "@/components/post-card";
import { beginnerSeriesSlugs, beginnerStages } from "@/lib/beginner-series";
import { knowledgeBaseSections, knowledgeBaseSlugs } from "@/lib/knowledge-base";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";

import styles from "../home.module.css";

const baseMetadata = createPageMetadata({
  title: "Screeps 中文教程、知识库与实用工具｜临清安",
  description:
    "面向中文玩家的 Screeps 新手教程、错误排查、知识库与实用工具，覆盖 Creep、Spawn、Memory、寻路、经济与自动化系统。",
  path: "/",
});

export const metadata: Metadata = {
  ...baseMetadata,
  title: { absolute: "Screeps 中文教程、知识库与实用工具｜临清安" },
};

const quickEntries = [
  {
    href: "/screeps-errors",
    eyebrow: "ERROR CODES",
    title: "查询错误码",
    description: "根据 ERR_NOT_IN_RANGE、ERR_FULL 等返回值继续排查。",
  },
  {
    href: "/glossary",
    eyebrow: "GLOSSARY",
    title: "查看术语表",
    description: "快速理解 Creep、Spawn、Memory、RCL 等常见概念。",
  },
  {
    href: "/tools/room-diagnostics",
    eyebrow: "ROOM CHECK",
    title: "诊断房间运行",
    description: "检查 Spawn、角色、Energy、Controller、工地和 CPU 风险。",
  },
  {
    href: "/tools/creep-body-calculator",
    eyebrow: "BODY TOOL",
    title: "计算 Creep 身体",
    description: "计算部件成本、生成时间、携带容量和满载移动速度。",
  },
];

export default function HomePage() {
  const allPosts = getAllPosts();
  const latestPosts = allPosts.slice(0, 2);
  const articleCount = allPosts.length;
  const knowledgeArticleCount = knowledgeBaseSlugs.length;
  const sectionCount = knowledgeBaseSections.length;

  return (
    <main className={styles.home}>
      <section className={`${styles.hero} screeps-room-grid`}>
        <Container className={styles.heroInner}>
          <p className="eyebrow">SCREEPS · JAVASCRIPT · SYSTEMS</p>
          <h1>构建，运行，迭代</h1>
          <p className={styles.heroDescription}>
            从一套按顺序学习的 Screeps 中文入门路线开始，记录代码如何逐步变成可以持续运行的系统。
          </p>
          <p className={styles.heroStats}>
            {articleCount} 篇文章 · {sectionCount} 个知识模块 · {beginnerSeriesSlugs.length} 篇新手路线
          </p>
        </Container>
      </section>

      <Container>
        <HomeTaskHub />
      </Container>

      <section className={styles.learningSection} aria-labelledby="home-learning-title">
        <Container>
          <div className={styles.sectionHeading}>
            <div><p className="eyebrow">BEGINNER PATH</p><h2 id="home-learning-title">从第一只 Creep 开始</h2></div>
            <Link href="/beginner">查看完整路线 →</Link>
          </div>

          <div className={styles.learningGrid}>
            <article className={styles.learningIntro}>
              <p>
                现有入门路线包含 {beginnerSeriesSlugs.length} 篇文章，分成 {beginnerStages.length}
                个阶段。从认识游戏界面和 tick，一直到角色分工、Extension、建造维修与第一份房间基础代码。
              </p>
              <div className={styles.statRow} aria-label="入门学习路线数据">
                <div><strong>{beginnerSeriesSlugs.length}</strong><span>篇文章</span></div>
                <div><strong>{beginnerStages.length}</strong><span>个阶段</span></div>
                <div><strong>0</strong><span>注册要求</span></div>
              </div>
            </article>

            <ol className={styles.stageList}>
              {beginnerStages.map((stage) => (
                <li key={stage.id}>
                  <span>{String(stage.number).padStart(2, "0")}</span>
                  <div><strong>{stage.title}</strong><p>{stage.description}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className={styles.knowledgeSection} aria-labelledby="home-knowledge-title">
        <Container>
          <div className={styles.knowledgeCard}>
            <div className={styles.knowledgeIntro}>
              <p className="eyebrow">SCREEPS KNOWLEDGE BASE</p>
              <h2 id="home-knowledge-title">Screeps 知识库</h2>
              <p>从基础操作到 Memory、Spawn、资源经济、寻路、防御、市场、高级资源与运行诊断。</p>
              <div className={styles.knowledgeStats} aria-label="知识库规模">
                <span><strong>{knowledgeArticleCount}</strong> 篇专题文章</span>
                <span><strong>{sectionCount}</strong> 个知识模块</span>
              </div>
              <Link href="/knowledge">进入知识库 →</Link>
            </div>
            <ol className={styles.knowledgeTopics}>
              {knowledgeBaseSections.map((section) => (
                <li key={section.id}>
                  <span>{String(section.number).padStart(2, "0")}</span>
                  <strong>{section.title}</strong>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className={styles.latestSection} aria-labelledby="latest-posts-title">
        <Container>
          <div className={styles.sectionHeading}>
            <div><p className="eyebrow">LATEST WRITING</p><h2 id="latest-posts-title">最近更新</h2></div>
            <Link href="/blog">浏览全部文章 →</Link>
          </div>
          <div className={styles.postGrid}>
            {latestPosts.map((post) => <PostCard key={post.slug} post={post} />)}
          </div>
        </Container>
      </section>

      <Container>
        <HomeMaintenancePanel />
      </Container>

      <section className={styles.quickSection} aria-labelledby="home-quick-title">
        <Container>
          <div className={styles.sectionHeading}>
            <div><p className="eyebrow">QUICK LOOKUP</p><h2 id="home-quick-title">常用查询工具</h2></div>
            <Link href="/knowledge#reference-tools">查看全部查询工具 →</Link>
          </div>
          <div className={styles.quickGrid}>
            {quickEntries.map((entry) => (
              <Link href={entry.href} key={entry.href}>
                <span className="eyebrow">{entry.eyebrow}</span>
                <strong>{entry.title}</strong>
                <p>{entry.description}</p>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
