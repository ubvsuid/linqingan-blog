import Link from "next/link";

import { Container } from "@/components/container";
import { HaulingThroughputPlanner } from "@/components/hauling-throughput-planner";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import "../../../../screeps-planning-tools.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Hauling Throughput Planner",
  description: "Calculate CARRY payload, MOVE fatigue speed, round-trip time, Creeps required, lifetime delivery, and replacement timing for a Screeps hauling route.",
  path: "/en/tools/hauling-throughput-planner",
  chinesePath: "/tools/hauling-throughput-planner",
});

export default function HaulingThroughputPlannerPage() {
  const pageUrl = `${siteConfig.url}/en/tools/hauling-throughput-planner`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Hauling Throughput Planner",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "Plan Screeps hauling capacity from CARRY, MOVE, terrain, route length, and delivery demand.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/en/tools` },
          { "@type": "ListItem", position: 3, name: "Hauling Throughput Planner", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="Breadcrumb"><Link href="/en/tools">Tools</Link><span aria-hidden="true">/</span><span>Hauling Throughput Planner</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS LOGISTICS TOOL</p>
          <h1>Hauling Throughput Planner</h1>
          <p>Convert route distance, CARRY and MOVE parts, terrain, Boosts, loading overhead, and a required delivery rate into a cycle time, Creep count, lifetime delivery estimate, and replacement threshold.</p>
        </header>

        <HaulingThroughputPlanner locale="en" />

        <section className="planning-tool-notes" aria-labelledby="hauling-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="hauling-tool-boundaries-title">A route model cannot see traffic</h2></div>
          <div>
            <p>The loaded leg assumes every CARRY part contains resource. Empty CARRY parts do not add return-leg fatigue, while any additional non-MOVE parts remain weighted on both legs.</p>
            <p>Path changes, damaged MOVE parts, pull chains, hostile delays, source downtime, blocked transfer targets, and container capacity must still be checked in the live room.</p>
            <div className="planning-tool-links">
              <Link href="/en/blog/screeps-move-fatigue-body-ratio">Understand MOVE and fatigue ratios →</Link>
              <Link href="/en/blog/screeps-creep-withdraw-container-energy">Verify Container withdrawal logic →</Link>
              <a href="https://docs.screeps.com/creeps.html" rel="noreferrer" target="_blank">Official Creep movement documentation ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
