import Link from "next/link";

import { Container } from "@/components/container";
import { EnglishCreepBodyCalculator } from "@/components/creep-body-calculator-en";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Creep Body Calculator",
  description:
    "Build a Screeps Creep body and calculate Energy cost, spawn time, base hits, carry capacity, and loaded movement speed on roads, plains, and swamps.",
  path: "/en/tools/creep-body-calculator",
  chinesePath: "/tools/creep-body-calculator",
});

export default function EnglishCreepBodyCalculatorPage() {
  const pageUrl = `${siteConfig.url}/en/tools/creep-body-calculator`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Creep Body Calculator",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "Calculate Screeps Creep body cost, spawn time, hits, carry capacity, and loaded movement speed.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/en/tools` },
          { "@type": "ListItem", position: 3, name: "Creep Body Calculator", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell body-tool-page" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="body-tool-breadcrumb" aria-label="Breadcrumb">
          <Link href="/en/tools">Tools</Link><span aria-hidden="true">/</span><span>Creep Body Calculator</span>
        </nav>
        <header className="page-header body-tool-header">
          <p className="eyebrow">SCREEPS TOOL</p>
          <h1>Creep Body Calculator</h1>
          <p>Combine body parts and immediately calculate Energy cost, spawn time, base hits, carry capacity, and loaded movement. The current configuration is stored in the URL so it can be shared.</p>
        </header>

        <EnglishCreepBodyCalculator />

        <section className="body-tool-notes" aria-labelledby="body-tool-notes-en-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="body-tool-notes-en-title">Calculation boundaries</h2></div>
          <div>
            <p>The tool uses the official base body-part costs, 3 ticks of spawn time per part, 100 base hits per part, and the 50-part body limit.</p>
            <p>Movement assumes a fully loaded body where every non-MOVE part produces fatigue. Boosts, damage, empty CARRY parts, pulling, Power Creep effects, and the real path can change the observed result.</p>
            <div className="body-tool-links">
              <Link href="/en/screeps-errors">Review return codes →</Link>
              <a href="https://docs.screeps.com/creeps.html" rel="noreferrer" target="_blank">Official Screeps Creep documentation ↗</a>
            </div>
          </div>
        </section>
      </Container>
      <style>{`
        .body-tool-breadcrumb { display: flex; gap: 10px; margin-bottom: 28px; color: var(--muted); font-size: 13px; }
        .body-tool-header { max-width: 980px; }
        .body-tool-header > p:last-child { max-width: 820px; }
        .body-tool-notes { display: grid; grid-template-columns: minmax(220px, .65fr) minmax(0, 1.35fr); gap: 58px; margin-top: 78px; border-top: 1px solid var(--border); padding: 68px 0 30px; }
        .body-tool-notes h2 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 50px); letter-spacing: -.045em; }
        .body-tool-notes > div:last-child > p { margin: 0; color: var(--muted); line-height: 1.8; }
        .body-tool-notes > div:last-child > p + p { margin-top: 16px; }
        .body-tool-links { display: flex; flex-wrap: wrap; gap: 12px 20px; margin-top: 26px; }
        .body-tool-links a { font-weight: 680; }
        @media (max-width: 800px) { .body-tool-notes { grid-template-columns: 1fr; gap: 32px; } }
      `}</style>
    </main>
  );
}
