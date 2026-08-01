import Link from "next/link";

import { Container } from "@/components/container";
import { MarketTerminalCalculator } from "@/components/market-terminal-calculator";
import { createEnglishPageMetadata } from "@/lib/english-metadata";
import { siteConfig } from "@/lib/site";

import "../../../../screeps-planning-tools.css";

export const metadata = createEnglishPageMetadata({
  title: "Screeps Market and Terminal Cost Calculator",
  description: "Calculate Terminal transfer Energy, Market deal effective price, and the 5% order creation fee without connecting a Screeps account.",
  path: "/en/tools/market-terminal-cost-calculator",
  chinesePath: "/tools/market-terminal-cost-calculator",
});

export default function MarketTerminalCostCalculatorPage() {
  const pageUrl = `${siteConfig.url}/en/tools/market-terminal-cost-calculator`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Screeps Market and Terminal Cost Calculator",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: "Calculate Screeps Terminal transaction Energy, effective Market deal prices, and order fees.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/en/tools` },
          { "@type": "ListItem", position: 3, name: "Market and Terminal Cost Calculator", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="page-shell planning-tool-page" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container>
        <nav className="planning-tool-breadcrumb" aria-label="Breadcrumb"><Link href="/en/tools">Tools</Link><span aria-hidden="true">/</span><span>Market and Terminal Cost Calculator</span></nav>
        <header className="page-header">
          <p className="eyebrow">SCREEPS MARKET TOOL</p>
          <h1>Market and Terminal Cost Calculator</h1>
          <p>Compare Terminal transfer Energy, Market deal value after transport, and order creation fees. Every configuration is stored in the URL and calculated locally in the browser.</p>
        </header>

        <MarketTerminalCalculator locale="en" />

        <section className="planning-tool-notes" aria-labelledby="market-tool-boundaries-title">
          <div><p className="eyebrow">BOUNDARIES</p><h2 id="market-tool-boundaries-title">Use the number as a preflight check</h2></div>
          <div>
            <p>The room parser supports standard World room names. Private servers with modified map rules or constants may produce different results.</p>
            <p>The player who executes a Market deal pays the transaction Energy and Terminal cooldown. The tool does not inspect a live order, room, store, cooldown, or Credits balance.</p>
            <div className="planning-tool-links">
              <Link href="/en/knowledge/market-advanced-resources">Browse Market and advanced-resource guides →</Link>
              <Link href="/en/blog/screeps-market-deal">Validate and execute a Market deal →</Link>
              <a href="https://docs.screeps.com/market.html" rel="noreferrer" target="_blank">Official Market documentation ↗</a>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
