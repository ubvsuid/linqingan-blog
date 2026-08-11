import Link from "next/link";

import { Container } from "@/components/container";
import { RelatedErrorDiagnostics } from "@/components/related-error-diagnostics";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import {
  getVerifiedContentSummary,
  getVerifiedContentWithEvidence,
  type VerifiedEvidencePreview,
} from "@/lib/verified-content";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "Recently Verified Screeps Guides",
  description:
    "Browse English Screeps guides whose shared source records include accepted Console testing or live multi-tick room verification.",
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
  const parts: string[] = [evidence.evidenceKey, evidence.apiName];
  if (evidence.returnCode) parts.push(`returned ${evidence.returnCode}`);
  if (evidence.gameTime !== null) parts.push(`Game.time ${evidence.gameTime}`);
  if (evidence.tickStart !== null && evidence.tickEnd !== null) {
    parts.push(`ticks ${evidence.tickStart}–${evidence.tickEnd}`);
  }
  return parts.join(" · ");
}

export default async function EnglishVerifiedPage() {
  const verifiedPosts = await getVerifiedContentWithEvidence("en");
  const { liveCount, consoleCount } = getVerifiedContentSummary(verifiedPosts);

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en/knowledge">Knowledge Base</Link>
          <span aria-hidden="true">/</span>
          <Link href="/en/verification">Verification</Link>
          <span aria-hidden="true">/</span>
          <span>Recently verified</span>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">RECENTLY VERIFIED</p>
          <h1>Screeps guides with recorded runtime evidence</h1>
          <p>
            Documentation review and offline simulation do not automatically count as live proof. A guide appears here only after its shared Markdown verification state explicitly accepts Console or live multi-tick evidence; structured evidence then adds bounded runtime detail.
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
        </section>

        {verifiedPosts.length > 0 ? (
          <section className={styles.knowledgeModules} aria-label="Verified guides">
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
                    {post.latestEvidence ? (
                      <p>
                        <strong>Latest structured evidence:</strong>{" "}
                        {formatEvidencePreview(post.latestEvidence)} · {post.latestEvidence.note}
                      </p>
                    ) : null}
                    <RelatedErrorDiagnostics href={post.href} locale="en" variant="compact" />
                    <p><Link href={post.href}>Open guide verification status →</Link></p>
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
