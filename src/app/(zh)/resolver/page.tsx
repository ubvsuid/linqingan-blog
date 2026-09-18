import Link from "next/link";

import { Container } from "@/components/container";
import { ProblemResolver } from "@/components/problem-resolver";
import { ScreepsDoctor } from "@/components/screeps-doctor";
import { getKnowledgeClusterHandoffSignals } from "@/lib/knowledge-cluster-handoff";
import {
  buildKnowledgeGraphV1,
  getKnowledgeGraphCoverage,
} from "@/lib/knowledge-graph-v1";
import { buildProblemResolverGraphPaths } from "@/lib/problem-resolver-graph";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Screeps 问题解决器",
  description: "通过确定性判断树排查 Spawn、Creep 移动、采集、Controller 升级与 CPU/Bucket 问题，再进入现有 Diagnostics、教程、工具、Tick Lab 与 Runtime Evidence 路径。",
  path: "/resolver",
});

export default function ProblemResolverPage() {
  const graph = buildKnowledgeGraphV1();
  const graphCoverage = getKnowledgeGraphCoverage(graph);
  const relatedPathsByStep = buildProblemResolverGraphPaths("zh", graph);
  const clusterHandoffs = getKnowledgeClusterHandoffSignals("zh");

  return (
    <main className="page-shell monochrome-system-page solve-system-page resolver-monochrome-page">
      <Container>
        <nav className="resource-breadcrumb" aria-label="面包屑">
          <Link href="/diagnostics">故障诊断中心</Link><span aria-hidden="true">/</span><span>问题解决器</span>
        </nav>
        <header className="page-header solve-system-hero">
          <p className="eyebrow">DOCTOR / GUIDED RESOLVER</p>
          <h1>Solve the problem.</h1>
          <p>有结构化 Snapshot，就让 Doctor 先读事实；只有症状或真实返回值，就进入 Guided Resolver。两条路径都坚持确定性判断，并最终回到 Diagnosis → Fix → Verify。</p>
        </header>
        <nav className="solve-mode-index" aria-label="选择解决方式">
          <Link href="#screeps-doctor"><span>01</span><strong>Doctor</strong><small>Snapshot → observed facts → diagnosis → fix → verify</small></Link>
          <Link href="#problem-resolver-zh"><span>02</span><strong>Guided Resolver</strong><small>Symptom → checks → return code → next action</small></Link>
        </nav>
        <section className="solve-system-boundary" aria-label="Resolver safety boundary">
          <div><span>BOUNDARY</span><p>不执行任意 JavaScript，也不会写入 Runtime Evidence 或你的 Screeps 业务状态。为改进流程，只记录受限、匿名的结构化 Resolver 事件；不接收自由文本、IP、Referer、User-Agent 或地理位置。Session Verification 也不会自动进入 public Runtime Evidence。</p></div>
          <div><span>KNOWLEDGE GRAPH</span><p>{graphCoverage.nodes} nodes · {graphCoverage.edges} relations · {graphCoverage.unmapped} unmapped。 <Link href="/knowledge/coverage">Coverage →</Link></p></div>
        </section>
        <ScreepsDoctor locale="zh" />
        <ProblemResolver
          locale="zh"
          relatedPathsByStep={relatedPathsByStep}
          clusterHandoffs={clusterHandoffs}
        />
      </Container>
    </main>
  );
}
