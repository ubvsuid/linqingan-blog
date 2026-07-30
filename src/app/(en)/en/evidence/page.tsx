import Link from "next/link";

import { Container } from "@/components/container";
import evidencePriorityData from "@/data/english-evidence-priorities.json";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import styles from "../english.module.css";

type EvidenceStatus = "needed" | "submitted" | "under-review" | "accepted";

type EvidencePriority = {
  href: string;
  title: string;
  status: EvidenceStatus;
  lastReviewedAt: string;
  requestedEvidence: string[];
  submissionUrl?: string;
  submittedAt?: string;
  acceptedAt?: string;
  observedAt?: string;
  testEnvironment?: string;
  tickRange?: string;
  evidenceLinks?: string[];
  limitations?: string;
};

const evidencePriorities = evidencePriorityData as EvidencePriority[];

const statusDetails: Record<EvidenceStatus, { label: string; explanation: string }> = {
  "needed": {
    label: "Evidence needed",
    explanation: "No live submission has been accepted. Documentation, syntax, or offline checks may still exist.",
  },
  "submitted": {
    label: "Submitted",
    explanation: "A contributor supplied evidence, but it has not been reviewed or accepted.",
  },
  "under-review": {
    label: "Under review",
    explanation: "A submission is being checked for reproducibility, scope, privacy, and limitations.",
  },
  "accepted": {
    label: "Accepted",
    explanation: "The linked observation passed review. Its claim remains limited to the recorded environment.",
  },
};

export const metadata = createEnglishPageMetadata({
  title: "Screeps Live Evidence Priorities",
  description:
    "Track the English Screeps guides that still need Console output, screenshots, or multi-tick live-room evidence, and contribute a reproducible observation.",
  path: "/en/evidence",
  chinesePath: "/verification",
});

function contributionHref(title: string) {
  const params = new URLSearchParams({
    template: "live-evidence.yml",
    title: `Live evidence: ${title}`,
  });

  return `${siteConfig.links.issues}?${params.toString()}`;
}

export default function EnglishEvidencePage() {
  const statusCounts = evidencePriorities.reduce<Record<EvidenceStatus, number>>(
    (counts, item) => ({ ...counts, [item.status]: counts[item.status] + 1 }),
    { "needed": 0, "submitted": 0, "under-review": 0, "accepted": 0 },
  );
  const lastReviewedAt = evidencePriorities
    .map((item) => item.lastReviewedAt)
    .sort()
    .at(-1);

  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/en/verification">Verification</Link>
          <span aria-hidden="true">/</span>
          <span>Evidence priorities</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">LIVE EVIDENCE BACKLOG</p>
          <h1>Core guides that still need live observations</h1>
          <p>These guides have documentation, syntax, or offline checks but still need reproducible Console output, screenshots, or multi-tick room observations. The backlog prevents publication from being mistaken for live verification.</p>
        </header>

        <div className={styles.notice}>
          <strong>Evidence is reviewed before a guide is marked live-tested.</strong>
          <p>A useful submission identifies the server or shard, room state, relevant object names, tick range, exact code or action, observed return values, and any limitations. Sensitive credentials must be removed.</p>
          <p>
            Backlog status: {statusCounts.needed} needed, {statusCounts.submitted} submitted,{" "}
            {statusCounts["under-review"]} under review, and {statusCounts.accepted} accepted.
            {lastReviewedAt ? ` Last reviewed ${lastReviewedAt}.` : ""}
          </p>
          <Link href="/en/evidence/status.json">View the machine-readable status →</Link>
        </div>

        <section className={styles.knowledgeModules} aria-label="Priority evidence list">
          {evidencePriorities.map((item, index) => {
            const details = statusDetails[item.status];

            return (
              <article className={styles.knowledgeModule} key={item.href}>
                <div className={styles.knowledgeModuleHeader}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <div className={styles.statusRow}>
                      <span className={styles.statusBadge}>{details.label}</span>
                      <small>Reviewed {item.lastReviewedAt}</small>
                    </div>
                    <h2><Link href={item.href}>{item.title}</Link></h2>
                    <p>{details.explanation}</p>
                    <p>Requested observations:</p>
                    <ul>
                      {item.requestedEvidence.map((evidence) => <li key={evidence}>{evidence}</li>)}
                    </ul>
                    {item.status === "accepted" ? (
                      <div className={styles.acceptedEvidenceScope}>
                        <strong>Accepted scope</strong>
                        <dl>
                          <div><dt>Environment</dt><dd>{item.testEnvironment}</dd></div>
                          <div><dt>Tick range</dt><dd>{item.tickRange}</dd></div>
                          <div><dt>Observed</dt><dd>{item.observedAt}</dd></div>
                          <div><dt>Accepted</dt><dd>{item.acceptedAt}</dd></div>
                          <div><dt>Limitations</dt><dd>{item.limitations}</dd></div>
                        </dl>
                        <ul>
                          {item.evidenceLinks?.map((href, evidenceIndex) => (
                            <li key={href}>
                              <a href={href} rel="noreferrer" target="_blank">
                                Open accepted evidence {evidenceIndex + 1} ↗
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className={styles.evidenceActions}>
                      <Link href={item.href}>Read the guide</Link>
                      {item.status === "needed" ? (
                        <a href={contributionHref(item.title)} rel="noreferrer" target="_blank">Submit reproducible evidence ↗</a>
                      ) : item.submissionUrl ? (
                        <a href={item.submissionUrl} rel="noreferrer" target="_blank">
                          Review evidence provenance ↗
                        </a>
                      ) : null}
                    </div>
                    <small>Guide URL to include in the form: {siteConfig.url}{item.href}</small>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </Container>
    </main>
  );
}
