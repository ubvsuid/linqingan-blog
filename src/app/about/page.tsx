import Link from "next/link";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "关于",
  description:
    "了解临清安、这个网站为什么建立，以及 Screeps 新手内容与后续专业内容的写作原则。",
  path: "/about",
});

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

export default function AboutPage() {
  return (
    <main className="page-shell about-page">
      <Container className="narrow-container">
        <header className="page-header">
          <p className="eyebrow">ABOUT</p>
          <h1>关于</h1>
          <p>这里是临清安的个人技术网站，主要记录 Screeps 中文学习内容与系统实践。</p>
        </header>

        <section className="about-intro article-content">
          <p className="lead">
            我希望把 Screeps 中容易让新手困惑的内容，整理成一条可以按顺序学习、可以直接对照游戏验证的中文路线。
          </p>
          <p>
            当前网站首先完成了 12 篇 Screeps 新手入门文章。它们从认识游戏开始，一直到 Creep
            分工、升级 Controller、建造 Extension、建造维修和第一份房间基础代码。
          </p>
          <p>
            后续内容会逐步进入 Screeps 基础工程、自动化系统、JavaScript
            工程实践与软件架构，但不会把这些复杂内容硬塞进入门系列。
          </p>
        </section>

        <section className="about-principles" aria-labelledby="about-principles-title">
          <div className="about-section-heading">
            <p className="eyebrow">EDITORIAL PRINCIPLES</p>
            <h2 id="about-principles-title">写作原则</h2>
          </div>
          <div className="about-principle-list">
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

        <section className="about-contact" aria-labelledby="about-contact-title">
          <div>
            <p className="eyebrow">CONTACT</p>
            <h2 id="about-contact-title">联系与纠错</h2>
            <p>
              发现文章存在错误、表述不清或示例代码有问题时，可以通过邮箱或 GitHub 联系。
            </p>
          </div>
          <div className="about-contact-links">
            <a href={`mailto:${siteConfig.author.email}`}>
              {siteConfig.author.email}
            </a>
            <a href={siteConfig.links.github} rel="noreferrer" target="_blank">
              GitHub ↗
            </a>
            <Link href="/projects">查看项目 →</Link>
          </div>
        </section>
      </Container>

      <style>{`
        .about-intro {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 42px 0;
        }

        .about-principles,
        .about-contact {
          padding-top: 72px;
        }

        .about-section-heading h2,
        .about-contact h2 {
          margin: 0;
          font-size: clamp(34px, 5vw, 50px);
          line-height: 1.1;
          letter-spacing: -0.045em;
        }

        .about-principle-list {
          display: grid;
          margin-top: 34px;
          border-top: 1px solid var(--border);
        }

        .about-principle-list article {
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr);
          gap: 24px;
          border-bottom: 1px solid var(--border);
          padding: 28px 0;
        }

        .about-principle-list article > span {
          color: var(--muted);
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
          font-size: 12px;
        }

        .about-principle-list h3 {
          margin: 0;
          font-size: 22px;
        }

        .about-principle-list p,
        .about-contact p {
          margin: 10px 0 0;
          color: var(--muted);
        }

        .about-contact {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(240px, 0.65fr);
          gap: 48px;
          align-items: end;
        }

        .about-contact-links {
          display: grid;
          gap: 10px;
        }

        .about-contact-links a {
          border-top: 1px solid var(--border);
          padding: 13px 0;
          font-weight: 650;
        }

        @media (max-width: 640px) {
          .about-contact {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }
      `}</style>
    </main>
  );
}
