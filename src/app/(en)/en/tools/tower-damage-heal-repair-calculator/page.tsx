import Link from "next/link";

import { Container } from "@/components/container";
import { TowerPowerCalculator } from "@/components/tower-power-calculator";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import "../../../../screeps-planning-tools.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Tower Damage, Heal, and Repair Calculator",
  description: "Calculate Screeps Tower range falloff, combined attack, heal or repair power, Energy use, target ticks, and optional OPERATE_TOWER output.",
  path: "/en/tools/tower-damage-heal-repair-calculator",
  chinesePath: "/tools/tower-damage-heal-repair-calculator",
});

export default function TowerDamageHealRepairCalculatorPage() {
  const pageUrl = `${siteConfig.url}/en/tools/tower-damage-heal-repair-calculator`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Tower Damage, Heal, and Repair Calculator",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "Calculate standard Screeps Tower attack, heal, and repair output across range and Energy limits.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/en/tools` },
          { "@type": "ListItem", position: 3, name: "Tower Damage, Heal, and Repair Calculator", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="Breadcrumb"><Link href="/en/tools">Tools</Link><span aria-hidden="true">/</span><span>Tower Power Calculator</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS DEFENSE TOOL</p>
          <h1>Tower Damage, Heal, and Repair Calculator</h1>
          <p>Calculate range falloff, per-Tower output, combined volleys, Energy use, optional OPERATE_TOWER power, and the net ticks required after entering opposing healing, damage, or decay.</p>
        </header>

        <TowerPowerCalculator locale="en" />

        <section className="planning-tool-notes" aria-labelledby="tower-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="tower-tool-boundaries-title">Raw Tower power is not combat resolution</h2></div>
          <div>
            <p>The tool uses standard Tower power, full output through range 5, linear falloff to range 20, and 10 Energy per action. It assumes all selected Towers can submit the same action every tick.</p>
            <p>Combat still depends on TOUGH ordering and Boosts, hostile healing, target movement, ramparts, Safe Mode, action conflicts, Tower Energy distribution, and accepted intents.</p>
            <div className="planning-tool-links">
              <Link href="/en/blog/screeps-tower-auto-attack-hostiles">Build verifiable Tower attack logic →</Link>
              <Link href="/en/blog/screeps-tower-repair-threshold">Set a staged repair threshold →</Link>
              <a href="https://docs.screeps.com/defense.html" rel="noreferrer" target="_blank">Official defense documentation ↗</a>
              <a href="https://docs.screeps.com/power.html" rel="noreferrer" target="_blank">Official Power documentation ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
