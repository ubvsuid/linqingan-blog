import Link from "next/link";

import { Container } from "@/components/container";
import { ErrorCodeExplorer } from "@/components/error-code-explorer";
import { ScreepsErrorDiagnosticNetwork } from "@/components/screeps-error-diagnostic-network";
import { createPageMetadata } from "@/lib/metadata";
import { screepsErrorCodes } from "@/lib/screeps-errors";

export const revalidate = 300;

export const metadata = createPageMetadata({
  title: "Screeps 错误码查询",
  description: "查询 Screeps API 常见返回值，了解 ERR_NOT_IN_RANGE、ERR_FULL、ERR_INVALID_TARGET 等错误的原因、排查顺序，以及关联 API、对象 Hub、教程、工具和验证路径。",
  path: "/screeps-errors",
});

export default function ScreepsErrorsPage() {
  return (
    <main className="page-shell">
      <Container>
        <nav className="resource-breadcrumb" aria-label="面包屑"><Link href="/knowledge">知识库</Link><span aria-hidden="true">/</span><span>错误码查询</span></nav>
        <header className="page-header"><p className="eyebrow">ERROR CODES</p><h1>Screeps 错误码查询</h1><p>Screeps 的多数动作不会抛出异常，而是返回一个数字。先保存返回值，再根据错误码进入对应诊断路径，继续检查 API、对象状态、距离、资源、工具与后续 tick。</p></header>
        <aside className="error-tip"><strong>推荐调试方式</strong><code>const result = creep.harvest(source); console.log(result);</code><p>不要只看 Creep 有没有行动。把返回值打印出来，通常能更快找到问题；高频错误可以直接从下方诊断网络继续排查。</p></aside>
        <ScreepsErrorDiagnosticNetwork locale="zh" />
        <ErrorCodeExplorer codes={screepsErrorCodes} />
      </Container>
      <style>{`
        .resource-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .error-tip { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px 24px; margin-bottom: 28px; border: 1px solid var(--border); border-radius: 18px; padding: 22px; background: var(--surface); }
        .error-tip code { overflow-x: auto; color: var(--foreground); }
        .error-tip p { grid-column: 2; margin: 0; color: var(--muted); }
        @media (max-width: 680px) { .error-tip { grid-template-columns: 1fr; } .error-tip p { grid-column: 1; } }
      `}</style>
    </main>
  );
}
