import type { Metadata } from "next";

import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于",
  description: "关于临清安与 linqingan.com。",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="page-shell">
      <Container className="narrow-container">
        <header className="page-header">
          <p className="eyebrow">ABOUT</p>
          <h1>关于我</h1>
        </header>

        <div className="article-content about-copy">
          <p className="lead">
            我是临清安。我喜欢构建能够持续运行、自动调度，并根据环境变化不断
            调整策略的系统。
          </p>

          <p>
            linqingan.com 用于记录我的 Screeps 自动化项目、JavaScript
            工程实践、网站建设，以及真实的开发和版本迭代过程。
          </p>

          <h2>我在做什么</h2>
          <p>
            目前主要开发 Screeps Contract Kernel。这个项目围绕任务调度、房间
            经济、资源预算、市场补能和异常恢复展开，并通过持续迭代逐步提高系统
            的稳定性与自动化程度。
          </p>

          <h2>为什么建立这个网站</h2>
          <p>
            代码会不断变化，但设计选择、失败原因和改进过程更值得长期保留。
            这个网站既是公开博客，也是我的项目档案与个人知识库。
          </p>

          <h2>写作原则</h2>
          <p>
            新手内容以解释、介绍和解惑为主，每篇优先解决一个当前会遇到的问题。
            更复杂的机制、架构和性能分析，会放在单独的进阶文章中。
          </p>

          <h2>联系</h2>
          <p>
            邮箱：
            <a href={`mailto:${siteConfig.author.email}`}>
              {siteConfig.author.email}
            </a>
          </p>
          <p>
            GitHub：
            <a href={siteConfig.links.github} rel="noreferrer" target="_blank">
              github.com/ubvsuid
            </a>
          </p>
        </div>
      </Container>
    </main>
  );
}
