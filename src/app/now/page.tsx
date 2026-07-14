import type { Metadata } from "next";

import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "近况",
  description: "林清安最近正在开发、学习和关注的事情。",
  alternates: {
    canonical: "/now",
  },
};

export default function NowPage() {
  return (
    <main className="page-shell">
      <Container className="narrow-container">
        <header className="page-header">
          <p className="eyebrow">NOW · JULY 2026</p>
          <h1>Contract Kernel V7.3</h1>
          <p>这是一个会持续更新的近况页面。</p>
        </header>

        <div className="article-content">
          <h2>开发 Screeps Contract Kernel</h2>
          <p>
            Upgrader、Link、Terminal 和市场预算
          </p>

          <h2>重建个人博客</h2>
          <p>
            移除不必要的主题依赖，建立一套简单、可维护、以内容为中心的
            Next.js 网站。
          </p>

          <h2>正在学习</h2>
          <ul>
            <li>Next.js App Router 与内容工程化</li>
            <li>软件架构和长期运行系统设计</li>
            <li>AI 辅助编程工作流</li>
          </ul>
        </div>
      </Container>
    </main>
  );
}
