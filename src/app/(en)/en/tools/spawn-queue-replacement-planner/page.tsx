import Link from "next/link";

import { Container } from "@/components/container";
import { SpawnQueueReplacementPlanner } from "@/components/spawn-queue-replacement-planner";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import "../../../../screeps-planning-tools.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Spawn Queue and Replacement Planner",
  description: "Estimate Spawn utilization, role replacement timing, prespawn TTL thresholds, and OPERATE_SPAWN capacity without connecting a Screeps account.",
  path: "/en/tools/spawn-queue-replacement-planner",
  chinesePath: "/tools/spawn-queue-replacement-planner",
});

export default function SpawnQueueReplacementPlannerPage() {
  const pageUrl = `${siteConfig.url}/en/tools/spawn-queue-replacement-planner`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Spawn Queue and Replacement Planner",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "Plan average Spawn utilization, role replacement timing, and prespawn thresholds from explicit Creep profiles.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/en/tools` },
          { "@type": "ListItem", position: 3, name: "Spawn Queue and Replacement Planner", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="Breadcrumb"><Link href="/en/tools">Tools</Link><span aria-hidden="true">/</span><span>Spawn Queue and Replacement Planner</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS SPAWN TOOL</p>
          <h1>Spawn Queue and Replacement Planner</h1>
          <p>Model several Creep roles at once, including body size, desired count, travel time, safety buffer, normal or CLAIM lifetime, available Spawns, and optional OPERATE_SPAWN.</p>
        </header>

        <SpawnQueueReplacementPlanner locale="en" />

        <section className="planning-tool-notes" aria-labelledby="spawn-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="spawn-tool-boundaries-title">Average capacity is not an exact queue</h2></div>
          <div>
            <p>The planner uses three base spawn ticks per body part, a 1,500-tick normal lifetime, and a 600-tick CLAIM lifetime. OPERATE_SPAWN is applied as a planning reduction and rounded up so the result does not underestimate the queue.</p>
            <p>Real production can still fail because replacement deadlines cluster, room Energy is not ready, a Spawn is disrupted, spawn directions are blocked, or queue priorities change.</p>
            <div className="planning-tool-links">
              <Link href="/en/blog/screeps-spawncreep-return-codes">Debug spawnCreep return codes →</Link>
              <Link href="/en/blog/screeps-emergency-harvester-recovery">Build an emergency recovery queue →</Link>
              <a href="https://docs.screeps.com/creeps.html" rel="noreferrer" target="_blank">Official Creep documentation ↗</a>
              <a href="https://docs.screeps.com/power.html" rel="noreferrer" target="_blank">Official Power documentation ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
