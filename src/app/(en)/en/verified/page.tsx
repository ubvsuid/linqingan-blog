import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import {
  getVerifiedContentSummary,
  getVerifiedContentWithEvidence,
  type VerifiedEvidencePreview,
} from "@/lib/verified-content";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Runtime Evidence Hub",
  description:
    "Inspect accepted Screeps Console and live multi-tick runtime evidence with API, return-code, environment, verification-time, and linked-guide context.",
  path: "/en/verified",
  chinesePath: "/verified",
});

export const revalidate = 300;

function formatEnglishDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatEvidencePreview(evidence: VerifiedEvidencePreview): string {
  const parts: string[] = [evidence.type === "live" ? "Live Runtime" : "Screeps Console", evidence.apiName];
  if (evidence.returnCode) parts.push(`returned ${evidence.returnCode}`);
  if (evidence.shard) parts.push(evidence.shard);
  if (evidence.roomName) parts.push(evidence.roomName);
  if (evidence.gameTime !== null) parts.push(`Game.time ${evidence.gameTime}`);
  if (evidence.tickStart !== null && evidence.tickEnd !== null) {
    parts.push(`ticks ${evidence.tickStart}–${evidence.tickEnd}`);
  }
  parts.push(`verified ${formatEnglishDate(evidence.verifiedAt.slice(0, 10))}`);
  return parts.join(" · ");
}

export default async function EnglishVerifiedPage() {
  const verifiedPosts = await getVerifiedContentWithEvidence("en");
  const { liveCount, consoleCount } = getVerifiedContentSummary(verifiedPosts);
  const evidenceCount = verifiedPosts.reduce((total, post) => total + post.evidenceCount, 0);

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en/knowledge">Knowledge Base</Link>
          <span aria-hidden="true">/</span>
          <Link href="/en/verification">Verification</Link>
          <span aria-hidden="true">/</span>
          <span>Runtime Evidence Hub</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">RUNTIME EVIDENCE HUB</p>
          <h1>Was this Screeps conclusion actually run?</h1>
          <p>
            This hub connects accepted guide claims to Screeps Console or live multi-tick runtime evidence. You can inspect the runtime level, API, return code, environment, verification time, and recorded observation instead of treating documentation review or offline simulation as live proof.
          </p>
          <p>
            <Link href="/en/diagnostics">Start from a symptom →</Link>{" · "}
            <Link href="/en/search">Search APIs and return codes →</Link>{" · "}
            <Link href="/en/verification">Read the verification boundary →</Link>
          </p>
        </header>

        <section className={styles.grid} aria-label="Verification summary">
          <article className={styles.card}>
            <p className="eyebrow">CONSOLE TESTED</p>
            <h2>{consoleCount}</h2>
            <p>English guides mapped to source articles with accepted Screeps Console testing.</p>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">LIVE MULTI-TICK</p>
            <h2>{liveCount}</h2>
            <p>English guides mapped to source articles with accepted live multi-tick room evidence.</p>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">ACCEPTED EVIDENCE</p>
            <h2>{evidenceCount}</h2>
            <p>Structured runtime records that also pass the guide-level Markdown acceptance boundary.</p>
          </article>
        </section>

        {verifiedPosts.length > 0 ? (
          <section className={styles.knowledgeModules} aria-label="Runtime evidence records">
            {verifiedPosts.map((post, index) => (
              <article className={styles.knowledgeModule} key={post.id}>
                <div className={styles.knowledgeModuleHeader}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="eyebrow">
                      {post.level === "live" ? "LIVE MULTI-TICK" : "SCREEPS CONSOLE"}
                    </p>
                    <h2><Link href={post.href}>{post.title}</Link></h2>
                    <p>{post.description}</p>
                    <small>
                      Verified {formatEnglishDate(post.date)}
                      {post.testEnvironment ? ` · ${post.testEnvironment}` : ""}
                      {post.evidenceCount > 0 ? ` · ${post.evidenceCount} structured evidence record${post.evidenceCount === 1 ? "" : "s"}` : ""}
                    </small>
                    {post.evidence.length > 0 ? (
                      <div>
                        <strong>Accepted Runtime Evidence</strong>
                        {post.evidence.slice(0, 4).map((evidence) => (
                          <p key={evidence.evidenceKey}>
                            {formatEvidencePreview(evidence)}{evidence.note ? ` · ${evidence.note}` : ""}
                          </p>
                        ))}
                      </div>
                    ) : post.latestEvidence ? (
                      <p>
                        <strong>Latest Runtime Evidence:</strong>{" "}
                        {formatEvidencePreview(post.latestEvidence)}{post.latestEvidence.note ? ` · ${post.latestEvidence.note}` : ""}
                      </p>
                    ) : null}
                    <p>
                      <Link href={post.href}>Open guide verification status →</Link>{" · "}
                      <Link href={`/en/search?q=${encodeURIComponent(post.evidence[0]?.apiName ?? post.title)}`}>Continue troubleshooting →</Link>
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className={styles.notice}>
            <strong>No public English guide currently has mapped Console or live multi-tick verification.</strong>
            <p>
              Real runtime evidence may be captured internally first, but a guide appears here only after the corresponding Markdown verification state is reviewed and accepted.
            </p>
            <Link href="/en/evidence">Open the live-evidence backlog →</Link>
          </section>
        )}
      </Container>
    </main>
  );
}
