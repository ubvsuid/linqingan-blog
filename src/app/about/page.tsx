import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/container";
import { beginnerSeriesSlugs, beginnerStages } from "@/lib/beginner-series";
import { createPageMetadata } from "@/lib/metadata";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "关于临清安",
  description:
    "认识临清安，了解这个网站正在建设的 Screeps 中文学习路线、JavaScript 实践与系统项目。",
  path: "/about",
});

const profileAvatar = "https://avatars.githubusercontent.com/u/196054005?v=4";

const currentFocus = [
  {
    number: "01",
    title: "完善 Screeps 学习路线",
    description:
      "继续把新手教程衔接到基础工程，让读者从能运行第一份代码，逐步走向更稳定的房间系统。",
  },
  {
    number: "02",
    title: "建设个人技术网站",
    description:
      "持续整理内容结构、阅读体验、SEO、可访问性和发布流程，让网站本身也成为真实的工程实践。",
  },
  {
    number: "03",
    title: "记录可复用的系统经验",
    description:
      "把代码拆分、自动化、异常恢复和架构迭代中的真实问题，整理成可以理解和验证的文章。",
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
      "入门内容只讲读者当前会接触到的问题。复杂机制、工程架构与性能优化会放到独立的专业系列中。",
  },
  {
    number: "02",
    title: "每篇解决一个问题",
    description:
      "文章不为了显得专业而堆知识，而是先回答一个明确问题，再给出可以观察和验证的结果。",
  },
  {
    number: "03",
    title: "记录真实建设过程",
    description:
      "除了 Screeps，也会记录网站、JavaScript、代码架构和系统迭代中真正遇到的问题与改动。",
  },
];

const profileLinks = [
  {
    href: "/beginner",
    label: "入门",
    title: "从第一篇开始学习 Screeps",
  },
  {
    href: "/blog",
    label: "文章",
    title: "浏览全部公开内容",
  },
  {
    href: "/projects",
    label: "项目",
    title: "查看正在建设的系统与网站",
  },
  {
    href: "/now",
    label: "近况",
    title: "了解最近正在推进的事情",
  },
];

export default function AboutPage() {
  return (
    <main className="page-shell profile-page">
      <Container>
        <section className="profile-hero" aria-labelledby="profile-name">
          <Image
            className="profile-avatar"
            src={profileAvatar}
            alt="临清安的个人头像"
            width={180}
            height={180}
            priority
          />

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
              这个网站首先服务第一次接触 Screeps 的玩家。现有入门路线从认识游戏开始，一直到角色分工、Controller、Extension、建造维修和第一份房间基础代码。
            </p>
            <p>
              入门之后，我会继续记录基础工程、自动化系统、代码架构和网站建设，但不会把复杂知识提前塞给新手。
            </p>
          </div>
        </section>

        <section className="profile-stats" aria-label="网站当前数据">
          <div>
            <strong>{beginnerSeriesSlugs.length}</strong>
            <span>篇入门文章</span>
          </div>
          <div>
            <strong>{beginnerStages.length}</strong>
            <span>个学习阶段</span>
          </div>
          <div>
            <strong>{projects.length}</strong>
            <span>个公开项目</span>
          </div>
          <div>
            <strong>持续</strong>
            <span>建设与更新</span>
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
            <h2 id="profile-principles-title">写作原则</h2>
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
            <p>
              发现文章存在错误、表述不清或示例代码有问题时，可以通过邮箱或 GitHub 联系我。
            </p>
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
        .profile-page {
          padding-top: 38px;
        }

        .profile-hero {
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr);
          gap: 44px;
          align-items: center;
          padding: 42px 0 62px;
          border-bottom: 1px solid var(--border);
        }

        .profile-avatar {
          width: 180px;
          height: 180px;
          border: 1px solid var(--border);
          border-radius: 50%;
          object-fit: cover;
          background: var(--surface);
          box-shadow: 0 18px 54px color-mix(in srgb, var(--foreground) 10%, transparent);
        }

        .profile-identity h1 {
          margin: 6px 0 8px;
          font-size: clamp(54px, 9vw, 92px);
          line-height: 0.95;
          letter-spacing: -0.065em;
        }

        .profile-handle {
          margin: 0;
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 14px;
        }

        .profile-role {
          max-width: 660px;
          margin: 24px 0 0;
          color: var(--muted);
          font-size: clamp(18px, 2.4vw, 24px);
          line-height: 1.55;
        }

        .profile-introduction {
          display: grid;
          grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1.3fr);
          gap: 64px;
          padding: 72px 0;
          border-bottom: 1px solid var(--border);
        }

        .profile-introduction h2,
        .profile-section-heading h2,
        .profile-contact h2 {
          margin: 8px 0 0;
          font-size: clamp(34px, 5vw, 52px);
          line-height: 1.08;
          letter-spacing: -0.045em;
        }

        .profile-introduction-copy {
          color: var(--muted);
          font-size: 17px;
          line-height: 1.85;
        }

        .profile-introduction-copy p {
          margin: 0;
        }

        .profile-introduction-copy p + p {
          margin-top: 18px;
        }

        .profile-introduction-copy .lead {
          color: var(--foreground);
          font-size: 21px;
          line-height: 1.7;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border-bottom: 1px solid var(--border);
        }

        .profile-stats div {
          display: grid;
          gap: 8px;
          padding: 34px 26px;
        }

        .profile-stats div + div {
          border-left: 1px solid var(--border);
        }

        .profile-stats strong {
          font-size: clamp(30px, 4vw, 44px);
          letter-spacing: -0.04em;
        }

        .profile-stats span {
          color: var(--muted);
          font-size: 13px;
        }

        .profile-section,
        .profile-contact {
          padding-top: 82px;
        }

        .profile-section-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 0.8fr);
          gap: 48px;
          align-items: end;
        }

        .profile-section-heading .eyebrow {
          grid-column: 1 / -1;
          margin-bottom: -24px;
        }

        .profile-focus-grid,
        .profile-interest-grid {
          display: grid;
          gap: 18px;
          margin-top: 38px;
        }

        .profile-focus-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .profile-interest-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .profile-focus-grid article,
        .profile-interest-grid article {
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px;
          background: var(--surface);
        }

        .profile-focus-grid article > span {
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 12px;
        }

        .profile-focus-grid h3,
        .profile-interest-grid h3,
        .profile-principle-list h3 {
          margin: 18px 0 0;
          font-size: 22px;
        }

        .profile-focus-grid p,
        .profile-interest-grid p,
        .profile-principle-list p,
        .profile-contact p {
          margin: 12px 0 0;
          color: var(--muted);
          line-height: 1.75;
        }

        .profile-link-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 38px;
        }

        .profile-link-grid a {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px 18px;
          min-height: 148px;
          align-content: center;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 26px 28px;
          background: var(--surface);
          transition:
            transform 160ms ease,
            border-color 160ms ease;
        }

        .profile-link-grid a:hover {
          transform: translateY(-3px);
          border-color: var(--muted);
          text-decoration: none;
        }

        .profile-link-grid a > span:first-child {
          grid-column: 1;
          color: var(--muted);
          font-size: 13px;
        }

        .profile-link-grid strong {
          grid-column: 1;
          font-size: 20px;
        }

        .profile-link-grid a > span:last-child {
          grid-column: 2;
          grid-row: 1 / 3;
          align-self: center;
          font-size: 22px;
        }

        .profile-principle-list {
          display: grid;
          margin-top: 38px;
          border-top: 1px solid var(--border);
        }

        .profile-principle-list article {
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr);
          gap: 24px;
          border-bottom: 1px solid var(--border);
          padding: 28px 0;
        }

        .profile-principle-list article > span {
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 12px;
        }

        .profile-principle-list h3 {
          margin-top: 0;
        }

        .profile-contact {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 0.65fr);
          gap: 52px;
          align-items: end;
          margin-top: 82px;
          border-top: 1px solid var(--border);
        }

        .profile-contact-links {
          display: grid;
          gap: 10px;
        }

        .profile-contact-links a {
          border-top: 1px solid var(--border);
          padding: 13px 0;
          font-weight: 650;
        }

        @media (max-width: 820px) {
          .profile-hero {
            grid-template-columns: 132px minmax(0, 1fr);
            gap: 28px;
          }

          .profile-avatar {
            width: 132px;
            height: 132px;
          }

          .profile-introduction,
          .profile-section-heading,
          .profile-contact {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .profile-section-heading .eyebrow {
            margin-bottom: -14px;
          }

          .profile-focus-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .profile-page {
            padding-top: 12px;
          }

          .profile-hero {
            grid-template-columns: 92px minmax(0, 1fr);
            gap: 20px;
            padding: 28px 0 46px;
          }

          .profile-avatar {
            width: 92px;
            height: 92px;
          }

          .profile-identity h1 {
            font-size: clamp(42px, 13vw, 62px);
          }

          .profile-role {
            grid-column: 1 / -1;
            margin-top: 18px;
            font-size: 17px;
          }

          .profile-introduction,
          .profile-section,
          .profile-contact {
            padding-top: 58px;
          }

          .profile-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .profile-stats div:nth-child(3) {
            border-left: 0;
            border-top: 1px solid var(--border);
          }

          .profile-stats div:nth-child(4) {
            border-top: 1px solid var(--border);
          }

          .profile-interest-grid,
          .profile-link-grid {
            grid-template-columns: 1fr;
          }

          .profile-contact {
            margin-top: 58px;
          }
        }
      `}</style>
    </main>
  );
}
