import Link from "next/link";

import { Container } from "@/components/container";
import { ControllerUpgraderPlanner } from "@/components/controller-upgrader-planner";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import "../../../../screeps-planning-tools.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Controller Downgrade and Upgrader Planner",
  description: "Estimate Controller downgrade margin, Upgrader Energy use, Boosted progress, RCL8 caps, and time to a target without connecting a Screeps account.",
  path: "/en/tools/controller-downgrade-planner",
  chinesePath: "/tools/controller-downgrade-planner",
});

export default function ControllerDowngradePlannerPage() {
  const pageUrl = `${siteConfig.url}/en/tools/controller-downgrade-planner`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Controller Downgrade and Upgrader Planner",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "Plan Controller downgrade safety margins and Upgrader throughput from explicit room assumptions.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/en/tools` },
          { "@type": "ListItem", position: 3, name: "Controller Downgrade Planner", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="Breadcrumb"><Link href="/en/tools">Tools</Link><span aria-hidden="true">/</span><span>Controller Downgrade Planner</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS CONTROLLER TOOL</p>
          <h1>Controller Downgrade and Upgrader Planner</h1>
          <p>Turn a live Controller snapshot into a readable safety margin and Upgrader throughput estimate. Model WORK parts, upgrade Boosts, effective uptime, RCL8 limits, and optional OPERATE_CONTROLLER capacity.</p>
        </header>

        <ControllerUpgraderPlanner locale="en" />

        <section className="planning-tool-notes" aria-labelledby="controller-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="controller-tool-boundaries-title">Keep the Controller snapshot separate from the plan</h2></div>
          <div>
            <p>The tool does not assume that an Upgrader reaches the Controller, receives Energy, or successfully submits an upgrade intent every tick. Use the effective-upgrading percentage to represent the full delivery and movement system.</p>
            <p>Wall-clock time is only an estimate because Screeps tick duration changes with server load. Treat the live ticksToDowngrade value as the source of truth.</p>
            <div className="planning-tool-links">
              <Link href="/en/blog/screeps-upgrade-controller">Build a verifiable Upgrader loop →</Link>
              <Link href="/en/knowledge/controllers-expansion">Browse Controller and expansion guides →</Link>
              <a href="https://docs.screeps.com/control.html" rel="noreferrer" target="_blank">Official Controller documentation ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
