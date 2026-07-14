import type { Metadata } from "next";

import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "项目",
  description: "Screeps Contract Kernel V7.3。",
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
          <h2>Screeps Contract Kernel</h2>
          <p className="project-summary">
            一个围绕合同任务、房间经济、Spawn 调度、市场采购和自动冲级
            构建的 Screeps 自动化系统。
          </p>

          <dl className="project-data">
            <div>
              <dt>当前方向</dt>
              <dd>稳定自动运营</dd>
            </div>
            <div>
              <dt>市场购买能量、提高升级效率、稳定冲击 RCL8</dt>
              <dd>市场补能与 RCL8 冲刺</dd>
            </div>
            <div>
              <dt>JavaScript / 状态机 / 任务调度 / 资源预算</dt>
              <dd>JavaScript / 状态机 / 任务调度</dd>
            </div>
            <div>
              <dt>记录方式</dt>
              <dd>架构文章 / 版本日志 / 失败复盘</dd>
            </div>
          </dl>
        </article>
      </Container>
    </main>
  );
}
