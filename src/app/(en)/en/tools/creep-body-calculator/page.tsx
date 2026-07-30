import Link from "next/link";

import { Container } from "@/components/container";
import { EnglishCreepBodyCalculator } from "@/components/creep-body-calculator-en";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import "../../../english-tools.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Creep Body Calculator",
  description:
    "Build a Screeps Creep body and calculate Energy cost, spawn time, base hits, carry capacity, and loaded movement speed on roads, plains, and swamps.",
  path: "/en/tools/creep-body-calculator",
  chinesePath: "/tools/creep-body-calculator",
});

const relatedGuides = [
  {
    href: "/en/blog/screeps-dynamic-creep-body",
    label: "BODY DESIGN",
    title: "Build a Dynamic Screeps Creep Body Safely",
    description: "Turn an Energy budget into a bounded body without exceeding the 50-part limit.",
  },
  {
    href: "/en/blog/screeps-move-fatigue-body-ratio",
    label: "MOVEMENT",
    title: "Understand MOVE Parts, Fatigue, and Body Ratios",
    description: "Connect the calculator estimate to terrain cost and real movement behavior.",
  },
  {
    href: "/en/blog/screeps-spawncreep-return-codes",
    label: "DEBUGGING",
    title: "Debug spawnCreep Return Codes",
    description: "Check name, Energy, body, ownership, and Spawn state before changing production logic.",
  },
];

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

        <section className="tool-related-guides" aria-labelledby="body-tool-related-title">
          <p className="eyebrow">APPLY THE RESULT</p>
          <h2 id="body-tool-related-title">Continue from calculation to working code</h2>
          <div className="tool-related-grid">
            {relatedGuides.map((guide) => (
              <Link href={guide.href} key={guide.href}>
                <span>{guide.label}</span>
                <strong>{guide.title}</strong>
                <small>{guide.description}</small>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
