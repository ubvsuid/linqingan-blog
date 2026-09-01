import Link from "next/link";

import { Container } from "@/components/container";
import { VerificationCaptureQueue } from "@/components/verification-capture-queue";
import { VerificationCoverage } from "@/components/verification-coverage";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";
import { siteConfig } from "@/lib/site";
import { verificationCoveragePlans } from "@/lib/verification-coverage";

import styles from "../../english.module.css";

export const revalidate = 300;

export const metadata = createEnglishPageMetadata({
  title: "Screeps Verification Coverage and Evidence Priorities",
  description: "See which high-frequency Screeps diagnostic paths have accepted Console or live multi-tick verification, what evidence is still missing, and which real runtime checks should come next.",
  path: "/en/verification/coverage",
  chinesePath: "/verification/coverage",
});

export default function EnglishVerificationCoveragePage() {
  const pageUrl = `${siteConfig.url}/en/verification/coverage`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Screeps Verification Coverage and Evidence Priorities",
        url: pageUrl,
        inLanguage: "en",
        description: "Accepted runtime verification coverage and next-evidence gaps for symptom-first Screeps diagnostic paths.",
        mainEntity: { "@id": `${pageUrl}#coverage` },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#coverage`,
        numberOfItems: verificationCoveragePlans.length,
        itemListElement: verificationCoveragePlans.map((plan, index) => {
          const symptom = screepsDiagnosticSymptoms.find((item) => item.id === plan.symptomId);
          return {
            "@type": "ListItem",
            position: index + 1,
            name: symptom?.enTitle ?? plan.symptomId,
            url: `${pageUrl}#coverage-${plan.symptomId}`,
          };
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Verification", item: `${siteConfig.url}/en/verification` },
          { "@type": "ListItem", position: 3, name: "Coverage", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className={styles.page} lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/en/verification">Verification</Link><span aria-hidden="true">/</span><span>Coverage</span>
        </nav>
        <header className={styles.header}>
          <p className="eyebrow">VERIFICATION COVERAGE</p>
          <h1>Find the evidence gap before running the next test</h1>
          <p>This page does not treat published content as verified by default. It maps the Phase 4B symptom paths to Errors, APIs, Object Hubs, Guides, and Tools, then calculates current coverage through the existing accepted Verification boundary.</p>
        </header>
        <div className={styles.notice}>
          <strong>Current rule</strong>
          <p>Evidence strength and coverage completeness stay separate. Without accepted Console or live multi-tick evidence, a path remains unverified; documentation review, offline simulation, or a database row cannot promote it on their own.</p>
        </div>
        <VerificationCaptureQueue locale="en" />
        <VerificationCoverage locale="en" />
      </Container>
    </main>
  );
}
