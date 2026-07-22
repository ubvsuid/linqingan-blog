import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/container";
import { beginnerSeriesSlugs } from "@/lib/beginner-series";
import { knowledgeBaseSections, knowledgeBaseSlugs } from "@/lib/knowledge-base";
import { createPageMetadata } from "@/lib/metadata";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "关于临清安",
  description:
    "认识临清安，了解这个网站正在建设的 Screeps 中文知识库、JavaScript 实践、代码验证与实用工具。",
  path: "/about",
  image: "/profile-avatar.webp",
});

const currentFocus = [
  {
    number: "01",
    title: "补充 Screeps 专题模块",
    description:
      "围绕现有知识模块继续补齐关键问题，并保持明确的学习顺序、文章归属和上下文链接。",
  },
  {
    number: "02",
    title: "增加代码验证与运行证据",
    description:
      "持续核对官方文档、检查 JavaScript 语法、补充离线模拟，并在获得真实日志后记录实际运行结果。",
  },
  {
    number: "03",
    title: "建设 Screeps 实用工具",
    description:
      "逐步加入 Creep 身体计算、常用 API 查询和房间运行诊断，让资料中心不仅能读，也能直接使用。",
  },
];

const interests = [
  {
    title: "Screeps",
    description: "游戏机制、房间自动化、角色分工与长期运行的代码系统。",
  },
  {
    title: "JavaScript",
    description: "从新手可读代码到模块拆分、状态管理与工程实践。",
  },
  {
    title: "系统设计",
    description: "怎样把多个小功能组织成稳定、可维护、能持续迭代的系统。",
  },
  {
    title: "内容建设",
    description: "把复杂知识拆成清晰路线，让文章真正解决读者当前的问题。",
  },
];

const principles = [
  {
    number: "01",
    title: "先让新手看懂",
    description:
      "入门内容只讲读者当前会接触到的问题。复杂机制、工程架构与性能优化会进入对应的专题模块。",
  },
  {
    number: "02",
    title: "每篇解决一个问题",
    description:
      "文章不为了显得专业而堆知识，而是先回答一个明确问题，再给出可以观察和验证的结果。",
  },
  {
    number: "03",
    title: "明确验证边界",
    description:
      "官方文档核对、语法检查、离线模拟与真实主循环验证会分别标记，不把模拟结果写成服务器实测。",
  },
];

const profileLinks = [
  {
    href: "/beginner",
    label: "入门",
    title: "从第一篇开始学习 Screeps",
  },
  {
    href: "/knowledge",
    label: "知识库",
    title: "按问题进入对应知识模块",
  },
  {
    href: "/blog",
    label: "文章",
    title: "浏览全部公开内容",
  },
  {
    href: "/resources",
    label: "资料",
    title: "查询术语、错误码和文章标签",
  },
  {
    href: "/projects",
    label: "项目",
    title: "查看正在建设的系统与网站",
  },
  {
    href: "/now",
    label: "近况",
    title: "查看最近正在推进的工作",
  },
];

export default function AboutPage() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "临清安",
    alternateName: "@linqingan501",
    url: `${siteConfig.url}/about`,
    image: `${siteConfig.url}/profile-avatar.webp`,
    email: siteConfig.author.email,
    sameAs: [siteConfig.links.github],
    knowsAbout: ["Screeps", "JavaScript", "系统设计", "内容建设"],
  };

  return (
    <main className="page-shell profile-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <Container>
        <section className="profile-hero" aria-labelledby="profile-name">
          <div className="profile-avatar-frame">
            <Image
              className="profile-avatar"
              src="/profile-avatar.webp"
              alt="临清安的个人头像：海边背影与飞翔的海鸟"
              width={512}
              height={512}
              sizes="(max-width: 640px) 128px, 180px"
              priority
            />
          </div>

          <div className="profile-identity">
            <p className="eyebrow">PERSONAL PROFILE</p>
            <h1 id="profile-name">临清安</h1>
            <p className="profile-handle">@linqingan501</p>
            <p className="profile-role">Screeps 玩家 · JavaScript 学习者 · 系统建设记录者</p>
          </div>
        </section>

        <section className="profile-introduction" aria-labelledby="profile-introduction-title">
          <div>
            <p className="eyebrow">INTRODUCTION</p>
            <h2 id="profile-introduction-title">你好，我是临清安</h2>
          </div>
          <div className="profile-introduction-copy">
            <p className="lead">
              我正在把玩 Screeps、写 JavaScript 和搭建长期运行系统的过程，整理成一套清晰、可验证、能够持续扩展的中文内容。
            </p>
            <p>
              网站先用 {beginnerSeriesSlugs.length} 篇新手路线帮助第一次接触 Screeps 的玩家建立基础，再通过 {knowledgeBaseSections.length} 个知识模块继续解决 Memory、Spawn、资源经济、寻路、Controller、建设防御、高级资源和运行诊断问题。
            </p>
            <p>
              接下来的重点是补齐专题内容、增加代码验证证据，并把资料中心逐步扩展成可以直接使用的 Screeps 工具集合。
            </p>
          </div>
        </section>

        <section className="profile-stats" aria-label="网站当前数据">
          <div>
            <strong>{beginnerSeriesSlugs.length}</strong>
            <span>篇入门文章</span>
          </div>
          <div>
            <strong>{knowledgeBaseSlugs.length}</strong>
            <span>篇专题文章</span>
          </div>
          <div>
            <strong>{knowledgeBaseSections.length}</strong>
            <span>个知识模块</span>
          </div>
          <div>
            <strong>{projects.length}</strong>
            <span>个公开项目</span>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="profile-focus-title">
          <div className="profile-section-heading">
            <p className="eyebrow">CURRENT FOCUS</p>
            <h2 id="profile-focus-title">我现在在做什么</h2>
          </div>
          <div className="profile-focus-grid">
            {currentFocus.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="profile-section" aria-labelledby="profile-interests-title">
          <div className="profile-section-heading">
            <p className="eyebrow">INTERESTS</p>
            <h2 id="profile-interests-title">我关注的方向</h2>
          </div>
          <div className="profile-interest-grid">
            {interests.map((interest) => (
              <article key={interest.title}>
                <h3>{interest.title}</h3>
                <p>{interest.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="profile-section" aria-labelledby="profile-navigation-title">
          <div className="profile-section-heading">
            <p className="eyebrow">EXPLORE</p>
            <h2 id="profile-navigation-title">从这里继续了解我</h2>
          </div>
          <div className="profile-link-grid">
            {profileLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="profile-section" aria-labelledby="profile-principles-title">
          <div className="profile-section-heading">
            <p className="eyebrow">EDITORIAL PRINCIPLES</p>
            <h2 id="profile-principles-title">写作与验证原则</h2>
          </div>
          <div className="profile-principle-list">
            {principles.map((principle) => (
              <article key={principle.number}>
                <span>{principle.number}</span>
                <div>
                  <h3>{principle.title}</h3>
                  <p>{principle.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="profile-contact" aria-labelledby="profile-contact-title">
          <div>
            <p className="eyebrow">CONTACT</p>
            <h2 id="profile-contact-title">联系与纠错</h2>
            <p>发现文章存在错误、表述不清或示例代码有问题时，可以通过邮箱或 GitHub 联系我。</p>
          </div>
          <div className="profile-contact-links">
            <a href={`mailto:${siteConfig.author.email}`}>{siteConfig.author.email}</a>
            <a href={siteConfig.links.github} rel="noreferrer" target="_blank">
              GitHub ↗
            </a>
            <Link href="/projects">查看项目 →</Link>
          </div>
        </section>
      </Container>

      <style>{`
        .profile-page { padding-top: 38px; }
        .profile-hero { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 44px; align-items: center; padding: 42px 0 62px; border-bottom: 1px solid var(--border); }
        .profile-avatar-frame { width: 180px; height: 180px; overflow: hidden; border: 1px solid var(--border); border-radius: 50%; background: var(--surface); box-shadow: 0 18px 54px color-mix(in srgb, var(--foreground) 10%, transparent); }
        .profile-avatar { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; transform: scale(1.02); }
        .profile-identity h1 { margin: 6px 0 8px; font-size: clamp(54px, 9vw, 92px); line-height: .95; letter-spacing: -.065em; }
        .profile-handle { margin: 0; color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 14px; }
        .profile-role { max-width: 660px; margin: 24px 0 0; color: var(--muted); font-size: clamp(18px, 2.4vw, 24px); line-height: 1.55; }
        .profile-introduction, .profile-section, .profile-contact { display: grid; grid-template-columns: minmax(220px, .7fr) minmax(0, 1.3fr); gap: 64px; padding: 72px 0; border-bottom: 1px solid var(--border); }
        .profile-introduction h2, .profile-section-heading h2, .profile-contact h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 52px); line-height: 1.08; letter-spacing: -.045em; }
        .profile-introduction-copy { color: var(--muted); font-size: 17px; line-height: 1.85; }
        .profile-introduction-copy p { margin: 0; }
        .profile-introduction-copy p + p { margin-top: 18px; }
        .profile-introduction-copy .lead { color: var(--foreground); font-size: 21px; line-height: 1.7; }
        .profile-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-bottom: 1px solid var(--border); }
        .profile-stats div { display: grid; gap: 8px; padding: 34px 26px; }
        .profile-stats div + div { border-left: 1px solid var(--border); }
        .profile-stats strong { font-size: clamp(30px, 4vw, 44px); letter-spacing: -.04em; }
        .profile-stats span { color: var(--muted); font-size: 13px; }
        .profile-focus-grid { display: grid; }
        .profile-focus-grid article { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 8px 18px; border-top: 1px solid var(--border); padding: 24px 0; }
        .profile-focus-grid article:last-child { border-bottom: 1px solid var(--border); }
        .profile-focus-grid article > span, .profile-principle-list article > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .profile-focus-grid h3, .profile-interest-grid h3, .profile-principle-list h3 { margin: 0; font-size: 20px; }
        .profile-focus-grid p, .profile-interest-grid p, .profile-principle-list p, .profile-contact p { margin: 9px 0 0; color: var(--muted); line-height: 1.75; }
        .profile-focus-grid article > p { grid-column: 2; }
        .profile-interest-grid, .profile-link-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .profile-interest-grid article { min-height: 170px; border: 1px solid var(--border); border-radius: 18px; padding: 24px; background: var(--surface); }
        .profile-link-grid a { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; min-height: 150px; align-content: space-between; border: 1px solid var(--border); border-radius: 18px; padding: 22px; background: var(--surface); transition: transform 160ms ease, border-color 160ms ease; }
        .profile-link-grid a:hover { transform: translateY(-3px); border-color: var(--muted); text-decoration: none; }
        .profile-link-grid a > span:first-child { color: var(--muted); font-size: 13px; }
        .profile-link-grid strong { align-self: end; font-size: 18px; line-height: 1.45; }
        .profile-link-grid a > span:last-child { grid-column: 2; grid-row: 1 / span 2; align-self: center; font-size: 24px; }
        .profile-principle-list { display: grid; border-top: 1px solid var(--border); }
        .profile-principle-list article { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 20px; border-bottom: 1px solid var(--border); padding: 24px 0; }
        .profile-contact { border-bottom: 0; padding-bottom: 30px; }
        .profile-contact-links { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 12px; }
        .profile-contact-links a { display: inline-flex; min-height: 44px; align-items: center; border: 1px solid var(--border); border-radius: 999px; padding: 0 16px; font-weight: 650; }
        .profile-contact-links a:hover { border-color: var(--muted); text-decoration: none; }
        @media (max-width: 800px) {
          .profile-introduction, .profile-section, .profile-contact { grid-template-columns: 1fr; gap: 32px; }
          .profile-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .profile-stats div:nth-child(3) { border-top: 1px solid var(--border); border-left: 0; }
          .profile-stats div:nth-child(4) { border-top: 1px solid var(--border); }
        }
        @media (max-width: 620px) {
          .profile-page { padding-top: 10px; }
          .profile-hero { grid-template-columns: 128px minmax(0, 1fr); gap: 22px; padding: 28px 0 42px; }
          .profile-avatar-frame { width: 128px; height: 128px; }
          .profile-identity h1 { font-size: clamp(42px, 15vw, 62px); }
          .profile-role { grid-column: 1 / -1; margin-top: 18px; font-size: 17px; }
          .profile-interest-grid, .profile-link-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 420px) {
          .profile-hero { grid-template-columns: 104px minmax(0, 1fr); gap: 18px; }
          .profile-avatar-frame { width: 104px; height: 104px; }
          .profile-stats { grid-template-columns: 1fr; }
          .profile-stats div + div, .profile-stats div:nth-child(3), .profile-stats div:nth-child(4) { border-top: 1px solid var(--border); border-left: 0; }
        }
      `}</style>
    </main>
  );
}
