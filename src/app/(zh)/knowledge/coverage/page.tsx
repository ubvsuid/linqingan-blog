import Link from "next/link";

import { Container } from "@/components/container";
import {
  buildKnowledgeGraphV1,
  getKnowledgeGraphCoverage,
} from "@/lib/knowledge-graph-v1";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Screeps Knowledge Graph Coverage",
  description:
    "查看 linqingan.com Knowledge Graph V1 的节点、关系、未映射项与 Runtime Evidence 边界。该页面只展示现有权威数据的只读派生覆盖。",
  path: "/knowledge/coverage",
  noindex: true,
});

const nodeTypeLabels = {
  Article: "文章",
  BeginnerLesson: "新手课程",
  API: "API",
  ReturnCode: "返回码",
  Symptom: "症状",
  Tool: "工具",
  TickLabExperiment: "Tick Lab 实验",
  RuntimeEvidence: "Runtime Evidence",
} as const;

const relationLabels = {
  explains: "解释 API",
  usesApi: "使用 API",
  returns: "可能返回",
  involvesApi: "涉及 API",
  solvedBy: "可由…解决",
  testedBy: "由实验验证",
  evidencedBy: "由证据支持",
  prerequisiteOf: "前置于",
  relatedTo: "相关",
} as const;

export default function KnowledgeGraphCoveragePage() {
  const graph = buildKnowledgeGraphV1();
  const coverage = getKnowledgeGraphCoverage(graph);

  return (
    <main className="page-shell">
      <Container>
        <nav className="resource-breadcrumb" aria-label="面包屑">
          <Link href="/knowledge">知识库</Link>
          <span aria-hidden="true">/</span>
          <span>Knowledge Graph Coverage</span>
        </nav>

        <header className="page-header">
          <p className="eyebrow">KNOWLEDGE GRAPH V1</p>
          <h1>Knowledge Graph Coverage</h1>
          <p>
            这里不是第二套内容数据库。Graph V1 只把现有 Article、Beginner、API、ReturnCode、
            Diagnostics、Tools、Tick Lab 与 accepted Runtime Evidence 投影成统一节点和关系。
          </p>
        </header>

        <aside className="error-tip">
          <strong>当前边界</strong>
          <p>
            静态生成物不持久化 Runtime Evidence；运行时只允许 accepted evidence
            通过只读适配器挂接。当前未映射项必须保持为 0，任何缺失 owner 或断裂关系都会让完整性检查失败。
          </p>
        </aside>

        <section aria-labelledby="graph-overview">
          <h2 id="graph-overview">覆盖概览</h2>
          <ul>
            <li><strong>{coverage.nodes}</strong> 个静态节点</li>
            <li><strong>{coverage.edges}</strong> 条确定性关系</li>
            <li><strong>{coverage.unmapped}</strong> 个未映射项</li>
            <li>Runtime Evidence：<strong>{coverage.runtimeEvidenceMode}</strong></li>
          </ul>
        </section>

        <section aria-labelledby="graph-node-types">
          <h2 id="graph-node-types">节点覆盖</h2>
          <ul>
            {Object.entries(coverage.byNodeType).map(([type, count]) => (
              <li key={type}>
                <strong>{nodeTypeLabels[type as keyof typeof nodeTypeLabels]}</strong>：{count}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="graph-relations">
          <h2 id="graph-relations">关系覆盖</h2>
          <ul>
            {Object.entries(coverage.byRelation).map(([relation, count]) => (
              <li key={relation}>
                <strong>{relationLabels[relation as keyof typeof relationLabels]}</strong>：{count}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="graph-governance">
          <h2 id="graph-governance">治理规则</h2>
          <ul>
            <li>Graph 只读派生，不创建第二套 canonical truth。</li>
            <li>节点使用 durable identity；href 只是 locator。</li>
            <li>生成物必须 deterministic，且由 repository integrity gate 校验 freshness。</li>
            <li>Runtime Evidence 只接受 public accepted boundary，不接收 candidate / rejected。</li>
          </ul>
          <p>
            <Link href="/resolver">返回 Problem Resolver →</Link>
          </p>
        </section>
      </Container>
    </main>
  );
}
