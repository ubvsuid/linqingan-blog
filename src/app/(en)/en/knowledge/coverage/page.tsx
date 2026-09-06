import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import {
  buildKnowledgeGraphV1,
  getKnowledgeGraphCoverage,
} from "@/lib/knowledge-graph-v1";

import styles from "../../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Knowledge Graph Coverage",
  description:
    "Inspect Knowledge Graph V1 node, relation, unmapped, and accepted Runtime Evidence coverage derived from the site's existing authoritative sources.",
  path: "/en/knowledge/coverage",
  chinesePath: "/knowledge/coverage",
  noindex: true,
});

export default function EnglishKnowledgeGraphCoveragePage() {
  const graph = buildKnowledgeGraphV1();
  const coverage = getKnowledgeGraphCoverage(graph);

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en/knowledge">Knowledge Base</Link>
          <span aria-hidden="true">/</span>
          <span>Knowledge Graph Coverage</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">KNOWLEDGE GRAPH V1</p>
          <h1>Knowledge Graph Coverage</h1>
          <p>
            Graph V1 is a read-only projection over the existing article, Beginner,
            API, return-code, diagnostics, tool, Tick Lab, and accepted Runtime Evidence
            sources. It does not become a second canonical database.
          </p>
        </header>

        <div className={styles.notice}>
          <strong>Boundary</strong>
          <p>
            Static graph output never persists Runtime Evidence. Only accepted public
            evidence can be attached through the runtime adapter, and unresolved mappings
            fail repository integrity checks.
          </p>
        </div>

        <section className={styles.grid} aria-label="Knowledge Graph coverage summary">
          <article className={styles.card}>
            <p className="eyebrow">NODES</p>
            <h2>{coverage.nodes}</h2>
            <p>Static durable nodes across the eight V1 node types.</p>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">RELATIONS</p>
            <h2>{coverage.edges}</h2>
            <p>Deterministic relations derived from existing source registries.</p>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">UNMAPPED</p>
            <h2>{coverage.unmapped}</h2>
            <p>Must remain zero for the fail-closed integrity gate to pass.</p>
          </article>
        </section>

        <section className={styles.knowledgeModule}>
          <h2>Node coverage</h2>
          <ul>
            {Object.entries(coverage.byNodeType).map(([type, count]) => (
              <li key={type}><strong>{type}</strong>: {count}</li>
            ))}
          </ul>
        </section>

        <section className={styles.knowledgeModule}>
          <h2>Relation coverage</h2>
          <ul>
            {Object.entries(coverage.byRelation).map(([relation, count]) => (
              <li key={relation}><strong>{relation}</strong>: {count}</li>
            ))}
          </ul>
          <p><Link href="/en/resolver">Back to the Problem Resolver →</Link></p>
        </section>
      </Container>
    </main>
  );
}
