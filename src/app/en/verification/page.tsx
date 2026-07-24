import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "How Screeps Guides Are Verified",
  description:
    "Understand the verification levels used on Linqingan Screeps guides: official documentation checks, JavaScript syntax checks, offline simulation, Console testing, and live multi-tick room testing.",
  path: "/en/verification",
  chinesePath: "/verification",
});

const levels = [
  ["Official documentation checked", "The API name, arguments, return values, limits, and timing rules are compared with current official documentation."],
  ["JavaScript syntax checked", "Code is parsed or type-checked so that basic syntax and obvious type mistakes are caught before publication."],
  ["Offline simulation passed", "Relevant branches are exercised with controlled mock data when a full Screeps runtime is not required."],
  ["Screeps Console tested", "The example or probe is executed in the Screeps Console and the observed return value is recorded."],
  ["Live multi-tick test completed", "The behavior is observed in a real room across multiple ticks, including state changes and edge conditions."],
] as const;

export default function EnglishVerificationPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Verification</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">VERIFICATION METHOD</p>
          <h1>Evidence is reported by level</h1>
          <p>
            A code example can be syntactically valid without being proven in a live colony. The site separates documentation review, offline checks, Console tests, and multi-tick room evidence instead of treating them as the same claim.
          </p>
        </header>

        <ol className={styles.list}>
          {levels.map(([title, description], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{title}</strong><p>{description}</p></div>
            </li>
          ))}
        </ol>

        <section className={styles.grid} style={{ marginTop: 48 }}>
          <article className={styles.card}>
            <p className="eyebrow">TRANSPARENCY</p>
            <h2>Pending tests remain visible</h2>
            <p>If a guide has not been tested in the Console or in a live room, that status should remain pending rather than being inferred from documentation alone.</p>
          </article>
          <article className={styles.card}>
            <p className="eyebrow">SAFETY</p>
            <h2>Read-only probes come first</h2>
            <p>Diagnostics should begin with object reads, return-code logging, and state snapshots before spawning, moving, trading, destroying, or modifying Memory.</p>
          </article>
        </section>
      </Container>
    </main>
  );
}
