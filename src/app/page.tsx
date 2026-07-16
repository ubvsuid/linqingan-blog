import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/container";
import { HomeLearningActions } from "@/components/home-learning-actions";
import { PostCard } from "@/components/post-card";
import { beginnerSeriesSlugs, beginnerStages } from "@/lib/beginner-series";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/lib/posts";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

import styles from "./home.module.css";

const baseMetadata = createPageMetadata({
  title: siteConfig.title,
  description:
    "从 Screeps 中文新手学习路线开始，继续阅读自动化系统、JavaScript 工程实践与真实开发记录。",
  path: "/",
});

export const metadata: Metadata = {
  ...baseMetadata,
  title: {
    absolute: siteConfig.title,
  },
};

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 3);
  const currentProject = projects[0];

  return (
    <main className={styles.home}>
      <section className={styles.hero}>
        <Container className={styles.heroInner}>
          <p className="eyebrow">SCREEPS · JAVASCRIPT · SYSTEMS</p>
          <h1>构建，运行，迭代</h1>
          <p className={styles.heroDescription}>
            从一套按顺序学习的 Screeps 中文入门路线开始，记录代码如何逐步变成可以持续运行的系统。
          </p>
          <HomeLearningActions />
        </Container>
      </section>

      <section className={styles.learningSection} aria-labelledby="home-learning-title">
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">BEGINNER PATH</p>
              <h2 id="home-learning-title">从第一只 Creep 开始</h2>
            </div>
            <Link href="/beginner">查看完整路线 →</Link>
          </div>

          <div className={styles.learningGrid}>
            <article className={styles.learningIntro}>
              <p>
                现有入门路线包含 {beginnerSeriesSlugs.length} 篇文章，分成 {beginnerStages.length}
                个阶段。从认识游戏界面和 tick，一直到角色分工、Extension、建造维修与第一份房间基础代码。
              </p>
              <div className={styles.statRow} aria-label="入门学习路线数据">
                <div>
                  <strong>{beginnerSeriesSlugs.length}</strong>
                  <span>篇文章</span>
                </div>
                <div>
                  <strong>{beginnerStages.length}</strong>
                  <span>个阶段</span>
                </div>
                <div>
                  <strong>0</strong>
                  <span>注册要求</span>
                </div>
              </div>
            </article>

            <ol className={styles.stageList}>
              {beginnerStages.map((stage) => (
                <li key={stage.id}>
                  <span>{String(stage.number).padStart(2, "0")}</span>
                  <div>
                    <strong>{stage.title}</strong>
                    <p>{stage.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className={styles.latestSection} aria-labelledby="latest-posts-title">
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">LATEST WRITING</p>
              <h2 id="latest-posts-title">最近更新</h2>
            </div>
            <Link href="/blog">浏览全部文章 →</Link>
          </div>

          <div className={styles.postGrid}>
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      </section>

      {currentProject ? (
        <section className={styles.projectSection} aria-labelledby="home-project-title">
          <Container>
            <div className={styles.projectCard}>
              <div>
                <p className="eyebrow">CURRENT PROJECT</p>
                <h2 id="home-project-title">{currentProject.title}</h2>
                <p>{currentProject.summary}</p>
              </div>
              <div className={styles.projectActions}>
                <span>{currentProject.status}</span>
                <Link href="/projects">查看项目记录 →</Link>
              </div>
            </div>
          </Container>
        </section>
      ) : null}
    </main>
  );
}
