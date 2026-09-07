import Link from "next/link";

import { Container } from "@/components/container";
import { ProblemResolver } from "@/components/problem-resolver";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { getKnowledgeClusterHandoffSignals } from "@/lib/knowledge-cluster-handoff";
import {
  buildKnowledgeGraphV1,
  getKnowledgeGraphCoverage,
} from "@/lib/knowledge-graph-v1";
import { buildProblemResolverGraphPaths } from "@/lib/problem-resolver-graph";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Problem Resolver",
  description: "Use deterministic decision trees for Spawn, movement, harvesting, Controller upgrading, and CPU/Bucket problems, then continue into existing diagnostics, guides, tools, Tick Lab, and accepted Runtime Evidence.",
  path: "/en/resolver",
  chinesePath: "/resolver",
});

export default function EnglishProblemResolverPage() {
  const graph = buildKnowledgeGraphV1();
  const graphCoverage = getKnowledgeGraphCoverage(graph);
  const relatedPathsByStep = buildProblemResolverGraphPaths("en", graph);
  const clusterHandoffs = getKnowledgeClusterHandoffSignals("en");

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en/diagnostics">Diagnostic Center</Link><span aria-hidden="true">/</span><span>Problem Resolver</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">DETERMINISTIC PROBLEM SOLVING</p>
          <h1>Work from the observed state to the next check</h1>
          <p>Choose the behavior you can see and answer a small set of verifiable questions. The resolver does not execute your code or infer hidden state; it follows deterministic branches and hands the result back to the existing API, guide, tool, Tick Lab, and accepted Runtime Evidence paths.</p>
        </header>
        <div className={styles.notice}>
          <strong>Boundary</strong>
          <p>This is a read-only deterministic V1: no AI inference, arbitrary JavaScript execution, or database writes. When state is unknown, the flow asks you to capture the real return value first.</p>
        </div>
        <div className={styles.notice}>
          <strong>Knowledge Graph V1 is connected</strong>
          <p>
            The resolver now consumes the same read-only graph semantics: {graphCoverage.nodes} nodes, {graphCoverage.edges} relations, and {graphCoverage.unmapped} unmapped items.
            {" "}<Link href="/en/knowledge/coverage">Open Knowledge Coverage →</Link>
          </p>
        </div>
        <ProblemResolver
          locale="en"
          relatedPathsByStep={relatedPathsByStep}
          clusterHandoffs={clusterHandoffs}
        />
      </Container>
    </main>
  );
}
