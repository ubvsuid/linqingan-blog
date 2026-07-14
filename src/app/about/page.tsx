import type { Metadata } from "next";

import { Container } from "@/components/container";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于",
  description: "关于林清安与 linqingan.com。",
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
            我是林清安。我喜欢构建能够持续运行、自动调度，并根据环境变化
            调整策略的系统。
          </p>

          <p>
            linqingan.com 用于记录 Screeps、JavaScript、系统架构、网站建设
            和个人成长。我会尽量保留真实开发过程，而不仅是最终答案。
          </p>

          <h2>为什么建立这个网站</h2>
          <p>
            代码会不断变化，但设计决策、失败原因和改进过程更值得长期保留。
            这个网站既是公开博客，也是我的项目档案和知识库。
          </p>

          <h2>联系</h2>
          <p>
            邮箱：linqingan501@gmail.com
            <a href={`mailto:${siteConfig.author.email}`}>
              {siteConfig.author.email}
            </a>
          </p>
        </div>
      </Container>
    </main>
  );
}
