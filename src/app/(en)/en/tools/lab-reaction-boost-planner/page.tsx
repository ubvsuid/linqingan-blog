import Link from "next/link";

import { Container } from "@/components/container";
import { LabReactionBoostPlanner } from "@/components/lab-reaction-boost-planner";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import "../../../../screeps-planning-tools.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Lab Reaction and Boost Planner",
  description: "Plan Screeps compound reaction chains, base minerals, Lab runs, sequential ticks, Boost mineral, and Boost Energy without connecting an account.",
  path: "/en/tools/lab-reaction-boost-planner",
  chinesePath: "/tools/lab-reaction-boost-planner",
});

export default function LabReactionBoostPlannerPage() {
  const pageUrl = `${siteConfig.url}/en/tools/lab-reaction-boost-planner`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Lab Reaction and Boost Planner",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "Plan Screeps Lab reactions, compound chains, production ticks, and Creep Boost batches.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/en/tools` },
          { "@type": "ListItem", position: 3, name: "Lab Reaction and Boost Planner", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="Breadcrumb"><Link href="/en/tools">Tools</Link><span aria-hidden="true">/</span><span>Lab Reaction and Boost Planner</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS LAB TOOL</p>
          <h1>Lab Reaction and Boost Planner</h1>
          <p>Expand a target compound into its full reaction chain, base minerals, parallel output-Lab runs, and sequential cooldown time. Switch to Boost mode to size a complete batch for multiple Creeps.</p>
        </header>

        <LabReactionBoostPlanner locale="en" />

        <section className="planning-tool-notes" aria-labelledby="lab-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="lab-tool-boundaries-title">Separate chemistry from room logistics</h2></div>
          <div>
            <p>The estimate models chemistry and Lab cooldowns. It does not model Hauler travel, reagent refill timing, Lab placement, range checks, mineral capacity, interrupted Power effects, or competing reactions.</p>
            <p>Boost mode uses 30 compound and 20 Energy per boosted body part. A body part can receive only one compound, and live boost results still depend on the selected Creep and Lab state.</p>
            <div className="planning-tool-links">
              <Link href="/en/knowledge/market-advanced-resources">Browse Lab, Boost, and resource guides →</Link>
              <Link href="/en/tools/creep-body-calculator">Calculate the Creep body first →</Link>
              <a href="https://docs.screeps.com/resources.html" rel="noreferrer" target="_blank">Official resource and Boost documentation ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
