import type { Metadata } from "next";

import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "近况",
  description: "临清安最近正在开发、学习和关注的事情。",
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
          <h1>最近在做什么</h1>
          <p>更新于 2026 年 7 月，这个页面会随着当前重点持续变化。</p>
        </header>

        <div className="article-content">
          <h2>开发 Screeps Contract Kernel V7.3</h2>
          <p>
            当前目标是通过市场购买能量，提高 Upgrader 的持续工作时间，并让房间
            更稳定地冲击 RCL8。
          </p>
          <ul>
            <li>市场价格、采购数量和 Credits 保留预算</li>
            <li>Storage 与 Terminal 的能量分配</li>
            <li>Upgrader 动态扩容与 Spawn 调度</li>
            <li>Link 能量流转和异常恢复</li>
          </ul>

          <h2>建设个人技术博客</h2>
          <p>
            持续完善 linqingan.com，把 Screeps 新手解惑、项目版本记录和进阶
            架构内容整理成清晰、可检索的文章体系。
          </p>

          <h2>正在学习</h2>
          <ul>
            <li>Next.js App Router 与内容工程化</li>
            <li>长期运行系统的架构、监控和恢复设计</li>
            <li>AI 辅助编程与代码审查工作流</li>
          </ul>
        </div>
      </Container>
    </main>
  );
}
