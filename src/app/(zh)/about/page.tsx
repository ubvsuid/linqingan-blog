import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";
import { getSiteStatus } from "@/lib/site-status";

import styles from "./about.module.css";

export const metadata = createPageMetadata({
  title: "关于临清安",
  description:
    "认识临清安，了解这个 Screeps 中文知识站为什么建立、如何组织内容、公开项目怎样推进，以及文章如何区分不同验证状态。",
  path: "/about",
  image: "/profile-avatar.webp",
});

const contentMethods = [
  {
    number: "01",
    title: "先解决一个真实问题",
    description: "每篇文章围绕一个明确问题展开，不为了覆盖更多关键词而把多个搜索意图堆在一起。",
  },
  {
    number: "02",
    title: "代码必须说明边界",
    description: "对象、返回值、适用条件和仍未验证的部分都会尽量写清楚，让读者知道代码解决了什么，也知道它没有证明什么。",
  },
  {
    number: "03",
    title: "发现问题就继续修正",
    description: "文章不是发布后永久不变的成品。官方文档、代码检查和真实运行材料都会用于后续核对与更新。",
  },
];

const currentWork = [
  "继续补齐现有 Screeps 专题模块中的关键问题",
  "收集真实 Console 返回值和多 tick 运行材料",
  "继续完善已上线工具，并补充常用 Screeps API 快速查询",
];

const readingPaths = [
  {
    href: "/beginner",
    label: "第一次接触 Screeps",
    title: "从新手路线开始",
    description: "按顺序认识游戏、控制 Creep，并完成第一份房间基础代码。",
  },
  {
    href: "/knowledge",
    label: "已经遇到具体问题",
    title: "进入知识库与查询工具",
    description: "按专题继续学习，或查询术语、错误码、标签、工具和验证方法。",
  },
  {
    href: "/verification",
    label: "想了解内容依据",
    title: "查看文章验证方法",
    description: "了解文档核对、语法检查、离线模拟、Console 与真实主循环验证的区别。",
  },
];

export default function AboutPage() {
  const status = getSiteStatus();
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "临清安",
    alternateName: "@linqingan501",
    url: `${siteConfig.url}/about`,
    image: `${siteConfig.url}/profile-avatar.webp`,
    email: siteConfig.author.email,
    sameAs: [siteConfig.links.github],
    knowsAbout: ["Screeps", "JavaScript", "系统设计", "技术写作"],
  };

  return (
    <main className={`page-shell ${styles.page}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
      />

      <Container>
        <section className={styles.hero} aria-labelledby="profile-name">
          <div className={styles.avatarFrame}>
            <Image
              className={styles.avatar}
              src="/profile-avatar.webp"
              alt="临清安的个人头像：海边背影与飞翔的海鸟"
              width={512}
              height={512}
              sizes="(max-width: 640px) 132px, 180px"
              priority
            />
          </div>
          <div className={styles.identity}>
            <p className="eyebrow">ABOUT</p>
            <h1 id="profile-name">临清安</h1>
            <p className={styles.handle}>@linqingan501</p>
            <p className={styles.role}>Screeps 中文知识站作者 · JavaScript 实践者 · 系统建设记录者</p>
          </div>
        </section>

        <section className={styles.twoColumn} aria-labelledby="profile-story-title">
          <div><p className="eyebrow">WHY THIS SITE</p><h2 id="profile-story-title">我为什么建立这个网站</h2></div>
          <div className={styles.storyCopy}>
            <p className={styles.lead}>我喜欢构建能够在没有人工干预的情况下，持续运行和自我调整的系统。</p>
            <p>Screeps 把代码、资源管理和长期运行放进同一个世界。这个网站用来把学习、编写和整理这些系统时遇到的问题，沉淀成清晰、可查找的中文内容。</p>
            <p>文章不只说明某个 API 是什么，也会交代代码应该观察什么、失败时怎样根据返回值继续排查，以及哪些结论仍然缺少真实环境证据。</p>
            <p>目标不是尽快堆积文章数量，而是让内容能够被查到、被理解、被验证，并在发现问题后继续修正。</p>
          </div>
        </section>

        <section className={styles.stats} aria-label="网站当前公开内容">
          <div><strong>{status.beginnerCount}</strong><span>篇入门文章</span></div>
          <div><strong>{status.knowledgeArticleCount}</strong><span>篇专题文章</span></div>
          <div><strong>{status.knowledgeSectionCount}</strong><span>个知识模块</span></div>
          <div><strong>{status.toolCount}</strong><span>个在线工具</span></div>
        </section>
        <p className={styles.statsNote}>这些数字从当前公开内容自动计算，不代表所有示例都已经完成真实 Screeps 服务器验证。</p>

        <section className={styles.section} aria-labelledby="profile-method-title">
          <div className={styles.sectionHeading}><p className="eyebrow">METHOD</p><h2 id="profile-method-title">我怎样处理内容</h2></div>
          <div className={styles.methodList}>
            {contentMethods.map((method) => (
              <article key={method.number}>
                <span>{method.number}</span>
                <div><h3>{method.title}</h3><p>{method.description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.twoColumn} aria-labelledby="profile-trust-title">
          <div><p className="eyebrow">TRUST</p><h2 id="profile-trust-title">关于内容可信度</h2></div>
          <div className={styles.trustCopy}>
            <p>网站会区分官方文档核对、JavaScript 语法检查、离线模拟、Screeps Console 验证和真实主循环验证。</p>
            <p>没有真实日志支持的内容会明确保留“待环境验证”。一次 Console 成功，也不会被扩大描述成长期稳定运行。</p>
            <Link href="/verification">查看完整的文章验证方法 →</Link>
          </div>
        </section>

        <section id="public-projects" className={styles.section} aria-labelledby="profile-projects-title">
          <div className={styles.sectionHeading}>
            <p className="eyebrow">PUBLIC PROJECTS</p>
            <h2 id="profile-projects-title">公开建设项目</h2>
            <p>这里只保留项目定位、当前成果摘要和下一步入口，详细变化交给对应页面与更新日志记录。</p>
          </div>
          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <article id={`project-${project.id}`} key={project.id}>
                <div className={styles.projectTopline}>
                  <span>{project.status}</span>
                  <time dateTime={project.updatedAt}>更新于 {project.updatedAt}</time>
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <p>{project.purpose}</p>
                <ul>{project.highlights.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
                <div className={styles.projectLinks}>
                  {project.id === "linqingan-com" ? (
                    <>
                      <Link href="/knowledge">浏览知识库 →</Link>
                      <Link href="/changelog">查看建设日志 →</Link>
                      <a href={siteConfig.links.repository} rel="noreferrer" target="_blank">查看 GitHub ↗</a>
                    </>
                  ) : (
                    <>
                      <Link href="/beginner">查看完整学习路线 →</Link>
                      <Link href="/verification">查看验证方法 →</Link>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.twoColumn} aria-labelledby="profile-current-title">
          <div><p className="eyebrow">CURRENT WORK</p><h2 id="profile-current-title">现在正在推进的事情</h2></div>
          <div className={styles.currentCopy}>
            <ul>{currentWork.map((item) => <li key={item}>{item}</li>)}</ul>
            <Link href="/now">查看最近进展 →</Link>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="profile-start-title">
          <div className={styles.sectionHeading}><p className="eyebrow">START HERE</p><h2 id="profile-start-title">从这里开始阅读</h2></div>
          <div className={styles.readingGrid}>
            {readingPaths.map((item) => (
              <Link href={item.href} key={item.href}>
                <span>{item.label}</span><strong>{item.title}</strong><p>{item.description}</p><span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.contact} aria-labelledby="profile-contact-title">
          <div>
            <p className="eyebrow">CONTACT</p>
            <h2 id="profile-contact-title">联系与纠错</h2>
            <p>发现文章中的事实、代码、链接或表达存在问题，欢迎通过邮箱或 GitHub 反馈。未经真实验证的结果不会直接标记为已通过。</p>
          </div>
          <div className={styles.contactLinks}>
            <a href={`mailto:${siteConfig.author.email}`}>{siteConfig.author.email}</a>
            <a href={siteConfig.links.github} rel="noreferrer" target="_blank">GitHub ↗</a>
            <Link href="/changelog">查看更新日志 →</Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
