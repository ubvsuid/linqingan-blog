import type { Metadata } from "next";

import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "项目",
  description: "临清安正在开发的 Screeps Contract Kernel V7.3。",
  alternates: {
    canonical: "/projects",
  },
};

export default function ProjectsPage() {
  return (
    <main className="page-shell">
      <Container>
        <header className="page-header">
          <p className="eyebrow">PROJECTS</p>
          <h1>项目</h1>
          <p>把长期开发过程整理成可阅读、可追踪的项目档案。</p>
        </header>

        <article className="project-feature">
          <div className="project-topline">
            <span className="status-dot" aria-hidden="true" />
            <span>持续开发中</span>
          </div>
          <h2>Screeps Contract Kernel V7.3</h2>
          <p className="project-summary">
            一个围绕合同任务、房间经济、Spawn 调度、市场能量采购、Link
            调度和 Upgrader 扩容构建的 Screeps 自动化系统。
          </p>

          <dl className="project-data">
            <div>
              <dt>当前版本</dt>
              <dd>V7.3 All-In Market Rush</dd>
            </div>
            <div>
              <dt>近期目标</dt>
              <dd>通过市场补能提高升级效率，稳定冲击 RCL8</dd>
            </div>
            <div>
              <dt>核心技术</dt>
              <dd>JavaScript / 状态机 / 任务调度 / 资源预算</dd>
            </div>
            <div>
              <dt>主要模块</dt>
              <dd>Spawn / Market / Link / Terminal / Upgrader</dd>
            </div>
            <div>
              <dt>记录内容</dt>
              <dd>架构说明 / 版本日志 / 性能分析 / 失败复盘</dd>
            </div>
          </dl>
        </article>
      </Container>
    </main>
  );
}
