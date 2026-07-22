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
    "认识临清安，了解这个 Screeps 中文知识站为什么建立、如何组织内容、公开项目怎样推进，以及文章如何区分不同验证状态。",
  path: "/about",
  image: "/profile-avatar.webp",
});

const contentMethods = [
  {
    number: "01",
    title: "先解决一个真实问题",
    description:
      "每篇文章围绕一个明确问题展开，不为了覆盖更多关键词而把多个搜索意图堆在一起。",
  },
  {
    number: "02",
    title: "代码必须说明边界",
    description:
      "对象、返回值、适用条件和仍未验证的部分都会尽量写清楚，让读者知道代码解决了什么，也知道它没有证明什么。",
  },
  {
    number: "03",
    title: "发现问题就继续修正",
    description:
      "文章不是发布后永久不变的成品。官方文档、代码检查和真实运行材料都会用于后续核对与更新。",
  },
];

const currentWork = [
  "继续补齐现有 Screeps 专题模块中的关键问题",
  "收集真实 Console 返回值和多 tick 运行材料",
  "开发 Creep 身体计算、API 查询和房间诊断工具",
];

const readingPaths = [
  {
    href: "/beginner",
    label: "第一次接触 Screeps",
    title: "从 12 篇新手路线开始",
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
    <main className="page-shell profile-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
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
            <p className="eyebrow">ABOUT</p>
            <h1 id="profile-name">临清安</h1>
            <p className="profile-handle">@linqingan501</p>
            <p className="profile-role">Screeps 中文知识站作者 · JavaScript 实践者 · 系统建设记录者</p>
          </div>
        </section>

        <section className="profile-story" aria-labelledby="profile-story-title">
          <div><p className="eyebrow">WHY THIS SITE</p><h2 id="profile-story-title">我为什么建立这个网站</h2></div>
          <div className="profile-story-copy">
            <p className="lead">我喜欢构建能够在没有人工干预的情况下，持续运行和自我调整的系统。</p>
            <p>Screeps 把代码、资源管理和长期运行放进同一个世界。这个网站则用来把我在学习、编写和整理这些系统时遇到的问题，沉淀成一套清晰的中文内容。</p>
            <p>我希望文章不只说明某个 API 是什么，还能交代代码应该观察什么、失败时怎样根据返回值继续排查，以及哪些结论仍然缺少真实环境证据。</p>
            <p>目标不是尽快堆积文章数量，而是让内容能够被查到、被理解、被验证，并在发现问题后继续修正。</p>
          </div>
        </section>

        <section className="profile-stats" aria-label="网站当前公开内容">
          <div><strong>{beginnerSeriesSlugs.length}</strong><span>篇入门文章</span></div>
          <div><strong>{knowledgeBaseSlugs.length}</strong><span>篇专题文章</span></div>
          <div><strong>{knowledgeBaseSections.length}</strong><span>个知识模块</span></div>
          <div><strong>{projects.length}</strong><span>个公开项目</span></div>
        </section>
        <p className="profile-stats-note">这些数字代表当前公开内容规模，不代表所有示例都已经完成真实 Screeps 服务器验证。</p>

        <section className="profile-section" aria-labelledby="profile-method-title">
          <div className="profile-section-heading"><p className="eyebrow">METHOD</p><h2 id="profile-method-title">我怎样处理内容</h2></div>
          <div className="profile-method-list">
            {contentMethods.map((method) => (
              <article key={method.number}>
                <span>{method.number}</span>
                <div><h3>{method.title}</h3><p>{method.description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="profile-trust" aria-labelledby="profile-trust-title">
          <div><p className="eyebrow">TRUST</p><h2 id="profile-trust-title">关于内容可信度</h2></div>
          <div className="profile-trust-copy">
            <p>网站会区分官方文档核对、JavaScript 语法检查、离线模拟、Screeps Console 验证和真实主循环验证。</p>
            <p>没有真实日志支持的内容会明确保留“待环境验证”。一次 Console 成功，也不会被扩大描述成长期稳定运行。</p>
            <Link href="/verification">查看完整的文章验证方法 →</Link>
          </div>
        </section>

        <section id="public-projects" className="profile-projects" aria-labelledby="profile-projects-title">
          <div className="profile-section-heading">
            <p className="eyebrow">PUBLIC PROJECTS</p>
            <h2 id="profile-projects-title">公开建设项目</h2>
            <p>这里只保留项目定位、当前成果摘要和下一步入口，详细变化交给对应页面与更新日志记录。</p>
          </div>
          <div className="profile-project-grid">
            {projects.map((project) => (
              <article id={`project-${project.id}`} key={project.id}>
                <div className="profile-project-topline">
                  <span>{project.status}</span>
                  <time dateTime={project.updatedAt}>更新于 {project.updatedAt}</time>
                </div>
                <h3>{project.title}</h3>
                <p className="profile-project-summary">{project.summary}</p>
                <p className="profile-project-purpose">{project.purpose}</p>
                <ul>
                  {project.highlights.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                </ul>
                <div className="profile-project-links">
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

        <section className="profile-section" aria-labelledby="profile-current-title">
          <div className="profile-section-heading"><p className="eyebrow">CURRENT WORK</p><h2 id="profile-current-title">现在正在推进的事情</h2></div>
          <div className="profile-current-copy">
            <ul>{currentWork.map((item) => <li key={item}>{item}</li>)}</ul>
            <Link href="/now">查看最近进展 →</Link>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="profile-start-title">
          <div className="profile-section-heading"><p className="eyebrow">START HERE</p><h2 id="profile-start-title">从这里开始阅读</h2></div>
          <div className="profile-reading-grid">
            {readingPaths.map((item) => (
              <Link href={item.href} key={item.href}>
                <span>{item.label}</span><strong>{item.title}</strong><p>{item.description}</p><span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="profile-contact" aria-labelledby="profile-contact-title">
          <div>
            <p className="eyebrow">CONTACT</p>
            <h2 id="profile-contact-title">联系与纠错</h2>
            <p>发现文章中的事实、代码、链接或表达存在问题，欢迎通过邮箱或 GitHub 反馈。未经真实验证的结果不会直接标记为已通过。</p>
          </div>
          <div className="profile-contact-links">
            <a href={`mailto:${siteConfig.author.email}`}>{siteConfig.author.email}</a>
            <a href={siteConfig.links.github} rel="noreferrer" target="_blank">GitHub ↗</a>
            <Link href="/changelog">查看更新日志 →</Link>
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
        .profile-role { max-width: 760px; margin: 24px 0 0; color: var(--muted); font-size: clamp(18px, 2.4vw, 24px); line-height: 1.55; }
        .profile-story, .profile-section, .profile-trust, .profile-contact { display: grid; grid-template-columns: minmax(220px, .7fr) minmax(0, 1.3fr); gap: 64px; padding: 72px 0; border-bottom: 1px solid var(--border); }
        .profile-story h2, .profile-section-heading h2, .profile-trust h2, .profile-contact h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 52px); line-height: 1.08; letter-spacing: -.045em; }
        .profile-story-copy, .profile-trust-copy { color: var(--muted); font-size: 17px; line-height: 1.85; }
        .profile-story-copy p, .profile-trust-copy p { margin: 0; }
        .profile-story-copy p + p, .profile-trust-copy p + p { margin-top: 18px; }
        .profile-story-copy .lead { color: var(--foreground); font-size: 22px; line-height: 1.7; }
        .profile-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-bottom: 1px solid var(--border); }
        .profile-stats div { display: grid; gap: 8px; padding: 34px 26px; }
        .profile-stats div + div { border-left: 1px solid var(--border); }
        .profile-stats strong { font-size: clamp(30px, 4vw, 44px); letter-spacing: -.04em; }
        .profile-stats span { color: var(--muted); font-size: 13px; }
        .profile-stats-note { margin: 18px 0 0; color: var(--muted); font-size: 13px; line-height: 1.7; }
        .profile-method-list { display: grid; border-top: 1px solid var(--border); }
        .profile-method-list article { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 20px; border-bottom: 1px solid var(--border); padding: 25px 0; }
        .profile-method-list article > span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .profile-method-list h3 { margin: 0; font-size: 21px; }
        .profile-method-list p, .profile-contact p { margin: 9px 0 0; color: var(--muted); line-height: 1.75; }
        .profile-trust-copy a, .profile-current-copy > a { display: inline-flex; margin-top: 24px; font-weight: 700; }
        .profile-projects { scroll-margin-top: 24px; padding: 76px 0; border-bottom: 1px solid var(--border); }
        .profile-projects > .profile-section-heading { max-width: 820px; }
        .profile-projects > .profile-section-heading > p:last-child { margin: 18px 0 0; color: var(--muted); line-height: 1.75; }
        .profile-project-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 38px; }
        .profile-project-grid > article { scroll-margin-top: 24px; display: grid; align-content: start; border: 1px solid var(--border); border-radius: 22px; padding: clamp(24px, 4vw, 34px); background: var(--surface); }
        .profile-project-topline { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; color: var(--muted); font-size: 12px; }
        .profile-project-grid h3 { margin: 24px 0 0; font-size: clamp(28px, 4vw, 40px); letter-spacing: -.045em; }
        .profile-project-summary { margin: 14px 0 0; color: var(--muted); font-size: 16px; line-height: 1.75; }
        .profile-project-purpose { margin: 22px 0 0; border-top: 1px solid var(--border); padding-top: 20px; line-height: 1.75; }
        .profile-project-grid ul { display: grid; gap: 8px; margin: 20px 0 0; padding-left: 20px; color: var(--muted); line-height: 1.65; }
        .profile-project-links { display: flex; flex-wrap: wrap; gap: 12px 18px; margin-top: 26px; }
        .profile-project-links a { font-weight: 700; }
        .profile-current-copy ul { display: grid; margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
        .profile-current-copy li { position: relative; border-bottom: 1px solid var(--border); padding: 22px 0 22px 28px; line-height: 1.7; }
        .profile-current-copy li::before { content: ""; position: absolute; top: 31px; left: 4px; width: 7px; height: 7px; border-radius: 50%; background: var(--foreground); }
        .profile-reading-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .profile-reading-grid a { display: grid; min-height: 235px; align-content: start; border: 1px solid var(--border); border-radius: 18px; padding: 23px; background: var(--surface); transition: transform 160ms ease, border-color 160ms ease; }
        .profile-reading-grid a:hover { transform: translateY(-3px); border-color: var(--muted); text-decoration: none; }
        .profile-reading-grid a > span:first-child { color: var(--muted); font-size: 12px; }
        .profile-reading-grid strong { margin-top: 24px; font-size: 20px; line-height: 1.4; }
        .profile-reading-grid p { margin: 12px 0 0; color: var(--muted); font-size: 14px; line-height: 1.7; }
        .profile-reading-grid a > span:last-child { margin-top: auto; padding-top: 22px; font-size: 24px; }
        .profile-contact { border-bottom: 0; padding-bottom: 30px; }
        .profile-contact-links { display: flex; flex-wrap: wrap; align-content: flex-start; gap: 12px; }
        .profile-contact-links a { display: inline-flex; min-height: 44px; align-items: center; border: 1px solid var(--border); border-radius: 999px; padding: 0 16px; font-weight: 650; }
        .profile-contact-links a:hover { border-color: var(--muted); text-decoration: none; }
        @media (max-width: 900px) { .profile-project-grid, .profile-reading-grid { grid-template-columns: 1fr; } .profile-reading-grid a { min-height: 0; } }
        @media (max-width: 800px) { .profile-story, .profile-section, .profile-trust, .profile-contact { grid-template-columns: 1fr; gap: 32px; } .profile-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .profile-stats div:nth-child(3) { border-top: 1px solid var(--border); border-left: 0; } .profile-stats div:nth-child(4) { border-top: 1px solid var(--border); } }
        @media (max-width: 620px) { .profile-page { padding-top: 10px; } .profile-hero { grid-template-columns: 128px minmax(0, 1fr); gap: 22px; padding: 28px 0 42px; } .profile-avatar-frame { width: 128px; height: 128px; } .profile-identity h1 { font-size: clamp(42px, 15vw, 62px); } .profile-role { grid-column: 1 / -1; margin-top: 18px; font-size: 17px; } }
        @media (max-width: 420px) { .profile-hero { grid-template-columns: 104px minmax(0, 1fr); gap: 18px; } .profile-avatar-frame { width: 104px; height: 104px; } .profile-stats { grid-template-columns: 1fr; } .profile-stats div + div, .profile-stats div:nth-child(3), .profile-stats div:nth-child(4) { border-top: 1px solid var(--border); border-left: 0; } }
      `}</style>
    </main>
  );
}
