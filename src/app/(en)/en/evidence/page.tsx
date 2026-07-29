import Link from "next/link";

import { Container } from "@/components/container";
import evidencePriorities from "@/data/english-evidence-priorities.json";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Live Evidence Priorities",
  description:
    "Track the English Screeps guides that still need Console output, screenshots, or multi-tick live-room evidence, and contribute a reproducible observation.",
  path: "/en/evidence",
  chinesePath: "/verification",
});

function contributionHref(title: string, href: string, requestedEvidence: string[]) {
  const params = new URLSearchParams({
    title: `Live evidence: ${title}`,
    body: [
      "## Guide",
      `${siteConfig.url}${href}`,
      "",
      "## Evidence requested",
      ...requestedEvidence.map((item) => `- ${item}`),
      "",
      "## Test environment",
      "Server/shard, room, RCL, relevant object names, and tick range:",
      "",
      "## Reproduction steps",
      "",
      "## Console output or observations",
      "",
      "## Screenshot or log link",
      "",
      "## Redaction confirmation",
      "I removed account tokens, private credentials, and unrelated player information.",
    ].join("\n"),
  });

  return `${siteConfig.links.issues}?${params.toString()}`;
}

export default function EnglishEvidencePage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><Link href="/en/verification">Verification</Link><span aria-hidden="true">/</span><span>Evidence priorities</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">LIVE EVIDENCE BACKLOG</p>
          <h1>Core guides that still need live observations</h1>
          <p>These guides have documentation, syntax, or offline checks but still need reproducible Console output, screenshots, or multi-tick room observations. The backlog prevents publication from being mistaken for live verification.</p>
        </header>

        <div className={styles.notice}>
          <strong>Evidence is reviewed before a guide is marked live-tested.</strong>
          <p>A useful submission identifies the server or shard, room state, relevant object names, tick range, exact code or action, observed return values, and any limitations. Sensitive credentials must be removed.</p>
        </div>

        <section className={styles.knowledgeModules} aria-label="Priority evidence list">
          {evidencePriorities.map((item, index) => (
            <article className={styles.knowledgeModule} key={item.href}>
              <div className={styles.knowledgeModuleHeader}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2><Link href={item.href}>{item.title}</Link></h2>
                  <p>Status: live evidence not yet accepted. Requested observations:</p>
                  <ul>
                    {item.requestedEvidence.map((evidence) => <li key={evidence}>{evidence}</li>)}
                  </ul>
                  <a href={contributionHref(item.title, item.href, item.requestedEvidence)} rel="noreferrer" target="_blank">Submit reproducible evidence ↗</a>
                </div>
              </div>
            </article>
          ))}
        </section>
      </Container>
    </main>
  );
}
