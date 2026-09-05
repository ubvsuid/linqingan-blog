import Link from "next/link";

import { Container } from "@/components/container";
import { ProblemResolver } from "@/components/problem-resolver";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Screeps 问题解决器",
  description: "通过确定性判断树排查 Spawn、Creep 移动、采集、Controller 升级与 CPU/Bucket 问题，再进入现有 Diagnostics、教程、工具、Tick Lab 与 Runtime Evidence 路径。",
  path: "/resolver",
});

export default function ProblemResolverPage() {
  return (
    <main className="page-shell">
      <Container>
        <nav className="resource-breadcrumb" aria-label="面包屑">
          <Link href="/diagnostics">故障诊断中心</Link><span aria-hidden="true">/</span><span>问题解决器</span>
        </nav>
        <header className="page-header">
          <p className="eyebrow">DETERMINISTIC PROBLEM SOLVING</p>
          <h1>一步一步定位 Screeps 问题</h1>
          <p>选择你看到的现象，回答少量可验证的问题。Resolver 不执行你的代码，也不猜测隐藏状态；它只根据你提供的运行事实进入确定分支，然后把你送回站内现有的 API、教程、工具、Tick Lab 与 accepted Runtime Evidence 路径。</p>
        </header>
        <aside className="error-tip">
          <strong>边界</strong>
          <p>这是只读、确定性的 V1。没有 AI 推断、没有任意 JavaScript 执行、没有数据库写入。遇到不确定状态时，流程会要求你先保存真实返回值。</p>
        </aside>
        <ProblemResolver locale="zh" />
      </Container>
    </main>
  );
}
